# Navbar Mobile Responsive — Design Spec
**Date:** 2026-03-20
**Scope:** `Navbar.jsx` only. No other components touched.

---

## Goal

Make the Navbar fully responsive across all three project breakpoints without altering any existing desktop appearance or animations.

---

## Breakpoints

Project-defined breakpoints, added to `tailwind.config.js`:

| Name | Value | Behavior |
|---|---|---|
| `tablet` | 810px | Lower bound of tablet range |
| `desktop` | 1280px | Full desktop bar threshold |

- **≥ 1280px (`desktop:`)** — full three-column bar: contact left, SHRAVAN center, title/location right. Identical to current desktop.
- **< 1280px (tablet + phone)** — SHRAVAN centered, hamburger button right. Fullscreen split-reveal menu on open.

---

## Files Changed

1. `tailwind.config.js` — extend `theme.screens` with `tablet` and `desktop`
2. `src/components/Navbar.jsx` — breakpoint class swaps + Framer Motion split-reveal menu

---

## tailwind.config.js Change

Extend the existing `screens` config (do not replace defaults):

```js
theme: {
  extend: {
    screens: {
      tablet: '810px',
      desktop: '1280px',
    },
  },
},
```

---

## Navbar.jsx Changes

### 1. Breakpoint class swaps

| Element | Current class | New class |
|---|---|---|
| Contact info (left) | `hidden md:flex` | `hidden desktop:flex` |
| Title/location (right) | `hidden md:flex` | `hidden desktop:flex` |
| Hamburger button | `md:hidden` | `desktop:hidden` |
| Fullscreen overlay wrapper | `md:hidden fixed inset-0 z-[100]` | Remove `md:hidden` — rendered conditionally via `AnimatePresence`, breakpoint class not needed |

The overlay wrapper's `md:hidden` class must be removed. Visibility is controlled entirely by `{menuOpen && (...)}` inside `AnimatePresence`.

### 2. Hamburger button — ☰ ↔ ✕ animated toggle

- `minWidth: 44px`, `minHeight: 44px` — meets mobile-reviewer 44×44px touch target minimum
- Background transitions: `rgba(0,0,0,0.4)` when closed → `rgba(255,255,255,0.1)` when open
- Three bars animate to an X using Framer Motion `animate` on `menuOpen` state:
  - Bar 1: `rotate: 45deg` + `translateY` to center
  - Bar 2: `opacity: 0`
  - Bar 3: `rotate: -45deg` + `translateY` to center
- No separate close button inside the overlay — this single button handles both states.
- **DOM placement & z-index:** The hamburger button stays in the navbar bar. The navbar `<nav>` is `z-50`; when the overlay opens at `z-[100]`, the button would be obscured. Fix: give the `<nav>` element `z-[110]` (raised from `z-50`) so the hamburger always floats above the overlay in both open and closed states. The overlay remains `z-[100]`.

### 3. Fullscreen split-reveal menu

Wrapped in `AnimatePresence` so exit animations play correctly.

**Structure:**
```
<AnimatePresence>
  {menuOpen && (
    <div fixed inset-0 z-[100] flex flex-col>
      <!-- backdrop -->
      <motion.div opacity 0→1 />

      <!-- two panels side by side, flex row, fill screen -->
      <motion.div  // left panel — Pages
        initial x="-100%", animate x=0, exit x="-100%"
        spring stiffness:60, damping:18, mass:1
      >
        label: "PAGES"
        links: Home (href="/"), Portfolio (href="/portfolio"), My Shots (href="/my-shots"), Contact (href="/contact")
        (each link: motion child, stagger in after panel lands)
      </motion.div>

      <motion.div  // right panel — Social + Contact
        initial x="100%", animate x=0, exit x="100%"
        spring stiffness:60, damping:18, mass:1
      >
        label: "SOCIAL"
        links: Instagram (if set), YouTube (if set)
        bottom: contact email + phone (font-size 16px minimum)
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

**Panel animation spec:**

| Property | Value |
|---|---|
| Left panel initial/exit | `x: '-100%'` |
| Right panel initial/exit | `x: '100%'` |
| Spring | `stiffness: 60, damping: 18, mass: 1` |
| Backdrop | `opacity: 0 → 1`, `duration: 0.25s` |
| Link stagger delay | `delayChildren: 0.2` (seconds, plain number — not a string) |
| Link stagger interval | `staggerChildren: 0.06` (seconds, plain number — not a string) |
| Link enter | `opacity: 0→1` + `x: ±20px→0`, `duration: 0.3s ease-out` |

**Panel layout:**
- Two equal-width flex columns, divided by `1px solid rgba(255,255,255,0.06)`
- Hamburger button is the `<nav>`-level button at `z-[110]`, floating visually above the overlay — no duplicate button rendered inside the overlay
- Contact email/phone pinned to bottom of right panel, `border-top: 1px solid rgba(255,255,255,0.06)`
- Background: `rgba(0,0,0,0.97)` + `backdropFilter: blur(12px)`

**Typography in menu (mobile-reviewer compliance):**

| Element | Size |
|---|---|
| Section labels | 14px, `#aaa`, letter-spacing 2px |
| Page links | 32px (phone), `padding: 8px 0` — produces ~48px tap height, no extra padding needed |
| Social links | 24px, `padding: 10px 0` (ensures ≥44px tap height) |
| Contact footer | 16px minimum (was 14px — bumped for compliance) |

---

## Constraints

- **NavLink desktop hover animation is not touched** — the `translateY` slide between white and `#ff4d00` text remains exactly as-is.
- No hover-only interactions in the mobile menu (mobile has no hover state).
- No `useState` on scroll — navbar has no scroll handlers, this is a non-issue here.
- No parallax in the navbar — nothing to disable.

---

## Mobile-Reviewer Checklist

- [x] No horizontal scroll at any breakpoint
- [x] Touch targets ≥ 44×44px (hamburger button, all menu links)
- [x] Text ≥ 16px on mobile (contact footer bumped from 14px)
- [x] No hover-only animations in mobile menu
- [x] No `useState` on scroll
- [x] Desktop layout identical at ≥ 1280px
- [x] NavLink desktop hover animation untouched

---

## Out of Scope

- No other components (Hero, Services, Footer, etc.)
- No mobile animation fallbacks for other components
- No SEO, no deploy changes
- No BentoCards, Reviews carousel, or FAQs (intentionally removed per CLAUDE.md)
