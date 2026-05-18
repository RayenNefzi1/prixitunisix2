"""
Product Matching Engine
========================
Matches a scraped item to an existing product in the DB using a 3-tier strategy:

  Tier 1 — REFERENCE MATCH  (confidence: 1.0)
    Normalize both refs → exact string match.
    Most reliable: same product, guaranteed.

  Tier 2 — NAME + MODEL MATCH  (confidence: 0.85–0.95)
    If no ref: compare brand + model extracted from name.
    E.g. "Apple MacBook Air M3 13 8GB 256GB" matches
         "MacBook Air 13-inch M3 8 Go 256 Go".
    BUT: Must have matching key specs (RAM, storage, etc.) to match.

  Tier 3 — FUZZY NAME MATCH  (confidence: 0.70–0.85)
    RapidFuzz token_set_ratio on cleaned names.
    Only used when tiers 1&2 fail.
    Results below FUZZY_THRESHOLD go to product_matches for admin review.
    BUT: Must have matching key specs to auto-accept.

  NEW PRODUCT  (confidence: 0.0)
    Nothing matched → create a new product record.
"""

import logging
import re
from rapidfuzz import fuzz, process

from utils.cleaner import (
    normalize_reference,
    normalize_text,
    clean_name,
    build_match_key,
    extract_keywords,
)

logger = logging.getLogger(__name__)

KEY_SPEC_PATTERNS = {
    "ram": [
        r"(\d+)\s*go\b",
        r"(\d+)\s*gb\b",
        r"ram\s*(\d+)",
    ],
    "storage": [
        r"(\d+)\s*(?:go|tb)\s*(?:ssd|hdd|nvme|stockage)?",
        r"(\d+)\s*go(?:\s|$)",
        r"(\d+)\s*tb(?!\b)",
    ],
}


def extract_key_specs(specs: dict, name: str = "", ref: str = "") -> dict:
    """
    Extract key specs from specs dict, product name, AND reference.
    Returns dict with 'ram' and 'storage' normalized values (in GB).
    """
    result = {}
    names_text = (name or "") + " " + (ref or "")
    
    if specs:
        for k, v in specs.items():
            k_lower = k.lower()
            v_str = str(v).lower()
            
            if "ram" in k_lower or "memoire" in k_lower:
                m = re.search(r"(\d+)", v_str)
                if m:
                    result["ram"] = int(m.group(1))
            
            elif "stockage" in k_lower or "disque" in k_lower or "capacity" in k_lower:
                m = re.search(r"(\d+)", v_str)
                if m:
                    val = int(m.group(1))
                    if "to" in v_str or "tb" in k_lower:
                        val = val * 1024
                    result["storage"] = val
    
    if "ram" not in result or "storage" not in result:
        text = names_text.lower()
        
        vals = {}
        for m in re.finditer(r"(\d+)\s*(?:go|gb)\b", text):
            vals[int(m.group(1))] = "go"
        for m in re.finditer(r"(\d+)\s*tb\b", text):
            vals[int(m.group(1)) * 1024] = "tb"
        
        if vals:
            go_vals = sorted([v for v, u in vals.items() if u == "go"])
            
            if len(go_vals) >= 2:
                if "ram" not in result:
                    result["ram"] = go_vals[0]
                if "storage" not in result:
                    result["storage"] = go_vals[-1]
            elif len(go_vals) == 1:
                val = go_vals[0]
                if val <= 8:
                    if "ram" not in result:
                        result["ram"] = val
                else:
                    if "storage" not in result:
                        result["storage"] = val
    
    return result


def specs_match(specs1: dict, specs2: dict, name1: str = "", name2: str = "", ref1: str = "", ref2: str = "", require_exact: bool = False) -> bool:
    """
    Compare two specs dicts. Returns True if key specs match.
    If require_exact=True, both products must have the exact same specs present.
    If require_exact=False (default), matching on at least one key spec is enough,
    unless both have different values for the same spec.
    """
    s1 = extract_key_specs(specs1, name1, ref1)
    s2 = extract_key_specs(specs2, name2, ref2)
    
    if not s1 and not s2:
        return True
    
    for spec_type in ["ram", "storage"]:
        v1 = s1.get(spec_type)
        v2 = s2.get(spec_type)
        
        if v1 and v2:
            if abs(v1 - v2) > (v2 * 0.1 if require_exact else 0):
                logger.info(f"  [SpecCheck] FAIL: {spec_type} differs: {v1} vs {v2}")
                return False
    
    if require_exact:
        for spec_type in ["ram", "storage"]:
            v1 = s1.get(spec_type)
            v2 = s2.get(spec_type)
            if (v1 is None) != (v2 is None):
                logger.info(f"  [SpecCheck] FAIL: {spec_type} present mismatch: {v1} vs {v2}")
                return False
    
    return True


# ── Thresholds ────────────────────────────────────────────────────
FUZZY_AUTO_ACCEPT   = 88   # auto-accept, create offer directly
FUZZY_NEEDS_REVIEW  = 72   # send to product_matches for admin review
# Below FUZZY_NEEDS_REVIEW → treat as new product


class ProductMatcher:
    def __init__(self, products: list[dict]):
        """
        products: list of dicts from DB (id, name, reference, model, brand, category)
        """
        self.products = products
        self._build_indexes()

    def _build_indexes(self):
        """Pre-build lookup structures for fast matching."""
        # Reference index: normalized_ref → product
        self.ref_index: dict[str, dict] = {}
        for p in self.products:
            if p.get("reference"):
                key = normalize_reference(p["reference"])
                if key:
                    self.ref_index[key] = p

        # EAN index: ean → product (manufacturer barcode)
        self.ean_index: dict[str, dict] = {}
        for p in self.products:
            if p.get("ean"):
                key = p["ean"].strip()
                if key:
                    self.ean_index[key] = p

        # Name index: list of (match_key, product) for fuzzy search
        self.name_corpus: list[tuple[str, dict]] = []
        for p in self.products:
            key = build_match_key(p["name"], p.get("brand"), p.get("model"))
            if key:
                self.name_corpus.append((key, p))

        logger.info(f"[Matcher] Index built: {len(self.ref_index)} refs, {len(self.ean_index)} eans, {len(self.name_corpus)} names")

    def match(self, item: dict) -> dict:
        """
        Match a scraped item to a DB product.
        Returns the item dict enriched with:
          matched_product_id, match_method, confidence_score
        
        Match priority:
        1. Reference (exact)
        2. EAN (manufacturer barcode)
        """
        # ── Tier 1: Reference ────────────────────────────────────
        # Only match by reference if it looks like a real product reference (not URL ID)
        ref = item.get("reference", "")
        is_url_id = ref.isdigit() and len(ref) < 10  # Skip pure numeric IDs from URLs
        
        if item.get("reference") and not is_url_id:
            norm_ref = normalize_reference(item["reference"])
            if norm_ref and norm_ref in self.ref_index:
                p = self.ref_index[norm_ref]
                logger.info(f"  [Match] REF '{norm_ref}' → product_id={p['id']} '{p['name'][:40]}'")
                item["matched_product_id"] = p["id"]
                item["match_method"]       = "reference"
                item["confidence_score"]   = 1.0
                return item

        # ── Tier 2: EAN (manufacturer barcode) ───────────────────
        if item.get("ean"):
            ean = item["ean"].strip()
            if ean and ean in self.ean_index:
                p = self.ean_index[ean]
                logger.info(f"  [Match] EAN '{ean}' → product_id={p['id']} '{p['name'][:40]}'")
                item["matched_product_id"] = p["id"]
                item["match_method"]       = "ean"
                item["confidence_score"]   = 1.0
                return item

        # ── Tier 3: Model match (strict - exact model required) ─────
        item_model = item.get("model") or _extract_model_from_name(item.get("name", ""))
        if item_model and len(item_model) >= 5:
            for p in self.products:
                db_model = p.get("model") or ""
                if db_model and normalize_text(item_model) == normalize_text(db_model):
                    logger.info(f"  [Match] MODEL '{item_model}' → product_id={p['id']} '{p['name'][:40]}'")
                    item["matched_product_id"] = p["id"]
                    item["match_method"]       = "model"
                    item["confidence_score"]   = 0.95
                    return item

        # ── Tier 4: Fuzzy name matching (fallback when no reference) ─────
        if not item.get("reference") or item.get("match_method") != "reference":
            # Only use fuzzy matching as fallback
            item_keywords = extract_keywords(item.get("name", ""))
            item_brand = normalize_text(item.get("brand") or "")
            
            best_match = None
            best_score = 0
            
            for p in self.products:
                db_name = p.get("name") or ""
                db_keywords = extract_keywords(db_name)
                db_brand = normalize_text(p.get("brand") or "")
                
                # Must have same brand for fuzzy match
                if item_brand and db_brand and item_brand != db_brand:
                    continue
                
                if not item_keywords or not db_keywords:
                    continue
                
                # Calculate keyword overlap
                overlap = item_keywords & db_keywords
                score = len(overlap)
                
                # Must have at least 3 matching keywords
                if score >= 3 and score > best_score:
                    best_score = score
                    best_match = p
            
            if best_match:
                logger.info(f"  [Match] FUZZY '{item.get('name', '')[:30]}' → product_id={best_match['id']} '{best_match['name'][:40]}' (score: {best_score})")
                item["matched_product_id"] = best_match["id"]
                item["match_method"]       = "fuzzy_keywords"
                item["confidence_score"]   = 0.75
                return item

        # ── No match - will create new product ───────────────────
        logger.info(f"  [Match] No match - will create new product: {item.get('name', '')[:40]}")
        return item
        
        model = item.get("model") or _extract_model_from_name(item.get("name", ""))
        
        for p in self.products:
            db_name = p.get("name") or ""
            db_keywords = extract_keywords(db_name)
            
            matched = False
            
            if model and len(model) >= 4:
                norm_model = normalize_text(model)
                db_model = normalize_text(p.get("model") or "")
                if norm_model and (norm_model in db_model or norm_model in normalize_text(db_name)):
                    matched = True
            
            if not matched and item_keywords and db_keywords:
                item_brand = normalize_text(item.get("brand") or "")
                db_brand = normalize_text(p.get("brand") or "")
                
                brand_match = item_brand and db_brand and item_brand == db_brand
                
                item_model = model or ""
                db_model = normalize_text(p.get("model") or "")
                model_match = item_model and db_model and len(item_model) >= 3 and item_model in db_model
                
                overlap = item_keywords & db_keywords
                
                if brand_match and model_match:
                    matched = True
                elif brand_match and len(overlap) >= 5:
                    matched = True
            
            if matched:
                item_brand = normalize_text(item.get("brand") or "")
                db_brand   = normalize_text(p.get("brand") or "")
                brand_ok   = (not item_brand) or (not db_brand) or (item_brand == db_brand)
                if brand_ok:
                    db_specs = p.get("specs") or {}
                    item_name = item.get("name") or ""
                    item_ref = item.get("reference") or ""
                    db_ref = p.get("reference") or ""
                    if not specs_match(item_specs, db_specs, item_name, db_name, item_ref, db_ref):
                        continue
                    logger.info(f"  [Match] KEYWORDS/MODEL → product_id={p['id']} '{p['name'][:40]}'")
                    item["matched_product_id"] = p["id"]
                    item["match_method"]       = "title_keywords"
                    item["confidence_score"]   = 0.90
                    return item

        # ── Tier 3: Fuzzy name ───────────────────────────────────
        item_specs = item.get("specs") or {}
        if self.name_corpus:
            query = build_match_key(
                item.get("name", ""),
                item.get("brand"),
                item.get("model"),
            )

            if query:
                corpus_keys = [c[0] for c in self.name_corpus]
                result = process.extractOne(
                    query,
                    corpus_keys,
                    scorer=fuzz.token_set_ratio,
                    score_cutoff=FUZZY_NEEDS_REVIEW,
                )

                if result:
                    best_key, score, idx = result
                    p = self.name_corpus[idx][1]
                    db_specs = p.get("specs") or {}
                    confidence = round(score / 100, 2)

                    item_name = item.get("name") or ""
                    db_name = p.get("name") or ""
                    item_ref = item.get("reference") or ""
                    db_ref = p.get("reference") or ""
                    
                    if score >= FUZZY_AUTO_ACCEPT:
                        item_brand = normalize_text(item.get("brand") or "")
                        db_brand = normalize_text(p.get("brand") or "")
                        brand_match = item_brand and db_brand and item_brand == db_brand
                        
                        if not brand_match:
                            logger.info(f"  [Match] FUZZY {score:.0f}% brand mismatch → NEW")
                            item["matched_product_id"] = None
                            item["match_method"]       = "new"
                            item["confidence_score"]   = 0.0
                            return item
                        
                        if not specs_match(item_specs, db_specs, item_name, db_name, item_ref, db_ref, require_exact=True):
                            logger.info(f"  [Match] FUZZY {score:.0f}% specs mismatch → NEW")
                            item["matched_product_id"] = None
                            item["match_method"]       = "new"
                            item["confidence_score"]   = 0.0
                            return item
                        logger.info(f"  [Match] FUZZY {score:.0f}% '{query[:40]}' → product_id={p['id']}")
                        item["matched_product_id"] = p["id"]
                        item["match_method"]       = "fuzzy"
                        item["confidence_score"]   = confidence
                    else:
                        if not specs_match(item_specs, db_specs, item_name, db_name, item_ref, db_ref):
                            logger.info(f"  [Match] FUZZY LOW {score:.0f}% specs conflict → NEW")
                            item["matched_product_id"] = None
                            item["match_method"]       = "new"
                            item["confidence_score"]   = 0.0
                            return item
                        logger.info(f"  [Match] FUZZY LOW {score:.0f}% '{query[:40]}' → needs review")
                        item["matched_product_id"] = p["id"]
                        item["match_method"]       = "fuzzy_review"
                        item["confidence_score"]   = confidence

                    return item

        # ── New product ──────────────────────────────────────────
        logger.info(f"  [Match] NEW product: '{item.get('name', '')[:50]}'")
        item["matched_product_id"] = None
        item["match_method"]       = "new"
        item["confidence_score"]   = 0.0
        return item


def _extract_model_from_name(name: str) -> str | None:
    """
    Try to pull a model number out of a product name.
    E.g. "Samsung Galaxy S24 Ultra" → "S24"
         "MacBook Air MNE03FN/A" → "MNE03FN"
         "RTX 4070 Super" → "RTX4070"
         "Xiaomi Redmi 15C" → "REDMI15C"
    """
    if not name:
        return None
    
    matches = re.findall(r"\b([A-Z]{1,8}[\-]?\d{1,6}[A-Z0-9\-/]{0,8})\b", name.upper())
    if matches:
        return matches[0]
    
    matches = re.findall(r"\b(Redmi\s*\d+[A-Z]?|iPhone\s*\d+|Galaxy\s+[A-Z]?\d+|MacBook\s+[A-Z]+\d+)", name, re.IGNORECASE)
    if matches:
        return matches[0].replace(" ", "").upper()
    
    return None