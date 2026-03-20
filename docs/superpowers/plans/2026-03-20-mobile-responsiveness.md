# Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 10 portfolio components mobile responsive (≤809px) without changing desktop layout or animations, adding cinematic Framer Motion animations on mobile.

**Architecture:** Each component is patched independently in order. Mobile styles are added via CSS media queries and `window.matchMedia` detection. New mobile animations use Framer Motion `whileInView` + `once: true` on motion wrappers that already exist or are added as thin wrappers. Desktop code is never removed or modified — only mobile-specific additions are made.

**Tech Stack:** React 18, Framer Motion, Tailwind CSS v3 (custom breakpoints: `tablet:` 810–1279px, `desktop:` ≥1280px), inline styles + CSS-in-JS `<style>` blocks

---

## Pre-flight

- [ ] **Verify dev server runs**

```bash
cd "C:/Users/91809/OneDrive/Desktop/AI_Projects/portfolio"
npm run dev
```

Expected: Vite server starts at `http://localhost:5173`. Fix any errors before proceeding.

- [ ] **Open browser DevTools → Responsive mode**

Set viewport to **375px wide** (iPhone SE). Keep this open for every task.

---

## Task 1: Home.jsx — Hero Section

**Spec ref:** Component 1

**Files:**
- Modify: `src/pages/Home.jsx`

**What to change:**
- Replace hardcoded `40px` horizontal padding with `clamp` values
- Hide mid-section (recent work image + desktop nav) on mobile
- Stack bottom bar vertically on mobile
- Gate rAF/scroll parallax so it only runs on desktop

- [ ] **Step 1: Read the full file**

Open `src/pages/Home.jsx`. Locate:
- `padding: '20px 40px'` — the top bar
- `padding: '0 40px'` — mid section and bottom sections (multiple occurrences)
- The `<div>` containing the recent-work image (left) and NavLink nav (right) — this is the mid-section to hide on mobile
- The 3-column bottom bar (social links | subtext | award)
- The `<figure>` with the background image and scale transition

Note: `Hero.jsx` and `Collaborations.jsx` in `src/components/` are **orphaned — do not touch**.

- [ ] **Step 2: Add isMobile detection hook**

Near the top of the `Home` function (after existing state declarations), add:

```jsx
const [isMobile, setIsMobile] = React.useState(
  typeof window !== 'undefined' && window.innerWidth < 810
)
React.useEffect(() => {
  const mq = window.matchMedia('(max-width: 809px)')
  const handler = (e) => setIsMobile(e.matches)
  mq.addEventListener('change', handler)
  setIsMobile(mq.matches)
  return () => mq.removeEventListener('change', handler)
}, [])
```

Note: `React` is available via the existing `import { useState, useEffect, useRef } from 'react'` — change the import to also include `useState` if not already there (it is), or replace `React.useState` with the destructured `useState`.

- [ ] **Step 3: Replace top bar padding**

Find `padding: '20px 40px'` (the top bar `div` with contact info, logo, and title). Replace with:

```jsx
padding: isMobile ? 'clamp(12px, 4vw, 20px) clamp(16px, 5vw, 40px)' : '20px 40px'
```

- [ ] **Step 4: Replace mid-section padding and hide on mobile**

Find the mid `<div>` with `padding: '0 40px'` that contains the recent-work image link on the left and the NavLink list on the right. Add `display: isMobile ? 'none' : 'flex'` to its style (it already has `display: 'flex'`).

Also update its `padding` to: `padding: isMobile ? '0 clamp(16px, 5vw, 40px)' : '0 40px'`

- [ ] **Step 5: Fix headline padding**

Find the `<div>` wrapping the tagline `<p>` and `<h1>` headline (the section with `padding: '0 40px'`). Replace:

```jsx
padding: isMobile ? '0 clamp(16px, 5vw, 40px)' : '0 40px'
```

- [ ] **Step 6: Stack bottom bar on mobile**

Find the bottom bar `<div>` (the flex row with 3 cells: social links | subtext | award). Update its style:

```jsx
display: 'flex',
flexDirection: isMobile ? 'column' : 'row',
alignItems: isMobile ? 'stretch' : 'stretch',
```

For each of the 3 child cells, replace `borderLeft: '1px solid rgba(255,255,255,0.05)'` with:

```jsx
borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)',
borderTop: '1px solid rgba(255,255,255,0.05)',
padding: isMobile ? '12px 16px' : '16px 40px',  // adjust as needed per cell
```

The first cell (social links) already has a top border — keep it.

- [ ] **Step 7: Visual check at 375px**

In browser at 375px:
- Top bar shows logo centered or left — no overflow
- Mid section (recent work image + nav links) is hidden
- Headline text wraps cleanly, no horizontal scroll
- Bottom bar stacks: social → subtext → award, each full width
- No content clips or overflows the viewport

Resize to 1280px and confirm desktop looks identical to before.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "fix(mobile): make hero section responsive in Home.jsx"
```

---

## Task 2: Services.jsx — Hide Floating Image

**Spec ref:** Component 2

**Files:**
- Modify: `src/components/Services.jsx`

- [ ] **Step 1: Read the full file**

Open `src/components/Services.jsx`. Locate:
- The floating image container — it uses `position: 'absolute'` and has `width: '280px'`, `height: '350px'`
- The `<style>` block at the bottom of the file (if present)
- The section heading element

- [ ] **Step 2: Hide floating image on mobile**

Find the floating image wrapper `<div>` (the one with `position: 'absolute'`). Add to its existing `<style>` block (or add a new one if none exists):

```html
<style>{`
  .services-floating-image {
    display: block;
  }
  @media (max-width: 809px) {
    .services-floating-image {
      display: none !important;
    }
  }
`}</style>
```

Add `className="services-floating-image"` to the floating image wrapper `<div>`.

If the component already has a `<style>` block, append the media query rule to it rather than adding a second `<style>` tag.

- [ ] **Step 3: Ensure accordion touch targets**

Find the accordion row `<div>` elements (the clickable rows that expand/collapse). Verify each has `minHeight` set. If not, add:

```jsx
minHeight: '44px',
```

to the clickable row's style object.

- [ ] **Step 4: Add section heading fade-up on mobile**

Find the section heading element (the one with the large `clamp()` font size). Wrap it in a Framer Motion `motion.div` if not already wrapped:

```jsx
import { motion } from 'framer-motion'

// wrap heading:
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.5 }}
  transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8 }}
>
  {/* existing heading JSX */}
</motion.div>
```

Note: If `motion` is already imported in this file, do not re-import.

- [ ] **Step 5: Visual check at 375px**

- Floating image is gone on mobile; accordion is text-only
- Accordion rows are tappable (≥44px height)
- Section heading has fade-up animation on scroll
- At 1280px: floating image visible, desktop layout unchanged

- [ ] **Step 6: Commit**

```bash
git add src/components/Services.jsx
git commit -m "fix(mobile): hide floating image, add touch targets in Services.jsx"
```

---

## Task 3: Portfolio.jsx — Fix Media Query

**Spec ref:** Component 3

**Files:**
- Modify: `src/components/Portfolio.jsx`

- [ ] **Step 1: Read the full file**

Open `src/components/Portfolio.jsx`. Locate the `<style>` block at the bottom. Find the broken rule:

```css
@media (max-width: 809px) {
  .portfolio-grid { grid-template-columns: 1fr !important; }
}
```

Note: The component uses CSS `columns` property for masonry, NOT CSS Grid. `grid-template-columns` has no effect here.

- [ ] **Step 2: Fix the media query**

Replace `grid-template-columns: 1fr !important` with `columns: 1 !important`:

```css
@media (max-width: 809px) {
  .portfolio-grid { columns: 1 !important; }
}
```

- [ ] **Step 3: Add card fade-up animation**

Find the card wrapper element for each project card (the outer `<div>` or `<motion.div>` mapped over projects). Wrap each card in a `motion.div` with staggered fade-up:

```jsx
<motion.div
  key={project.id}
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.1 }}
  transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: index * 0.08 }}
>
  {/* existing card JSX */}
</motion.div>
```

`index` comes from the `.map((project, index) => ...)` callback — add it if not already there.

Note: If cards are already wrapped in `motion.div`, only add the `initial`/`whileInView`/`viewport` props if not present.

- [ ] **Step 4: Visual check at 375px**

- Single-column masonry at 375px (cards stack vertically, full-width)
- Cards fade up as they enter viewport
- At 810px: 2-column masonry (tablet, unchanged)
- At 1280px: desktop layout unchanged

- [ ] **Step 5: Commit**

```bash
git add src/components/Portfolio.jsx
git commit -m "fix(mobile): fix masonry media query, add card entrance animation in Portfolio.jsx"
```

---

## Task 4: TestimonialHighlight.jsx — Font Size + Animations

**Spec ref:** Component 4

**Files:**
- Modify: `src/components/TestimonialHighlight.jsx`

- [ ] **Step 1: Read the full file**

Open `src/components/TestimonialHighlight.jsx`. Locate:
- The `<style>` block with existing mobile media queries
- The quote `<p>` or `<blockquote>` element and its current `fontSize`
- The Image 1 element — the tall portrait with `marginTop: 'clamp(-120px, -12vw, -60px)'` applied as an inline style prop
- The Image 2 element (landscape)

Confirm the existing mobile CSS already stacks the layout vertically. Do NOT re-add that.

- [ ] **Step 2: Enlarge quote font on mobile**

Find the quote text element (has `fontSize` using `clamp()`). Add isMobile detection at component level (same pattern as Task 1):

```jsx
const [isMobile, setIsMobile] = React.useState(
  typeof window !== 'undefined' && window.innerWidth < 810
)
React.useEffect(() => {
  const mq = window.matchMedia('(max-width: 809px)')
  const handler = (e) => setIsMobile(e.matches)
  mq.addEventListener('change', handler)
  setIsMobile(mq.matches)
  return () => mq.removeEventListener('change', handler)
}, [])
```

Then update the quote font size:

```jsx
fontSize: isMobile ? 'clamp(22px, 6vw, 36px)' : 'clamp(18px, 2.5vw, 32px)'
// use whatever the existing desktop value is — do not change the desktop value
```

- [ ] **Step 3: Zero out Image 1 negative margin on mobile**

Find the `motion.div` for Image 1 that has `style={{ marginTop: 'clamp(-120px, -12vw, -60px)' }}`. Update it:

```jsx
style={{ marginTop: isMobile ? 0 : 'clamp(-120px, -12vw, -60px)' }}
```

Important: This MUST be at the React prop level. A CSS media query rule with `!important` cannot override Framer Motion inline styles.

- [ ] **Step 4: Add Framer Motion entrance animations**

Find the quote wrapper element. If it's already a `motion.div`, add `initial`/`whileInView` props. If it's a plain `div`, wrap it:

```jsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8 }}
>
  {/* existing quote JSX */}
</motion.div>
```

Find Image 1 wrapper (`motion.div` with the negative margin). Add/update animation props:

```jsx
initial={{ opacity: 0, scale: 0.95 }}
whileInView={{ opacity: 1, scale: 1 }}
viewport={{ once: true, amount: 0.2 }}
transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: 0.1 }}
```

Find Image 2 wrapper. Add/update:

```jsx
initial={{ opacity: 0, scale: 0.95 }}
whileInView={{ opacity: 1, scale: 1 }}
viewport={{ once: true, amount: 0.2 }}
transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: 0.25 }}
```

- [ ] **Step 5: Visual check at 375px**

- Quote text is larger and more dramatic
- No image overlap with quote text (negative margin gone)
- Images appear below quote, staggered fade+scale entrance
- At 1280px: side-by-side layout unchanged, original font sizes unchanged, original negative margin on Image 1 unchanged

- [ ] **Step 6: Commit**

```bash
git add src/components/TestimonialHighlight.jsx
git commit -m "fix(mobile): enlarge quote, fix image margin, add animations in TestimonialHighlight.jsx"
```

---

## Task 5: AboutText.jsx — Verify Only

**Spec ref:** Component 5

**Files:**
- Modify: `src/components/AboutText.jsx` (only if issues found)

- [ ] **Step 1: Read the full file**

Open `src/components/AboutText.jsx`. Note: this component uses `setState` inside a scroll listener (`setProgress`). This violates CLAUDE.md Rule 2 but is **existing behavior — do not change it**. It is the character-reveal animation and is explicitly out of scope.

- [ ] **Step 2: Visual check at 375px**

Navigate to the home page. Scroll to the AboutText section. Check:
- Text wraps cleanly with no horizontal overflow
- Font size is readable (should be `clamp(24px, 4.5vw, 48px)` — verify it renders at ~24px on 375px)
- Padding does not cause content to touch the screen edges

- [ ] **Step 3: Patch only if needed**

If any overflow or clipping is found, make the minimal fix. Common issues:
- `maxWidth` too tight: increase or remove
- Padding too small: increase min value in `clamp()`

If no issues found, skip to commit.

- [ ] **Step 4: Commit (even if no changes)**

```bash
git add src/components/AboutText.jsx
git commit -m "fix(mobile): verify AboutText.jsx — no changes needed" --allow-empty
```

Or if changes were made:
```bash
git add src/components/AboutText.jsx
git commit -m "fix(mobile): patch overflow in AboutText.jsx"
```

---

## Task 6: Collaborations — SKIP

**Spec ref:** Component 6 — orphaned file, not rendered anywhere in the app.

No action. Proceed directly to Task 7.

---

## Task 7: Footer.jsx — Stack Inner Columns

**Spec ref:** Component 7

**Files:**
- Modify: `src/components/Footer.jsx`

- [ ] **Step 1: Read the full file**

Open `src/components/Footer.jsx`. Locate:
- The existing `<style>` block with `.footer-grid { flex-direction: column }` mobile rule
- The right block containing the inner nav columns (Pages, Socials, Stats) — it's a flex row with `gap: clamp(40px, 5vw, 80px)` (or similar)
- The CTA section at the top

- [ ] **Step 2: Add class name to inner nav columns container**

Find the inner `<div>` that holds the Pages, Socials, and Stats columns side by side. Add `className="footer-nav-columns"` to it (keep any existing className if present, just append).

- [ ] **Step 3: Add mobile rule to style block**

In the existing `<style>` block, append:

```css
@media (max-width: 809px) {
  .footer-nav-columns {
    flex-direction: column !important;
    gap: clamp(20px, 4vw, 32px) !important;
  }
  .footer-grid {
    gap: clamp(20px, 4vw, 40px) !important;
  }
}
```

Note: `.footer-grid` already has `flex-direction: column` on mobile — only the gap is being changed here.

- [ ] **Step 4: Add section entrance animation**

Wrap the CTA section in a `motion.div` (or add props if already a motion element):

```jsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8 }}
>
```

Wrap the nav columns container in a `motion.div` with a slight delay:

```jsx
<motion.div
  className="footer-nav-columns"
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: 0.1 }}
>
```

- [ ] **Step 5: Visual check at 375px**

- All 3 nav columns (Pages, Socials, Stats) stack vertically with readable spacing
- CTA section is full-width, text readable
- No columns are side-by-side or cramped
- At 1280px: desktop layout unchanged

- [ ] **Step 6: Commit**

```bash
git add src/components/Footer.jsx
git commit -m "fix(mobile): stack inner nav columns, tighten gaps in Footer.jsx"
```

---

## Task 8: AboutPage.jsx — Move Headline Image Below

**Spec ref:** Component 8

**Files:**
- Modify: `src/pages/AboutPage.jsx`

- [ ] **Step 1: Read the full file**

Open `src/pages/AboutPage.jsx`. Locate:
- The headline `<h1>` element with large `clamp()` font size
- The inline image embedded inside or adjacent to the headline (small, `clamp(60px, 12vw, 160px)` width)
- The `<style>` block (if present)
- The right-side nav (should already be hidden on mobile)

Note which image source/variable the inline image uses — you'll need it for the mobile full-width version.

- [ ] **Step 2: Hide inline headline image on mobile**

Add `className="headline-inline-image"` to the inline image element. In the `<style>` block (add one if absent):

```css
@media (max-width: 809px) {
  .headline-inline-image { display: none !important; }
}
```

- [ ] **Step 3: Add full-width mobile image below headline**

Directly after the headline element (outside the `<h1>` tag), add a new `motion.div` that is only visible on mobile:

```jsx
<motion.div
  className="headline-mobile-image"
  initial={{ opacity: 0, y: 30, scale: 0.95 }}
  whileInView={{ opacity: 1, y: 0, scale: 1 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8 }}
>
  {/* Use same image source as the inline image */}
  <img
    src={/* same src as the inline image */}
    alt=""
    style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px', objectFit: 'cover' }}
  />
</motion.div>
```

Add to `<style>`:

```css
.headline-mobile-image { display: none; }
@media (max-width: 809px) {
  .headline-mobile-image {
    display: block;
    margin-top: 20px;
    margin-bottom: 8px;
  }
}
```

- [ ] **Step 4: Visual check at 375px**

- Headline is full-width text, no inline image
- Full-width image appears below headline with cinematic fade-up + scale entrance
- Image is not distorted (aspect ratio preserved)
- At 810px and 1280px: inline image visible in headline, mobile image hidden, layout unchanged

- [ ] **Step 5: Commit**

```bash
git add src/pages/AboutPage.jsx
git commit -m "fix(mobile): move headline image below with reveal animation in AboutPage.jsx"
```

---

## Task 9: ContactPage.jsx — Fix Form Layout

**Spec ref:** Component 9

**Files:**
- Modify: `src/pages/ContactPage.jsx`

- [ ] **Step 1: Read the full file**

Open `src/pages/ContactPage.jsx`. Locate:
- The `.contact-grid` container — already has `flex-direction: column` on mobile via media query
- The info panel element with `flex: '1 1 300px'` and `minWidth: '260px'`
- The form container element with `flex: '1.5 1 350px'` and `minWidth: '280px'` (or similar)
- The individual form field elements (inputs and textarea)
- The `<style>` block

Note: The navbar in ContactPage already uses `clamp()` for horizontal padding — no change needed there.

- [ ] **Step 2: Fix minWidth preventing full-width on mobile**

In the existing `<style>` block, append (or add a new block):

```css
@media (max-width: 809px) {
  .contact-info-panel {
    min-width: 0 !important;
    width: 100% !important;
    flex: 1 1 100% !important;
  }
  .contact-form-panel {
    min-width: 0 !important;
    width: 100% !important;
    flex: 1 1 100% !important;
  }
}
```

Add `className="contact-info-panel"` to the info panel element and `className="contact-form-panel"` to the form container (keep any existing classNames).

- [ ] **Step 3: Add form field entrance animations**

Find the array of form fields (inputs, textarea). If they are rendered via `.map()`, add a `motion.div` wrapper with stagger using `index`. If they're individual JSX elements, wrap each one:

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.5 }}
  transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: index * 0.08 }}
>
  {/* existing input/textarea JSX */}
</motion.div>
```

If fields are not in a map, add delays manually: 0s, 0.08s, 0.16s, 0.24s, 0.32s.

- [ ] **Step 4: Visual check at 375px**

- Info panel is full-width, not cramped
- Form is full-width, inputs stretch edge to edge (minus padding)
- Form fields animate in with staggered fade-up
- At 1280px: side-by-side layout unchanged

- [ ] **Step 5: Commit**

```bash
git add src/pages/ContactPage.jsx
git commit -m "fix(mobile): fix flex cramping, add form field animations in ContactPage.jsx"
```

---

## Task 10: MyShotsPage.jsx + MyShots.jsx

**Spec ref:** Component 10

### Part A: MyShotsPage.jsx

**Files:**
- Modify: `src/pages/MyShotsPage.jsx`

- [ ] **Step 1: Read MyShotsPage.jsx**

Locate:
- The navbar-like top bar with hardcoded `padding: '20px 40px'`
- The inline headline image (same pattern as AboutPage)
- The `<style>` block

- [ ] **Step 2: Fix navbar padding**

Find `padding: '20px 40px'` (the top bar). Replace the inline style with isMobile detection (same pattern as Tasks 1 and 4):

```jsx
const [isMobile, setIsMobile] = React.useState(
  typeof window !== 'undefined' && window.innerWidth < 810
)
React.useEffect(() => {
  const mq = window.matchMedia('(max-width: 809px)')
  const handler = (e) => setIsMobile(e.matches)
  mq.addEventListener('change', handler)
  setIsMobile(mq.matches)
  return () => mq.removeEventListener('change', handler)
}, [])
```

Then:
```jsx
padding: isMobile ? '12px 16px' : '20px 40px'
```

- [ ] **Step 3: Move headline image below on mobile**

Apply the exact same pattern as Task 8 (AboutPage):
- Add `className="headline-inline-image"` to inline image, hide it on mobile via CSS
- Add a `motion.div` with `className="headline-mobile-image"` below the headline, visible only on mobile
- Same animation: `opacity: 0, y: 30, scale: 0.95` → `opacity: 1, y: 0, scale: 1`, spring `stiffness: 60, damping: 14, mass: 0.8`

- [ ] **Step 4: Visual check at 375px**

- Navbar padding is correct (no overflow)
- Headline image appears below as full-width reveal
- At 1280px: inline image in headline, navbar padding unchanged

- [ ] **Step 5: Commit MyShotsPage**

```bash
git add src/pages/MyShotsPage.jsx
git commit -m "fix(mobile): fix navbar padding, move headline image in MyShotsPage.jsx"
```

---

### Part B: MyShots.jsx

**Files:**
- Modify: `src/components/MyShots.jsx`

- [ ] **Step 6: Read MyShots.jsx fully**

Locate:
- `ShotsSection` (or the main export component)
- `MagneticCard` component — find the `onMouseMove` handler that sets `rotateX`/`rotateY`
- `ParallaxImage` component — find the `useScroll` + `useTransform` hook
- The masonry `<style>` block with the two media queries
- The `viewport={{ once: false, amount: 0.05 }}` prop on card animations

- [ ] **Step 7: Add isMobile detection to ShotsSection**

In the top-level `ShotsSection` (or main export) component, add:

```jsx
const [isMobile, setIsMobile] = useState(
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
)
useEffect(() => {
  const mq = window.matchMedia('(pointer: coarse)')
  const handler = (e) => setIsMobile(e.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}, [])
```

Pass `isMobile` as a prop to each `MagneticCard`:

```jsx
<MagneticCard isMobile={isMobile} ...existingProps>
```

- [ ] **Step 8: Disable tilt in MagneticCard on mobile**

In `MagneticCard`, add `isMobile` to its props destructuring. Find the `onMouseMove` handler. Wrap it with an early return:

```jsx
const handleMouseMove = (e) => {
  if (isMobile) return  // add this line at the top
  // ... existing handler code
}
```

Also find where `rotateX` and `rotateY` are used in the style/animate prop. When `isMobile`, set them to `0`:

```jsx
animate={{
  rotateX: isMobile ? 0 : rotateX,
  rotateY: isMobile ? 0 : rotateY,
  // ... other animate props
}}
```

- [ ] **Step 9: Pass isMobile to ParallaxImage**

If `ParallaxImage` is a child of `MagneticCard`, pass `isMobile` down:

```jsx
<ParallaxImage isMobile={isMobile} ...existingProps />
```

In `ParallaxImage`, add `isMobile` to props. Find the `useScroll` and `useTransform` calls. Skip them entirely on mobile by wrapping the image style:

```jsx
// Keep the existing hooks (React rules forbid conditional hooks)
// but make the transform a no-op on mobile:
const y = useTransform(scrollYProgress, [0, 1], [-30, 30])
// use whatever the existing range values are

// Then in the style prop, conditionally apply y:
<motion.div style={{ y: isMobile ? 0 : y }}>
  {/* existing image */}
</motion.div>
```

This preserves the hooks (required by React rules) while skipping the CPU cost of applying the transform on mobile.

- [ ] **Step 10: Fix masonry to 1 column on mobile**

Find in the `<style>` block:

```css
@media (max-width: 809px) { .shots-grid { columns: 2 !important; } }
```

Change `columns: 2` to `columns: 1`:

```css
@media (max-width: 809px) { .shots-grid { columns: 1 !important; } }
```

The existing `@media (max-width: 480px) { .shots-grid { columns: 1 !important; } }` rule is now redundant but harmless — leave it.

- [ ] **Step 11: Fix card viewport and animation for mobile**

Find the `viewport={{ once: false, amount: 0.05 }}` on card animation wrappers. Update to:

```jsx
viewport={{ once: isMobile ? true : false, amount: 0.05 }}
```

Note: `isMobile` needs to flow to wherever the `viewport` prop is used. If cards are rendered in `ShotsSection`, this is straightforward. If inside `MagneticCard`, thread it through.

Update card entrance animation for mobile (simpler fade-up instead of directional slides):

```jsx
initial={isMobile ? { opacity: 0, y: 30 } : existingInitial}
animate={isMobile ? { opacity: 1, y: 0 } : existingAnimate}
transition={isMobile
  ? { type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay: index * 0.06 }
  : existingTransition
}
```

- [ ] **Step 12: Make hover overlay always visible on mobile**

Find the hover overlay `<div>` (the one that shows title/category on hover — uses `opacity: 0` normally and `opacity: 1` on hover). Add a mobile override:

```jsx
opacity: isMobile ? 0.85 : 0,  // always visible at reduced opacity on mobile
// remove or override the hover state that changes it to 1
```

If the hover is controlled by Framer Motion `whileHover`, add an `animate` prop:

```jsx
animate={{ opacity: isMobile ? 0.85 : 0 }}
whileHover={{ opacity: isMobile ? 0.85 : 1 }}
```

- [ ] **Step 13: Visual check at 375px**

- Single column masonry
- No 3D tilt when tapping/touching cards
- Cards fade up (not slide from side) on scroll
- Card overlay is visible without hovering
- At 1280px: 3 columns, tilt works on hover, directional slide animations, overlay appears on hover, `once: false` still works (cards re-animate on scroll in/out)

- [ ] **Step 14: Commit MyShots**

```bash
git add src/components/MyShots.jsx
git commit -m "fix(mobile): disable tilt+parallax, fix masonry, add mobile animations in MyShots.jsx"
```

---

## Final Check

- [ ] **Run a full viewport sweep**

Check all pages at 375px, 414px, 810px, and 1280px:
- `/` (Home) — hero, testimonial, about text, services, portfolio, footer
- `/about`
- `/contact`
- `/my-shots`

Look for: horizontal scroll, overflow, text clipping, broken layouts, animations not firing.

- [ ] **Check desktop is untouched at 1440px**

Resize to 1440px and compare every section visually. Nothing should look different from before this implementation.

- [ ] **Final commit**

```bash
git add -p  # review any unstaged changes
git commit -m "fix(mobile): complete mobile responsiveness pass"
```
