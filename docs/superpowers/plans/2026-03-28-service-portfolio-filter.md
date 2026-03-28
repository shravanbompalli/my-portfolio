# Service → Portfolio Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link each service to its related projects via a `filter_key` / `service_category` pairing, making the service image/button on mobile and the "View Projects →" button on desktop navigate to `/portfolio?category=<key>` with filtered results.

**Architecture:** Two new nullable columns (`services.filter_key`, `projects.service_category`) are the only data changes. `Services.jsx` gains a desktop button + mobile tappable image, both purely additive inside the existing `isActive` block. `Portfolio.jsx` reads `?category=` from the URL and appends a `.eq()` filter — all other behavior unchanged. `AdminPanel.jsx` gets two new inputs, one per section.

**Tech Stack:** React 18, React Router v6 (`useNavigate`, `useSearchParams`), Framer Motion, Supabase JS client, Tailwind-free inline styles

---

## Files

| File | Change |
|------|--------|
| `src/components/Services.jsx` | Add `buttonHovered` state, desktop "View Projects →" button, mobile tappable image block |
| `src/components/Portfolio.jsx` | Add `useSearchParams`, conditional `.eq('service_category', ...)` filter, filter pill UI |
| `src/pages/AdminPanel.jsx` | Add `filter_key` input to Services section; add `service_category` dropdown to Projects section |
| Supabase Dashboard (manual) | Run 2 `ALTER TABLE` statements |

---

## Task 1: Database — add the two columns

**Files:**
- Manual: Supabase Dashboard → SQL Editor

- [ ] **Step 1: Open Supabase Dashboard SQL Editor and run:**

```sql
ALTER TABLE services ADD COLUMN IF NOT EXISTS filter_key text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_category text;
```

- [ ] **Step 2: Verify columns exist**

In Supabase Dashboard → Table Editor → `services` table: confirm `filter_key` column appears.
In `projects` table: confirm `service_category` column appears.
Both should be nullable with no default — that's correct.

- [ ] **Step 3: Commit a migration record**

Create `supabase/migrations/20260328_service_filter.sql`:

```sql
-- Add filter_key to services: slug-style key linking a service to its portfolio projects
ALTER TABLE services ADD COLUMN IF NOT EXISTS filter_key text;

-- Add service_category to projects: matches a service's filter_key for portfolio filtering
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_category text;
```

```bash
git add supabase/migrations/20260328_service_filter.sql
git commit -m "chore: add migration — services.filter_key + projects.service_category"
```

---

## Task 2: AdminPanel — `filter_key` input in Services section

**Files:**
- Modify: `src/pages/AdminPanel.jsx` (Services section, ~line 1002–1007)

- [ ] **Step 1: Read the current Services section row**

The grid at line 1002 currently is:
```jsx
<div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '10px', marginBottom: '10px' }}>
  <Input label="No." value={s.number} onChange={v => { const u = [...services]; u[i].number = parseInt(v) || 0; setServices(u) }} />
  <Input label="Title" value={s.title} onChange={v => { const u = [...services]; u[i].title = v; setServices(u) }} />
</div>
```

- [ ] **Step 2: Change the grid to 3 columns and add `filter_key` input**

Replace that `<div>` block with:

```jsx
<div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
  <Input label="No." value={s.number} onChange={v => { const u = [...services]; u[i].number = parseInt(v) || 0; setServices(u) }} />
  <Input label="Title" value={s.title} onChange={v => { const u = [...services]; u[i].title = v; setServices(u) }} />
  <Input
    label="Filter Key"
    value={s.filter_key || ''}
    placeholder="e.g. weddings"
    onChange={v => { const u = [...services]; u[i].filter_key = v.toLowerCase().replace(/\s+/g, '-'); setServices(u) }}
  />
</div>
```

- [ ] **Step 3: Verify in browser**

Go to `/admin` → Services section → expand any service row.
Confirm a "Filter Key" input appears to the right of Title.
Type "Wedding Films" → it should auto-convert to `wedding-films`.
Hit Save → row saves. Reload page → value persists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminPanel.jsx
git commit -m "feat(admin): add filter_key input to Services section"
```

---

## Task 3: AdminPanel — `service_category` dropdown in Projects section

**Files:**
- Modify: `src/pages/AdminPanel.jsx` (Projects section, ~line 1035–1041)

- [ ] **Step 1: Locate the basic info grid in the projects section**

Around line 1035:
```jsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
  <Input label="Title" ... />
  <Input label="Slug (URL)" ... />
  <Input label="Category" ... />
  <Input label="Client" ... />
  <Input label="Location" ... />
</div>
```

- [ ] **Step 2: Add `service_category` select after the Category input**

Add this immediately after the `<Input label="Category" .../>` line:

```jsx
<div>
  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Category</p>
  <select
    value={p.service_category || ''}
    onChange={e => { const u = [...projects]; u[i] = { ...u[i], service_category: e.target.value || null }; setProjects(u) }}
    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '13px', color: white, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '8px', padding: '10px 14px', outline: 'none' }}
    onFocus={e => e.target.style.borderColor = accent}
    onBlur={e => e.target.style.borderColor = border}
  >
    <option value="">— None —</option>
    {services.filter(s => s.filter_key).map(s => (
      <option key={s.id} value={s.filter_key}>{s.filter_key} — {s.title}</option>
    ))}
  </select>
</div>
```

Note: `services` state is already loaded at the top of AdminPanel — no additional fetch needed.

- [ ] **Step 3: Verify in browser**

Go to `/admin` → Portfolio section → expand any project.
Confirm "Service Category" dropdown appears.
If you set a `filter_key` on a service in Task 2, that option should appear in the dropdown.
Select it → hit Save → reload → value persists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminPanel.jsx
git commit -m "feat(admin): add service_category dropdown to Projects section"
```

---

## Task 4: Portfolio.jsx — URL-based category filtering

**Files:**
- Modify: `src/components/Portfolio.jsx`

- [ ] **Step 1: Add `useSearchParams` import**

Change line 2 from:
```jsx
import { Link } from 'react-router-dom'
```
to:
```jsx
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
```

- [ ] **Step 2: Read the category filter from URL params**

Add these two lines immediately after the `const [hov, setHov] = useState(null)` line:

```jsx
const [searchParams] = useSearchParams()
const categoryFilter = searchParams.get('category')
const navigate = useNavigate()
```

- [ ] **Step 3: Add service title lookup state**

Add this state after the existing state declarations:

```jsx
const [filterLabel, setFilterLabel] = useState('')
```

- [ ] **Step 4: Update the useEffect to filter + fetch label**

Replace the existing `useEffect` with:

```jsx
useEffect(() => {
  async function load() {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (homepageOnly) query = query.eq('show_on_homepage', true)
    if (categoryFilter) query = query.eq('service_category', categoryFilter)
    const { data } = await query
    if (data) setProjects(data)

    if (categoryFilter) {
      const { data: svc } = await supabase
        .from('services')
        .select('title')
        .eq('filter_key', categoryFilter)
        .single()
      setFilterLabel(svc?.title || categoryFilter)
    } else {
      setFilterLabel('')
    }
  }
  load()
}, [homepageOnly, categoryFilter])
```

- [ ] **Step 5: Add filter pill in the header area**

In the header `motion.div` (around line 41–86), add this block immediately after the closing `</div>` of the `.Selected Work` heading row and before the `hasMore` block:

```jsx
{categoryFilter && !homepageOnly && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'clamp(20px, 3vw, 32px)' }}>
    <span style={{
      fontFamily: '"Geist", sans-serif', fontSize: '14px', fontWeight: 400,
      color: '#000', backgroundColor: '#eee',
      padding: '8px 16px', borderRadius: '40px',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      {filterLabel || categoryFilter}
      <button
        onClick={() => navigate('/portfolio')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#404040', fontSize: '16px', lineHeight: 1,
          padding: '0 2px', fontFamily: '"Geist", sans-serif',
        }}
        aria-label="Clear filter"
      >×</button>
    </span>
  </div>
)}
```

- [ ] **Step 6: Add empty state when filter returns 0 projects**

Replace the existing `if (!projects.length) return null` guard with:

```jsx
if (!projects.length) {
  if (categoryFilter && !homepageOnly) {
    return (
      <section id="portfolio" style={{ backgroundColor: '#f5f5f5', padding: 'clamp(60px, 8vw, 100px) clamp(18px, 4vw, 40px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
          <p style={{ fontFamily: '"Geist", sans-serif', fontSize: '18px', color: '#aaa' }}>
            No projects found for this category.
          </p>
          <button
            onClick={() => navigate('/portfolio')}
            style={{
              marginTop: '16px', fontFamily: '"Geist", sans-serif', fontSize: '15px',
              fontWeight: 500, color: '#fff', backgroundColor: '#000',
              padding: '12px 24px', borderRadius: '40px', border: 'none', cursor: 'pointer',
            }}
          >View All Work</button>
        </div>
      </section>
    )
  }
  return null
}
```

- [ ] **Step 7: Verify in browser**

1. Go to `/portfolio` — confirm page looks identical to before (no regression).
2. Go to `/portfolio?category=weddings` (after setting `filter_key=weddings` on a service and `service_category=weddings` on a project in admin) — confirm only that project shows, filter pill shows "Weddings ×".
3. Click "×" — confirm navigates back to `/portfolio` showing all projects.
4. Go to `/portfolio?category=nonexistent` — confirm empty state with "View All Work" button.
5. Homepage portfolio section (uses `homepageOnly` prop) — confirm completely unchanged.

- [ ] **Step 8: Commit**

```bash
git add src/components/Portfolio.jsx
git commit -m "feat: add URL-based category filter to Portfolio component"
```

---

## Task 5: Services.jsx — desktop "View Projects →" button + floating image suppression

**Files:**
- Modify: `src/components/Services.jsx`

- [ ] **Step 1: Add imports**

Change line 2 from:
```jsx
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
```
to:
```jsx
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
```

- [ ] **Step 2: Add `buttonHovered` state and `navigate`**

Add these two lines immediately after `const containerRef = useRef(null)`:

```jsx
const navigate = useNavigate()
const [buttonHovered, setButtonHovered] = useState(false)
```

- [ ] **Step 3: Update the floating image opacity to suppress on button hover**

Find the `motion.div` with `className="services-floating-image"` (~line 217). Change its `opacity` style property from:
```jsx
opacity: hovered !== -1 ? 1 : 0,
```
to:
```jsx
opacity: hovered !== -1 && !buttonHovered ? 1 : 0,
```

- [ ] **Step 4: Add the "View Projects →" button inside the expanded accordion**

Find the expanded accordion content `<div>` (~line 169–204). It currently ends after the tags block:
```jsx
        </div>
      </motion.div>
    )}
  </AnimatePresence>
```

Replace the inner content `<div>` (the one with `display: 'flex', flexDirection: 'column', gap: '16px'`) with:

```jsx
<div style={{
  display: 'flex', alignItems: 'flex-start',
  justifyContent: 'space-between', gap: '24px',
  paddingBottom: '28px', paddingLeft: 'clamp(56px, 9vw, 112px)',
}}>
  {/* Left: description + tags — unchanged */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      style={{
        fontFamily: '"Geist", sans-serif',
        fontSize: 'clamp(14px, 1.3vw, 16px)',
        fontWeight: 400, color: '#404040',
        lineHeight: 1.6, maxWidth: '540px', margin: 0,
      }}
    >
      {s.description}
    </motion.p>
    {s.tags && s.tags.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
      >
        {s.tags.map(tag => (
          <span key={tag} style={{
            fontFamily: '"Geist", sans-serif',
            fontSize: '13px', fontWeight: 400,
            color: '#fff', backgroundColor: '#000',
            padding: '6px 14px', borderRadius: '40px',
          }}>
            {tag}
          </span>
        ))}
      </motion.div>
    )}
  </div>

  {/* Right: View Projects button — desktop only, only if filter_key set */}
  {s.filter_key && (
    <motion.button
      className="services-view-projects-btn"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      onClick={e => { e.stopPropagation(); navigate(`/portfolio?category=${s.filter_key}`) }}
      onMouseEnter={() => setButtonHovered(true)}
      onMouseLeave={() => setButtonHovered(false)}
      style={{
        flexShrink: 0, alignSelf: 'center',
        fontFamily: '"Geist", sans-serif', fontSize: '14px', fontWeight: 500,
        color: '#fff', backgroundColor: '#000',
        padding: '12px 24px', borderRadius: '40px', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        transition: 'background-color 0.3s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseOver={e => e.currentTarget.style.backgroundColor = '#ff4d00'}
      onMouseOut={e => { e.currentTarget.style.backgroundColor = '#000'; setButtonHovered(false) }}
    >
      View Projects
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
      </svg>
    </motion.button>
  )}
</div>
```

- [ ] **Step 5: Add CSS to hide the button on mobile**

In the existing `<style>` block at the bottom of Services.jsx, add:

```css
@media (max-width: 809px) {
  .services-view-projects-btn { display: none !important; }
}
```

- [ ] **Step 6: Verify desktop behavior**

1. Open a service accordion on desktop (≥810px).
2. Confirm description + tags still appear on the left — layout unchanged.
3. Confirm "View Projects →" button appears on the right (only if that service has a `filter_key` set).
4. Hover the button → floating mouse-follow image disappears. Move off → image returns.
5. Click button → navigates to `/portfolio?category=<key>`.
6. Service with no `filter_key` → no button rendered at all.

- [ ] **Step 7: Commit**

```bash
git add src/components/Services.jsx
git commit -m "feat: add View Projects button to Services accordion (desktop) + suppress floating image on hover"
```

---

## Task 6: Services.jsx — mobile tappable image block

**Files:**
- Modify: `src/components/Services.jsx`

- [ ] **Step 1: Add the mobile image block inside the expanded content**

Inside the left column `<div>` (description + tags) from Task 5, add this block **after** the tags `motion.div` and before the closing `</div>` of the left column:

```jsx
{/* Mobile-only tappable image — hidden on desktop via CSS */}
{s.filter_key && s.image_url && (
  <motion.div
    className="services-mobile-image"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.3 }}
    onClick={() => navigate(`/portfolio?category=${s.filter_key}`)}
    style={{
      position: 'relative', borderRadius: '8px', overflow: 'hidden',
      height: '200px', cursor: 'pointer',
    }}
  >
    <img
      src={s.image_url}
      alt={s.title}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(1.4)' }}
    />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.6) 100%)',
      pointerEvents: 'none',
    }} />
    <span style={{
      position: 'absolute', bottom: '12px', left: '14px',
      fontFamily: '"Geist", sans-serif', fontSize: '13px', fontWeight: 500,
      color: '#fff', display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      View Projects
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
      </svg>
    </span>
  </motion.div>
)}
```

- [ ] **Step 2: Add CSS to hide the mobile image on desktop and show only on mobile**

In the existing `<style>` block at the bottom of Services.jsx, add:

```css
.services-mobile-image { display: none; }
@media (max-width: 809px) {
  .services-mobile-image { display: block !important; }
}
```

- [ ] **Step 3: Verify mobile behavior**

1. Open browser DevTools → toggle to mobile viewport (≤809px).
2. Tap a service row to expand it.
3. Confirm the image appears below the description/tags.
4. Confirm "View Projects →" overlay label is visible at the bottom-left of the image.
5. Tap the image → navigates to `/portfolio?category=<key>`.
6. Service with no `filter_key` or no `image_url` → no image block rendered.
7. On desktop → image block is hidden, "View Projects →" button is visible (from Task 5).

- [ ] **Step 4: Full regression check**

- Desktop accordion open/close animation: unchanged
- Desktop floating image follows mouse on hover: unchanged
- Floating image disappears on button hover: works
- Mobile accordion: no floating image (already hidden via existing CSS)
- No layout shifts on desktop or mobile

- [ ] **Step 5: Commit**

```bash
git add src/components/Services.jsx
git commit -m "feat: add mobile tappable image to Services accordion"
```

---

## Task 7: End-to-end smoke test

- [ ] **Step 1: Set up test data in admin**

1. Go to `/admin` → Services → set `filter_key = weddings` on the Weddings service → Save.
2. Go to `/admin` → Portfolio → set `service_category = weddings` on 2-3 projects → Save each.

- [ ] **Step 2: Test desktop flow**

1. Go to home page, scroll to Services section.
2. Click "Weddings" row to expand → "View Projects →" button appears on the right.
3. Hover the button → floating image disappears. Move away → returns.
4. Click button → lands on `/portfolio?category=weddings` showing only wedding projects with a "Weddings ×" pill.
5. Click "×" → returns to `/portfolio` showing all projects.

- [ ] **Step 3: Test mobile flow**

1. DevTools → mobile viewport.
2. Expand "Weddings" accordion → image block appears with "View Projects →" overlay.
3. Tap image → `/portfolio?category=weddings` with only wedding projects.

- [ ] **Step 4: Test services with no filter_key**

Expand any service that has no `filter_key` set → no button on desktop, no image block on mobile. Existing layout identical to before.

- [ ] **Step 5: Final commit and push**

```bash
git push origin feat/updates-mar28
```
