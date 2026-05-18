"""
Text cleaning and normalization utilities.
Used by both scrapers (to clean raw HTML data) and the matching engine.
"""

import re
import unicodedata


# ── Brand list for extraction ─────────────────────────────────────
KNOWN_BRANDS = [
    "apple", "samsung", "hp", "dell", "lenovo", "asus", "acer", "msi",
    "lg", "sony", "huawei", "xiaomi", "oppo", "realme", "oneplus",
    "microsoft", "google", "intel", "amd", "nvidia", "gigabyte", "adata",
    "kingston", "seagate", "western digital", "wd", "sandisk", "corsair",
    "logitech", "razer", "steelseries", "benq", "philips", "hisense",
    "tcl", "toshiba", "epson", "canon", "brother", "xerox",
]

# ── Words that add noise but don't identify a product ────────────
NOISE_WORDS = {
    "tunisianet", "mytek", "sbs", "zoom", "technopro",
    "promotion", "promo", "solde", "neuf", "new", "original",
    "import", "garantie", "warranty", "officiel", "official",
    "livraison", "gratuite", "free", "shipping",
}

# ── Reference / SKU patterns ─────────────────────────────────────
REF_PATTERNS = [
    # e.g. "Réf: MNE03FN/A" or "Ref : ABC-123" or "Référence: ABC123"
    r"[Rr][eé][fF](?:\.|:)?\s*([A-Z0-9][\w\-/\.]{3,30})",
    # e.g. "SKU: MNE03FN"
    r"[Ss][Kk][Uu]\s*:?\s*([A-Z0-9][\w\-/\.]{3,20})",
    # e.g. "MPN: MNE03FN"
    r"[Mm][Pp][Nn]\s*:?\s*([A-Z0-9][\w\-/\.]{3,20})",
    # e.g. "Code: MNE03FN" or "Code produit: MNE03FN"
    r"[Cc]ode(?:\s+produit)?:?\s*([A-Z0-9][\w\-/\.]{3,20})",
    # standalone uppercase alphanumeric token that looks like a ref - more precise
    r"\b([A-Z]{2,5}[\-]?[0-9]{2,8}[\-]?[A-Z0-9]{0,5})\b",
]


def normalize_text(text: str) -> str:
    """Lowercase, strip accents, collapse whitespace."""
    if not text:
        return ""
    text = str(text).lower().strip()
    # Remove accents
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text)
    return text


def clean_name(raw: str) -> str:
    """
    Clean a raw product title:
    - Remove merchant names, promo words
    - Normalize whitespace and punctuation
    - Keep brand + model info
    """
    if not raw:
        return ""
    text = normalize_text(raw)
    # Remove noise words
    for word in NOISE_WORDS:
        text = re.sub(r"\b" + re.escape(word) + r"\b", " ", text)
    # Remove standalone special chars
    text = re.sub(r"[|»«•·—–]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_keywords(text: str) -> set:
    """
    Extract significant keywords from product name.
    Returns a set of meaningful words (brand, model, specs).
    """
    if not text:
        return set()
    
    text = normalize_text(text)
    
    keywords = set()
    
    for word in text.split():
        word = word.strip(r"-/\.,")
        if len(word) >= 2 and word not in NOISE_WORDS:
            if re.match(r"^[\w]+$", word):
                keywords.add(word)
    
    return keywords


def extract_price(raw: str) -> float | None:
    """
    Parse a price string like '1 490 TND' or '1490,00 dt' -> 1490.0
    Tunisian format: comma is decimal separator
    """
    if not raw:
        return None
    raw = re.sub(r"(TND|DT|dt|tnd|dinars?)", "", raw, flags=re.IGNORECASE)
    raw = raw.replace(" ", "").replace("\xa0", "")

    if "," in raw:
        parts = raw.split(",")
        if len(parts) == 2:
            before = parts[0]
            after = parts[1]
            # Tunisian format: 39,000 = 39 (thousands separator)
            # 569,000 = 569 (not 569000)
            if after.isdigit() and len(after) == 3:
                # Remove thousands separator: 39,000 -> 39
                raw = before
            elif len(parts) > 2:
                raw = "".join(parts)
            else:
                # No thousands separator: 8,90 -> 8.90
                raw = before + "." + after
        elif len(parts) > 2:
            raw = "".join(parts)

    try:
        return round(float(raw), 2)
    except (ValueError, TypeError):
        return None


def extract_reference(text: str, specs: dict = None, url: str = None) -> str | None:
    """
    Try to find a product reference/SKU from:
    1. Specs dict (most reliable - look for reference, sku, mpn, model, code)
    2. Product URL (last meaningful segment before .html)
    3. Raw text patterns
    Returns uppercase normalized ref or None.
    """
    text = str(text) if text else ""
    full_text = text
    
    # 1. From specs dict - most reliable
    if specs:
        ref_keys = [
            "reference", "reference produit", "reference:", "reference.",
            "sku", "mpn", "modele", "model", 
            "code produit", "code article", "code:", "code.",
            "ref", "ref.", "ref:",
        ]
        for k, v in specs.items():
            k_norm = normalize_text(k)
            if any(rk in k_norm for rk in ref_keys):
                val = str(v).strip().upper()
                # Validate it looks like a reference
                if val and len(val) >= 3 and len(val) <= 30:
                    if val.replace("-", "").replace("/", "").replace(".", "").isalnum():
                        return val

    # 2. Try to extract from URL - the product ID or last segment
    if url:
        # Try to get the product ID from URL pattern like /91267-smartphone-...
        url_match = re.search(r'/(\d+)-', url)
        if url_match:
            # Try to also get any suffix after the ID
            product_id = url_match.group(1)
            # Get remaining path after product ID
            remaining = re.search(rf'/{product_id}([^\.]*)\.html', url)
            if remaining:
                suffix = remaining.group(1).strip('-')
                if suffix:
                    # Clean up suffix - remove color words and other noise
                    suffix = re.sub(r'-(blanc|noir|bleu|gris|vert|rouge|orange|violet|rose|or|argent|gold|titanium|brown|black|white|gray)$', '', suffix, flags=re.IGNORECASE)
                    suffix = suffix.strip('-')
                    if suffix:
                        return f"{product_id}-{suffix}".upper()
            return product_id

    # 3. From raw text - look for explicit reference patterns
    explicit_patterns = [
        r"[Rr][eé][fF](?:\.|erence)?:?\s*([A-Z0-9][\w\-/\.]{3,25})",
        r"[Ss][Kk][Uu]:?\s*([A-Z0-9][\w\-/\.]{3,25})",
        r"[Mm][Pp][Nn]:?\s*([A-Z0-9][\w\-/\.]{3,25})",
        r"[Cc]ode:?\s*([A-Z0-9][\w\-/\.]{3,25})",
    ]
    
    for pattern in explicit_patterns:
        matches = re.findall(pattern, full_text)
        for m in matches:
            val = m.strip().upper()
            if val and len(val) >= 4:
                return val
    
    return None


def extract_brand(text: str, specs: dict = None) -> str | None:
    """Extract brand from specs or text."""
    if specs:
        for k, v in specs.items():
            if normalize_text(k) in ["marque", "brand", "fabricant", "manufacturer"]:
                return str(v).strip().title()

    text_lower = normalize_text(text)
    for brand in KNOWN_BRANDS:
        if brand in text_lower:
            return brand.title()

    return None


def normalize_reference(ref: str) -> str:
    """Normalize a reference for comparison: uppercase, no spaces/dashes."""
    if not ref:
        return ""
    return re.sub(r"[\s\-_/\.]", "", ref.upper())


def build_match_key(name: str, brand: str = None, model: str = None) -> str:
    """
    Build a normalized string for fuzzy name matching.
    Example: "apple macbook air m3 13 8gb 256gb"
    """
    parts = []
    if brand:
        parts.append(normalize_text(brand))
    parts.append(clean_name(name))
    if model and model not in (name or ""):
        parts.append(normalize_text(model))
    return " ".join(parts).strip()