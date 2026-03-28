# Service → Portfolio Filter Design
**Date:** 2026-03-28
**Branch:** feat/updates-mar28
**Status:** Approved

---

## Problem

On mobile, when a service accordion item is expanded, the service image (currently a desktop-only floating element that follows the mouse) appears clickable but does nothing. Users expect it to navigate somewhere. The fix should also add genuine value: tapping the image (or a link) should deep-link to the Portfolio page filtered to that service's related projects.

---

## Solution Overview

Add a `filter_key` to services and a `service_category` to projects. The Portfolio page reads a `?category=` query param and filters its Supabase query. The Services accordion exposes a clickable "View Work →" link (desktop) and a tappable image (mobile) that both navigate to the filtered portfolio URL.

**Non-goals:** Do not change any existing visual layout, spacing, animation, or responsive breakpoints. All additions must be purely additive.

---

## Database Changes

Two `ALTER TABLE` statements — run manually in Supabase SQL Editor:

```sql
-- 1. Add filter_key to services (unique slug-style key per service)
ALTER TABLE services ADD COLUMN IF NOT EXISTS filter_key text;

-- 2. Add service_category to projects (matches a service's filter_key)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_category text;
```

No RLS changes needed — these columns inherit existing table policies.

---

## Data Model

### `services.filter_key`
- Type: `text`, nullable
- Format: lowercase slug, e.g. `weddings`, `real-estate`, `portraits`, `events`
- Set by admin in the Services section of AdminPanel
- If null/empty, no link is rendered for that service

### `projects.service_category`
- Type: `text`, nullable
- Matches a `services.filter_key` value
- Set by admin in the Portfolio section of AdminPanel via a dropdown populated from service filter_keys
- If null, project appears in all-projects view only (not in any service filter)

---

## Component Changes

### 1. `Services.jsx` — additive only, no layout changes

**Desktop (≥810px):**
- Floating mouse-follow image: stays `pointerEvents: none` by default — decorative only
- Inside expanded accordion (`isActive`), the expanded content row gets `justify-content: space-between` so the description+tags sit on the left and a "View Projects →" button sits on the **right side**, vertically centered
- Button: pill style (`background: #000`, `color: #fff`, `borderRadius: 40px`, `padding: 12px 24px`), hover → `background: #ff4d00`
- Only rendered if `s.filter_key` is set; uses `useNavigate`
- **Floating image suppression:** add a `buttonHovered` boolean state. When the mouse enters the "View Projects →" button, set `buttonHovered = true` and set `pointerEvents: none` on the button itself is not needed — instead, suppress the floating image by treating `buttonHovered` as an override: `opacity: (hovered !== -1 && !buttonHovered) ? 1 : 0`. This makes the floating image disappear while the cursor is over the button, so it never obscures the click target. On mouse leave of the button, `buttonHovered = false`.

**Mobile (≤809px):**
- Add a visible static image block inside the expanded accordion (after description/tags)
- Image is full-width, `height: 200px`, `borderRadius: 8px`, `objectFit: cover`
- Wrapped in a clickable div that navigates to `/portfolio?category=${s.filter_key}`
- Shows a subtle "View Work →" overlay label at bottom-left
- Only rendered if `s.filter_key` AND `s.image_url` are set
- This image is hidden on desktop (`.services-mobile-image { display: none }` in the existing `<style>` block)

### 2. `Portfolio.jsx` — filtering logic

- Import `useSearchParams` from react-router-dom
- Read `const [params] = useSearchParams()` → `const categoryFilter = params.get('category')`
- In `useEffect`, if `categoryFilter` is set, append `.eq('service_category', categoryFilter)` to the query
- Add dependency `[homepageOnly, categoryFilter]` to the effect
- If `categoryFilter` is active, render a small filter pill in the header area: `"[ServiceName] ×"` — clicking `×` navigates to `/portfolio` (no filter)
- Service name lookup: fetch the matching service title from the `services` table when `categoryFilter` is set
- If no projects match the filter, show a simple "No projects found for this category" empty state

**No changes to grid layout, card design, animations, or breakpoints.**

### 3. `PortfolioPage.jsx` — no changes needed
The `Portfolio` component handles everything internally.

### 4. `AdminPanel.jsx` — two additive inputs

**Services section — per service row:**
- Add `Input label="Filter Key"` after the Title input
- Placeholder: `weddings` — hint text: lowercase, no spaces
- Auto-slugifies on blur: lowercases, replaces spaces with hyphens
- Saves with the rest of the service row on "Save" click (existing save flow)

**Projects section — per project row:**
- Add a `<select>` dropdown labeled "Service Category" after the Category input
- Options: `— None —` (value: `""`) + one option per service that has a `filter_key` set (`{filter_key}: {title}`)
- Services list loaded once at top of admin (already fetched for the Services section)
- On change: updates local state, does NOT auto-save (consistent with other fields — save on "Save" button)

---

## URL Convention

```
/portfolio                          → all projects (no filter)
/portfolio?category=weddings        → only projects where service_category = 'weddings'
/portfolio?category=real-estate     → only real-estate projects
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Service has no `filter_key` | No "View Work" link rendered |
| Service has `filter_key` but 0 matching projects | Portfolio shows empty state message |
| Project has no `service_category` | Project only appears in unfiltered view |
| `?category=` param doesn't match any service | Portfolio shows empty state (same as 0 results) |
| Admin hasn't set any filter_keys yet | Everything works as today — no regression |

---

## Design Constraints (must not break)

- Floating mouse-follow image on desktop: untouched
- Accordion animation (height 0 → auto): no new elements that could affect height calculation
- Mobile breakpoint (≤809px): no new layout shifts
- Existing `services-floating-image` CSS: unchanged
- Portfolio 2-column masonry: unchanged
- All existing animations (spring, whileInView): unchanged
- `homepageOnly` prop behavior: unchanged (homepage portfolio never shows filtered view)
