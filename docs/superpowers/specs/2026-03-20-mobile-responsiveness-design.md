# Mobile Responsiveness — Design Spec
**Date:** 2026-03-20
**Project:** Shravan Bompalli Portfolio
**Stack:** Vite + React 18 + Tailwind CSS v3 + Framer Motion

---

## Overview

Make the entire portfolio website mobile responsive across 10 components, working in strict order. Desktop layout and animations must remain pixel-identical after every change. Mobile receives its own Framer Motion animations — cinematic, premium, and dramatically visible.

---

## Breakpoints

Using the existing custom Tailwind config (no changes to config):

| Name | Range | Prefix |
|------|-------|--------|
| Phone | ≤ 809px | (default, no prefix) |
| Tablet | 810–1279px | `tablet:` |
| Desktop | ≥ 1280px | `desktop:` |

---

## Global Rules (every component)

1. **Desktop untouched** — zero changes to layout, animations, or styling above 809px
2. **Tablet untouched** — unless explicitly noted in component spec; matches desktop behavior
3. **No full rewrites** — targeted patches only; read file completely before editing
4. **Hardcoded `40px` horizontal padding** → replace with `clamp(16px, 5vw, 40px)` — search for `'0 40px'`, `'20px 40px'`, and `padding: '0 40px'` variants in inline style objects
5. **Mobile animations** — Framer Motion `whileInView` + `once: true` to prevent repeat triggers
6. **Spring config for mobile reveals:** `stiffness: 60, damping: 14, mass: 0.8`
7. **Touch targets** — minimum 44×44px for all interactive elements on mobile
8. **Images on mobile** — `width: 100%`, `height: auto`, aspect ratio preserved
9. **Per-component workflow:** Read full file → Ask remaining questions → Patch → Verify desktop unchanged → Commit

---

## File Notes (important caveats)

- **`src/components/Hero.jsx`** — orphaned, not imported anywhere. **Do not touch.**
- **`src/components/Collaborations.jsx`** — orphaned (exports a `Home()` function, not a Collaborations component; not imported anywhere). **Do not touch.**
- **Hero section** lives inline in `src/pages/Home.jsx` (the `<section>` block at the top of the JSX tree).
- **Collaborations section** does not exist in the current rendered app. Component 6 should be treated as a polish/verification pass only.

---

## Component Specs

### 1. `src/pages/Home.jsx` — Hero section (inline `<section>`)

**What exists today:**
- `padding: '20px 40px'` on top bar (line 99)
- `padding: '0 40px'` on mid section and bottom sections (lines 119, 152, 169, 182)
- Recent work image hardcoded `172×172px` (line 126–128)
- rAF parallax on `<figure>` background (initial scale animation only — no scroll parallax currently active in this file; verify before adding)
- Bottom bar: 3-column `flex` row

**Mobile changes (search for these strings in Home.jsx to find patch targets):**
- `'20px 40px'` — top bar padding → replace with `clamp(12px, 4vw, 20px) clamp(16px, 5vw, 40px)` on mobile
- `'0 40px'` — mid and bottom section padding → replace with `0 clamp(16px, 5vw, 40px)` on mobile
- Recent work image: the element with `width: '172px', height: '172px'` → add responsive sizing on mobile: `width: clamp(80px, 22vw, 140px); height: clamp(80px, 22vw, 140px)`
- Mid section (the `flex` div containing recent work image on left and nav links on right): hide both elements on mobile — they duplicate the Navbar hamburger menu. Use `display: none` below 810px via a CSS media query class or inline style check
- Bottom bar (the 3-column `flex` row at the bottom of the hero): stack to `flex-direction: column` on mobile; each cell gets `borderLeft: none`, `borderTop: '1px solid rgba(255,255,255,0.05)'`

**Parallax on mobile:**
- Detect mobile with `window.matchMedia('(max-width: 809px)')` (or check `window.innerWidth < 810` on mount)
- If mobile: do not attach the rAF scroll listener; leave background static
- If desktop: attach as today (no change to existing desktop behavior)
- This gating must happen on mount and on resize

**Mobile animation:** Headline and tagline already have CSS transition entrance (`opacity + translateY`) — keep as-is, these work on mobile. No new mobile-specific entrance animation needed.

---

### 2. `src/components/Services.jsx`

**What exists today:**
- Floating image: `position: absolute`, `width: 280px`, `height: 350px` — escapes viewport on mobile
- Accordion with click-to-expand functionality
- All padding/fonts already use `clamp()`

**Mobile changes:**
- Add `display: none` (or `visibility: hidden`) to the floating image container below 810px
- Ensure accordion rows have `minHeight: 44px` for touch targets
- Verify all `clamp()` values render acceptably at 375px

**Mobile animation:** Section heading fade-up on viewport enter (`whileInView`, `once: true`). Accordion expand/collapse is already animated — keep as-is.

---

### 3. `src/components/Portfolio.jsx`

**What exists today:**
- CSS masonry via `columns: '2'`
- Broken media query: `.portfolio-grid { grid-template-columns: 1fr !important }` — wrong property, has no effect
- No explicit tablet query (stays at 2 columns all the way through tablet — this is acceptable, leave unchanged)

**Mobile changes:**
- Fix the media query: replace `grid-template-columns: 1fr !important` with `columns: 1 !important`
- This gives single-column masonry on mobile (≤809px); 2-column remains on tablet and desktop

**Mobile animation:** Each card fades up with staggered delay as it enters the viewport (`whileInView`, `once: true`, stagger 0.08s per card). Add `initial={{ opacity: 0, y: 30 }}` and `animate={{ opacity: 1, y: 0 }}` via Framer Motion on each card wrapper.

---

### 4. `src/components/TestimonialHighlight.jsx`

**What already exists on mobile:**
```css
@media (max-width: 809px) {
  .testimonial-main-row { flex-direction: column !important; align-items: stretch !important; }
  .testimonial-images { flex: 1 1 100% !important; margin-top: 20px !important; }
  .testimonial-images > div:last-child { margin-top: 0 !important; }
}
```
Vertical stacking is already implemented. Do NOT re-add it.

**What is actually missing:**
- Quote font size is not enlarged for mobile. Add: at ≤809px set quote font to `clamp(22px, 6vw, 36px)` (vs current smaller size)
- Negative margin on Image 1 (the tall portrait) — `marginTop: 'clamp(-120px, -12vw, -60px)'` is applied as a Framer Motion inline style prop. CSS `!important` cannot override Framer Motion inline styles. The fix must be at the React prop level: detect `isMobile` (see MyShots section for detection pattern), then pass `marginTop: isMobile ? 0 : 'clamp(-120px, -12vw, -60px)'` directly in the `motion.div`'s style prop
- Framer Motion entrance animations for quote and images

**Mobile animations (new):**
- Quote: `initial={{ opacity: 0, y: 40 }}` → `whileInView={{ opacity: 1, y: 0 }}`, `once: true`
- Image 1: `initial={{ opacity: 0, scale: 0.95 }}` → `whileInView={{ opacity: 1, scale: 1 }}`, `once: true`, transition delay `0.1s`
- Image 2: same, delay `0.25s`
- Spring: `stiffness: 60, damping: 14, mass: 0.8`

---

### 5. `src/components/AboutText.jsx`

**What exists today:**
- Already uses `clamp()` for font size and padding
- Scroll listener uses `setProgress(setState)` inside a scroll handler — this violates CLAUDE.md Rule 2 but is the existing character-reveal implementation. **Leave it as-is.** Fixing it is out of scope for this task.

**Mobile changes:**
- Verify renders correctly at 375px width
- Patch only if visual overflow or clipping is observed
- No new animations — the existing character reveal works on mobile

---

### 6. `src/components/Collaborations.jsx`

**Status:** The `Collaborations.jsx` file is orphaned (exports a Home function, not a Collaborations component; not imported anywhere). No Collaborations section exists in the current rendered app.

**Action:** Skip this component. Do not touch the file. Move directly to Component 7.

---

### 7. `src/components/Footer.jsx`

**What exists today:**
- Outer flex stacks on mobile via `.footer-grid { flex-direction: column }`
- Inner nav columns (Pages, Socials, Stats) remain in a horizontal row inside the right block — this will be cramped at 375px

**Mobile changes:**
- Stack inner nav columns vertically: find the inner container holding Pages/Socials/Stats columns and add `flex-direction: column; gap: clamp(16px, 4vw, 24px)` at ≤809px
- Tighten outer column gap: reduce from `clamp(40px, 6vw, 80px)` to `clamp(20px, 4vw, 40px)` on mobile

**Mobile animation:** Each major footer section (CTA, nav columns, copyright) fades up with 0.1s stagger on viewport enter (`whileInView`, `once: true`)

---

### 8. `src/pages/AboutPage.jsx`

**What exists today:**
- Right-side nav hidden on mobile (already done)
- Inline headline image: `clamp(60px, 12vw, 160px)` — stays inline with headline text (breaks at <375px)

**Mobile changes:**
- On mobile: hide the inline headline image (`display: none` below 810px)
- Add a new full-width image block *below* the headline, visible only on mobile (`display: none` on desktop/tablet; `display: block` on mobile)
- This image uses the same image source as the inline version
- Full-width: `width: 100%; height: auto; border-radius: 8px; object-fit: cover`
- Tablet: unchanged (inline image stays, same as desktop)

**Mobile animation (full-width image):**
- `initial={{ opacity: 0, y: 30, scale: 0.95 }}` → `whileInView={{ opacity: 1, y: 0, scale: 1 }}`
- `once: true`, spring `stiffness: 60, damping: 14, mass: 0.8`

---

### 9. `src/pages/ContactPage.jsx`

**What exists today:**
- `.contact-grid { flex-direction: column }` already stacks the layout on mobile
- Info panel: `flex: '1 1 300px'`, `minWidth: '260px'` — the `minWidth` may prevent full-width at 375px
- Form: `flex: '1.5 1 350px'`

**Mobile changes:**
- On the info panel: add `minWidth: 0` and `width: 100%` override on mobile to allow full stretch
- On the form container: same — `minWidth: 0`, `width: 100%`
- Ensure form inputs have adequate padding: verify `padding: '12px 0'` is sufficient, increase if needed
- ContactPage navbar already uses `clamp` for horizontal padding — no change needed there

**Mobile animation:** Form fields stagger fade-in on viewport enter (0.08s stagger per field, `whileInView`, `once: true`)

---

### 10. `src/pages/MyShotsPage.jsx` + `src/components/MyShots.jsx`

#### MyShotsPage.jsx

**What exists today:**
- Navbar: hardcoded `padding: '20px 40px'` — will clip on 375px screens
- Inline headline image: same pattern as AboutPage

**Mobile changes:**
- Replace `padding: '20px 40px'` with `padding: clamp(12px, 4vw, 20px) clamp(16px, 5vw, 40px)` on navbar
- Hide inline headline image on mobile; add full-width image below headline (same as Component 8 pattern)
- Tablet: unchanged

**Mobile animation (full-width image):**
- Same as Component 8: `opacity: 0, y: 30, scale: 0.95` → `opacity: 1, y: 0, scale: 1`
- `once: true`, spring `stiffness: 60, damping: 14, mass: 0.8`

#### MyShots.jsx

**What exists today:**
- MagneticCard: 3D tilt on `mousemove` — does nothing on touch
- ParallaxImage: `useScroll` + `useTransform` — heavy on CPU on mobile
- Desktop animations: `viewport={{ once: false, amount: 0.05 }}` — intentional, re-animate on scroll in/out
- Existing mobile queries: `columns: 2` at ≤809px, `columns: 1` at ≤480px

**Mobile changes:**
- Disable 3D tilt on mobile: detect with `const isMobile = window.matchMedia('(pointer: coarse)').matches` or `window.innerWidth < 810` — if true, skip the `onMouseMove` handler and keep `rotateX/rotateY` at 0
- Disable ParallaxImage scroll transform on mobile: use same detection; if mobile, skip `useTransform` and render image statically
- Fix masonry to 1 column at ≤809px (not just ≤480px): change existing `@media (max-width: 809px) { columns: 2 }` to `columns: 1`
- Hover overlay: on mobile (touch devices), make overlay always visible at reduced opacity (e.g., `opacity: 0.7`) since hover doesn't exist on touch

**Mobile animation:**
- Replace directional slide animations (`whileInView`) with simple fade-up on mobile
- `initial={{ opacity: 0, y: 30 }}` → `whileInView={{ opacity: 1, y: 0 }}`
- `viewport={{ once: true, amount: 0.1 }}` on mobile; keep `once: false` on desktop
- Stagger: 0.06s per card
- To handle desktop `once: false` vs mobile `once: true`: detect `isMobile` once in `ShotsSection` using `useState` initialized with `window.matchMedia('(pointer: coarse)').matches`, then pass it as a prop to `MagneticCard` and from there to `ParallaxImage`. Use this `isMobile` flag to control both the `viewport={{ once: isMobile }}` prop and to skip the mouse/scroll handlers

---

## Execution Order

Work strictly in order: 1 → 2 → 3 → 4 → 5 → 6 (skip) → 7 → 8 → 9 → 10

For each component:
1. Read the full component file
2. Ask any remaining component-specific questions before touching code
3. Dispatch a fresh subagent per component
4. Verify desktop is unchanged after edits
5. Commit with: `fix(mobile): make <ComponentName> responsive`

**Stop conditions:** Only stop for a decision that requires user input. Otherwise work autonomously.

---

## Revert Policy

If a component breaks after patching, revert using the correct path:

```bash
# For components in src/components/
git checkout HEAD -- src/components/<Component>.jsx

# For page-level files
git checkout HEAD -- src/pages/<PageName>.jsx
```

Log the failure, skip to the next component, report at end of session.

---

## Out of Scope

- `src/components/Navbar.jsx` — already mobile-responsive (hamburger done)
- `src/components/Hero.jsx` — orphaned, not used
- `src/components/Collaborations.jsx` — orphaned, not used
- `src/pages/PortfolioPage.jsx` — inline image pattern will be consistent once Component 8 is done; low priority
- No new dependencies — Framer Motion already installed
- No changes to Tailwind config
- No desktop or tablet layout/animation changes of any kind
- `AboutText.jsx` setState-on-scroll violation — known issue, leave as-is (out of scope)
