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
2. **No full rewrites** — targeted patches only; read file completely before editing
3. **Hardcoded `padding: '0 40px'`** → replace with `clamp(16px, 5vw, 40px)` on all occurrences
4. **Mobile animations** — Framer Motion `whileInView` + `once: true` to prevent repeat triggers
5. **Spring config for mobile reveals:** `stiffness: 60, damping: 14, mass: 0.8`
6. **Touch targets** — minimum 44×44px for all interactive elements on mobile
7. **Images on mobile** — `width: 100%`, `height: auto`, aspect ratio preserved
8. **Per-component workflow:** Read → Ask questions → Patch → Verify desktop → Commit

---

## Component Specs

### 1. Hero.jsx

**Mobile changes:**
- Replace all `padding: '0 40px'` with `clamp(16px, 5vw, 40px)`
- Disable rAF parallax on mobile (< 810px); replace with lightweight IntersectionObserver-based parallax capped at ±20px translate (vs desktop ±60px)
- Bottom bar: stack to column layout on mobile
- Recent work image (172×172px): scale to `clamp(80px, 25vw, 140px)` on mobile

**Mobile animation:** Fade-in entrance for headline + tagline with staggered delay

---

### 2. Services.jsx

**Mobile changes:**
- Hide the absolutely-positioned floating image entirely on mobile (`display: none` below 810px)
- Accordion remains text-only on mobile — no image shown on expand
- Ensure touch targets on accordion rows are ≥ 44px height

**Mobile animation:** Accordion content slides down on expand (existing); section heading gets fade-up reveal on viewport enter

---

### 3. Portfolio.jsx

**Mobile changes:**
- Fix broken media query: change `grid-template-columns: 1fr` to `columns: 1` (the component uses CSS columns, not grid)
- Single-column masonry on mobile

**Mobile animation:** Each card fades up with staggered delay as it enters the viewport (`whileInView`, `once: true`)

---

### 4. TestimonialHighlight.jsx

**Mobile changes:**
- Remove side-by-side layout; stack vertically: quote section first, then images below
- Remove negative margin on images (was `clamp(-120px, -12vw, -60px)`) — set to 0 on mobile
- Images go full-width below the quote
- Quote font size larger on mobile: `clamp(22px, 6vw, 36px)` for dramatic typographic impact

**Mobile animation:**
- Quote: fade-in from below on viewport enter
- Image 1: fade-up + scale 0.95→1.0 (delay 0.1s)
- Image 2: fade-up + scale 0.95→1.0 (delay 0.25s)
- Spring: `stiffness: 60, damping: 14, mass: 0.8`

---

### 5. AboutText.jsx

**Mobile changes:**
- Already responsive via `clamp()` — verify it renders correctly at 375px
- No structural changes expected; patch only if visual issues found

**Mobile animation:** Keep existing character-by-character scroll reveal (already works on mobile)

---

### 6. Collaborations.jsx

**Mobile changes:**
- Tighten logo grid gap on mobile
- Scale badge sizes down with `clamp()`
- Ensure logo grid wraps properly at mobile widths

**Mobile animation:** Staggered logo fade-in on viewport enter (`whileInView`, `once: true`)

---

### 7. Footer.jsx

**Mobile changes:**
- Stack all 3 columns (Pages, Socials, Stats) vertically — nothing hidden, nothing collapsed
- Tighten column gaps: use `clamp(24px, 4vw, 40px)` instead of `clamp(40px, 6vw, 80px)`
- Tighten email font: keep `clamp()` but reduce min value if needed at 375px

**Mobile animation:** Staggered column reveal (each column fades up with 0.1s stagger)

---

### 8. AboutPage.jsx

**Mobile changes:**
- Hide the inline decorative image from the headline on mobile
- Show a full-width version of the same image *below* the headline on mobile
- Hide right-side nav on mobile (already done via media query — verify)

**Mobile animation:** Full-width image below headline: fade-up + scale 0.95→1.0 (`stiffness: 60, damping: 14`)

---

### 9. ContactPage.jsx

**Mobile changes:**
- Stack contact info + form vertically (already partially done — verify and fix 300px flex cramping)
- Change `flex: '1 1 300px'` to `flex: '1 1 100%'` on mobile
- Ensure form inputs have adequate padding and font size on mobile

**Mobile animation:** Form fields stagger fade-in on viewport enter (0.08s stagger per field)

---

### 10. MyShotsPage.jsx + MyShots.jsx

**MyShotsPage.jsx mobile changes:**
- Inline image in headline: hide on mobile, show full-width below headline with cinematic reveal (same as AboutPage pattern)

**MyShots.jsx mobile changes:**
- Disable MagneticCard 3D tilt on mobile (detect via `window.matchMedia('(pointer: coarse)')` or width check)
- Disable ParallaxImage scroll transform on mobile
- Change masonry from 3 columns to 1 column on mobile (fix existing media query)
- Hover overlay on cards: convert to always-visible bottom overlay on mobile (since no hover on touch)

**Mobile animation:** Each card fades up with staggered delay as it enters viewport (`whileInView`, `once: true`, stagger 0.06s)

---

## Execution Order

Work strictly in order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

For each component:
1. Read the full component file
2. Ask any remaining component-specific questions before touching code
3. Dispatch a fresh subagent per component
4. Verify desktop is unchanged after edits
5. Commit with message: `fix(mobile): make <ComponentName> responsive`

**Stop conditions:** Only stop for a decision that requires user input. Otherwise work autonomously.

---

## Revert Policy

If a component breaks after patching:
- Revert that component: `git checkout HEAD -- src/components/<Component>.jsx`
- Log the failure
- Skip to the next component
- Report at end of session

---

## Out of Scope

- Navbar (already mobile-responsive — hamburger menu done)
- PortfolioPage.jsx (low priority — inline image pattern will be consistent with AboutPage once done)
- No new dependencies — Framer Motion already installed
- No changes to Tailwind config
- No desktop layout or animation changes of any kind
