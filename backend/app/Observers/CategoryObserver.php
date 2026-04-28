<?php

namespace App\Observers;

use App\Models\Category;
use Illuminate\Support\Facades\DB;

class CategoryObserver
{
    /**
     * Auto-generate code before creation.
     *
     * Root categories:   "1", "2", "3", …
     * Sub-categories:    "{parent_code}_1", "{parent_code}_2", …
     */
    public function creating(Category $category): void
    {
        if ($category->code) {
            return; // already set (e.g. seeder backfill)
        }

        $category->code = $this->nextCode($category->parent_id);
    }

    /**
     * Re-sequence sibling codes after a category is deleted.
     *
     * Example: deleting "3_5" shifts "3_6"→"3_5", "3_7"→"3_6", etc.
     * For root deletions, "4"→"3", "5"→"4", etc.
     */
    public function deleted(Category $category): void
    {
        $deletedCode = $category->code;
        if (! $deletedCode) {
            return;
        }

        $parts  = explode('_', $deletedCode);
        $pos    = (int) array_pop($parts);
        $prefix = count($parts) ? implode('_', $parts) . '_' : '';

        // Find siblings at the same depth with higher position
        $all = Category::whereNotNull('code')
            ->when($category->parent_id, fn ($q) => $q->where('parent_id', $category->parent_id))
            ->when(! $category->parent_id, fn ($q) => $q->whereNull('parent_id'))
            ->get()
            ->filter(function ($cat) use ($prefix, $pos) {
                $tail = substr($cat->code, strlen($prefix));
                // Same depth: no further underscores in the tail
                return str_contains($cat->code, '_') === str_contains($deletedCode, '_')
                    && ctype_digit($tail)
                    && (int) $tail > $pos;
            })
            ->sortBy(fn ($c) => (int) substr($c->code, strlen($prefix)));

        foreach ($all as $sibling) {
            $tail    = (int) substr($sibling->code, strlen($prefix));
            $newCode = $prefix . ($tail - 1);
            DB::table('categories')
                ->where('id', $sibling->id)
                ->update(['code' => $newCode]);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function nextCode(?int $parentId): string
    {
        if ($parentId === null) {
            $max = Category::whereNull('parent_id')
                ->whereNotNull('code')
                ->get()
                ->map(fn ($c) => (int) $c->code)
                ->max() ?? 0;

            return (string) ($max + 1);
        }

        $parent = Category::find($parentId);
        $prefix = ($parent?->code ?? $parentId) . '_';

        $max = Category::where('parent_id', $parentId)
            ->whereNotNull('code')
            ->get()
            ->map(function ($c) use ($prefix) {
                $tail = substr($c->code, strlen($prefix));
                return ctype_digit($tail) ? (int) $tail : 0;
            })
            ->max() ?? 0;

        return $prefix . ($max + 1);
    }
}
