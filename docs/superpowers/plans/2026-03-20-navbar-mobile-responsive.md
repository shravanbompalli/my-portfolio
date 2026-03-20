# Navbar Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Navbar.jsx fully responsive at three breakpoints (phone/tablet <1280px = hamburger, desktop ≥1280px = full bar) with a cinematic Framer Motion split-reveal mobile menu.

**Architecture:** Two files only — `tailwind.config.js` gets custom `tablet`/`desktop` screen tokens; `Navbar.jsx` swaps `md:` classes to `desktop:`, replaces the snap-open overlay with an `AnimatePresence`-wrapped two-panel split-reveal, and animates the hamburger button ☰→✕. Desktop layout is byte-for-byte identical above 1280px.

**Tech Stack:** Vite + React 18, Tailwind CSS v3 (custom screens), Framer Motion v12 (already installed), Supabase (existing data fetch — untouched)

> **Note:** No automated test framework is configured in this project. All verification steps are visual checks using the Vite dev server + browser DevTools responsive mode. Run `npm run dev` once at the start and keep it open throughout.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `tailwind.config.js` | Modify | Add `tablet: '810px'` and `desktop: '1280px'` to `theme.extend.screens` |
| `src/components/Navbar.jsx` | Modify | 4 targeted edits: z-index, class swaps, split-reveal menu, hamburger animation |

---

## Task 1: Add custom Tailwind breakpoints

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Open `tailwind.config.js` and read current content**

  Current content:
  ```js
  export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: { extend: {} },
    plugins: [],
  }
  ```

- [ ] **Step 2: Add custom screens to `theme.extend`**

  Replace the `theme` block:
  ```js
  /** @type {import('tailwindcss').Config} */
  export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
      extend: {
        screens: {
          tablet: '810px',
          desktop: '1280px',
        },
      },
    },
    plugins: [],
  }
  ```

- [ ] **Step 3: Verify dev server picks up the new config**

  Run: `npm run dev` (keep running for all remaining tasks)

  Add a temporary class `tablet:text-red-500` to any JSX element in `Navbar.jsx`, open DevTools at 810px wide, and confirm the text turns red. Remove the temporary class after verifying.

- [ ] **Step 4: Commit**

  ```bash
  git add tailwind.config.js
  git commit -m "feat: add tablet (810px) and desktop (1280px) custom Tailwind breakpoints"
  ```

---

## Task 2: Swap breakpoint classes and fix z-index

**Files:**
- Modify: `src/components/Navbar.jsx`

These are surgical find-and-replace edits only. No logic changes.

- [ ] **Step 1: Raise `<nav>` z-index from `z-50` to `z-[110]`**

  Find (line 71):
  ```jsx
  <nav className="fixed top-0 left-0 right-0 z-50"
  ```
  Replace with:
  ```jsx
  <nav className="fixed top-0 left-0 right-0 z-[110]"
  ```

  Reason: The overlay renders at `z-[100]`. Without this change, the hamburger button (inside the `<nav>` at `z-50`) would be hidden under the overlay when the menu is open.

- [ ] **Step 2: Swap contact info left column class**

  Find (line 79):
  ```jsx
  <div className="hidden md:flex flex-col gap-0.5" style={{ minWidth: '200px' }}>
  ```
  Replace with:
  ```jsx
  <div className="hidden desktop:flex flex-col gap-0.5" style={{ minWidth: '200px' }}>
  ```

- [ ] **Step 3: Swap title/location right column class**

  Find (line 123):
  ```jsx
  <div className="hidden md:flex flex-col items-end gap-0.5" style={{ minWidth: '200px' }}>
  ```
  Replace with:
  ```jsx
  <div className="hidden desktop:flex flex-col items-end gap-0.5" style={{ minWidth: '200px' }}>
  ```

- [ ] **Step 4: Swap hamburger button class**

  Find (line 147–148):
  ```jsx
  <button
    className="md:hidden flex flex-col items-center justify-center"
  ```
  Replace with:
  ```jsx
  <button
    className="desktop:hidden flex flex-col items-center justify-center"
  ```

  Also update the button's `style` to enforce the 44×44px touch target minimum:
  ```jsx
  style={{
    background: 'rgba(0,0,0,0.4)',
    borderRadius: '10px',
    padding: '13px',
    border: 'none',
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '44px',
  }}
  ```

- [ ] **Step 5: Visual check — desktop unchanged**

  Open `http://localhost:5173` at ≥1280px width. Confirm:
  - Contact info visible on left ✓
  - SHRAVAN centered ✓
  - Title/location visible on right ✓
  - No hamburger visible ✓

- [ ] **Step 6: Visual check — tablet/phone shows hamburger**

  In DevTools, set viewport to 1279px. Confirm:
  - Contact info and title/location hidden ✓
  - SHRAVAN centered ✓
  - Hamburger button visible top-right ✓

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/Navbar.jsx
  git commit -m "feat(navbar): swap md: breakpoints to desktop:, raise nav z-index to z-[110]"
  ```

---

## Task 3: Replace overlay with Framer Motion split-reveal

**Files:**
- Modify: `src/components/Navbar.jsx`

This task replaces the entire `{menuOpen && (...)}` block (lines 163–264) with an `AnimatePresence`-wrapped split-reveal overlay.

- [ ] **Step 1: Add `AnimatePresence` and `motion` to the import**

  Find line 1:
  ```jsx
  import { useState, useEffect } from 'react'
  ```
  Replace with:
  ```jsx
  import { useState, useEffect } from 'react'
  import { AnimatePresence, motion } from 'framer-motion'
  ```

- [ ] **Step 2: Add animation variants above the `Navbar` function**

  Add these constants directly above `export default function Navbar()` (after the `NavLink` component):

  ```jsx
  const leftPanelVariants = {
    initial: { x: '-100%' },
    animate: { x: 0, transition: { type: 'spring', stiffness: 60, damping: 18, mass: 1 } },
    exit:    { x: '-100%', transition: { type: 'spring', stiffness: 60, damping: 18, mass: 1 } },
  }

  const rightPanelVariants = {
    initial: { x: '100%' },
    animate: { x: 0, transition: { type: 'spring', stiffness: 60, damping: 18, mass: 1 } },
    exit:    { x: '100%', transition: { type: 'spring', stiffness: 60, damping: 18, mass: 1 } },
  }

  const linkContainerVariants = {
    animate: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
  }

  const linkItemVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  }
  ```

- [ ] **Step 3: Replace the `{menuOpen && (...)}` block**

  Find the entire block starting at:
  ```jsx
  {/* Mobile fullscreen menu */}
  {menuOpen && (
  ```
  ...through the closing `)}` at line 264.

  Replace the entire block with:

  ```jsx
  {/* Mobile fullscreen split-reveal menu */}
  {/* Note: backdrop and panels container are siblings (not nested). DOM order stacks
      panels above backdrop at the same z-[100] — this is intentional. */}
  <AnimatePresence>
    {menuOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 z-[100]"
          style={{ backgroundColor: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        />

        {/* Two panels — flex row, fill screen */}
        <div className="fixed inset-0 z-[100] flex overflow-hidden">

          {/* Left panel — Pages */}
          <motion.div
            className="flex-1 flex flex-col justify-center"
            style={{
              padding: '80px 32px 32px',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
            variants={leftPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <p style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: '14px',
              color: '#aaa',
              letterSpacing: '2px',
              marginBottom: '16px',
            }}>
              PAGES
            </p>
            <motion.div variants={linkContainerVariants} animate="animate" initial="initial">
              {/* About is intentionally omitted — matches the existing mobile menu which
                  never included it. The About page is accessible via /about directly. */}
              {[
                { label: 'Home',      href: '/'          },
                { label: 'Portfolio', href: '/portfolio'  },
                { label: 'My Shots',  href: '/my-shots'  },
                { label: 'Contact',   href: '/contact'   },
              ].map(link => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  variants={linkItemVariants}
                  style={{
                    fontFamily: '"Geist", sans-serif',
                    fontSize: '32px',
                    fontWeight: 500,
                    color: '#fff',
                    textDecoration: 'none',
                    letterSpacing: '-0.02em',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'block',
                  }}
                >
                  {link.label}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* Right panel — Social + Contact */}
          <motion.div
            className="flex-1 flex flex-col justify-between"
            style={{ padding: '80px 32px 32px' }}
            variants={rightPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div>
              <p style={{
                fontFamily: '"Geist", sans-serif',
                fontSize: '14px',
                color: '#aaa',
                letterSpacing: '2px',
                marginBottom: '16px',
              }}>
                SOCIAL
              </p>
              <motion.div variants={linkContainerVariants} animate="animate" initial="initial">
                {social?.instagram && (
                  <motion.a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener"
                    onClick={() => setMenuOpen(false)}
                    variants={linkItemVariants}
                    style={{
                      fontFamily: '"Geist", sans-serif',
                      fontSize: '24px',
                      fontWeight: 500,
                      color: '#fff',
                      textDecoration: 'none',
                      padding: '10px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      display: 'block',
                    }}
                  >
                    Instagram
                  </motion.a>
                )}
                {social?.youtube && (
                  <motion.a
                    href={social.youtube}
                    target="_blank"
                    rel="noopener"
                    onClick={() => setMenuOpen(false)}
                    variants={linkItemVariants}
                    style={{
                      fontFamily: '"Geist", sans-serif',
                      fontSize: '24px',
                      fontWeight: 500,
                      color: '#fff',
                      textDecoration: 'none',
                      padding: '10px 0',
                      display: 'block',
                    }}
                  >
                    YouTube
                  </motion.a>
                )}
              </motion.div>
            </div>

            {/* Contact footer — pinned to bottom */}
            {contact && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                <a href={`mailto:${contact.email}`}
                  style={{
                    fontFamily: '"Geist", sans-serif',
                    fontSize: '16px',
                    color: '#aaa',
                    textDecoration: 'none',
                    display: 'block',
                  }}>
                  {contact.email}
                </a>
                <a href={`tel:${contact.phone}`}
                  style={{
                    fontFamily: '"Geist", sans-serif',
                    fontSize: '16px',
                    color: '#606060',
                    textDecoration: 'none',
                    display: 'block',
                    marginTop: '4px',
                  }}>
                  {contact.phone}
                </a>
              </div>
            )}
          </motion.div>

        </div>
      </>
    )}
  </AnimatePresence>
  ```

- [ ] **Step 4: Visual check — menu opens and closes**

  Open `http://localhost:5173` at ≤1279px. Click the hamburger:
  - Both panels slide in simultaneously from opposite sides ✓
  - Left panel: Home, Portfolio, My Shots, Contact ✓
  - Right panel: Instagram, YouTube, contact footer ✓
  - Links stagger in after panels land ✓
  - Click hamburger again — both panels slide back out ✓
  - No layout shift after close ✓

- [ ] **Step 5: Check no horizontal scroll**

  With menu closed at 375px viewport, scroll horizontally — should be none. Same check with menu open.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/Navbar.jsx
  git commit -m "feat(navbar): replace snap menu with Framer Motion split-reveal overlay"
  ```

---

## Task 4: Animate hamburger ☰ → ✕

**Files:**
- Modify: `src/components/Navbar.jsx`

- [ ] **Step 1: Replace the static hamburger button content with animated bars**

  Find the hamburger `<button>` block (the one with `desktop:hidden` from Task 2). Replace its children and style:

  ```jsx
  <button
    className="desktop:hidden flex items-center justify-center"
    style={{
      background: menuOpen ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.4)',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      minWidth: '44px',
      minHeight: '44px',
      transition: 'background 0.25s',
    }}
    onClick={() => setMenuOpen(!menuOpen)}>
    <div style={{ width: '18px', height: '11px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <motion.span
        style={{ display: 'block', height: '1px', background: '#fff', transformOrigin: 'center' }}
        animate={menuOpen
          ? { rotate: 45, y: 5, width: '18px' }
          : { rotate: 0, y: 0, width: '18px' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      />
      <motion.span
        style={{ display: 'block', height: '1px', background: '#fff' }}
        animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        style={{ display: 'block', height: '1px', background: '#fff', transformOrigin: 'center' }}
        animate={menuOpen
          ? { rotate: -45, y: -5, width: '18px' }
          : { rotate: 0, y: 0, width: '10px' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      />
    </div>
  </button>
  ```

  > Note: The three bars (18px, 14px, 10px wide) converge to equal 18px width when forming the X, so the cross looks balanced. The original tapered widths restore on close.

- [ ] **Step 2: Visual check — hamburger animates smoothly**

  At ≤1279px viewport:
  - Click hamburger → bars animate into clean X, button background lightens ✓
  - Click X → bars return to tapered ☰, button background darkens ✓
  - Animation is smooth, no jank ✓

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/Navbar.jsx
  git commit -m "feat(navbar): animate hamburger bars to X on menu open"
  ```

---

## Task 5: Final verification across all breakpoints

- [ ] **Step 1: Desktop (≥1280px)**

  Set DevTools viewport to 1280px. Confirm:
  - Contact info left, SHRAVAN center, title/location right — identical to before ✓
  - No hamburger visible ✓
  - NavLink hover animation (orange slide) works on desktop ✓

- [ ] **Step 2: Tablet (810px–1279px)**

  Set viewport to 1024px then 810px. Confirm:
  - SHRAVAN centered, hamburger right ✓
  - Menu opens/closes with split-reveal ✓
  - No horizontal scroll ✓

- [ ] **Step 3: Phone (375px — iPhone SE, smallest target)**

  Set viewport to 375px. Confirm:
  - Layout fits, no overflow ✓
  - Hamburger touch target feels large enough ✓
  - All menu links tappable (visually confirm padding) ✓
  - Contact footer at 16px readable ✓

- [ ] **Step 4: Test menu open → navigate → menu closes**

  Click a page link in the menu. Confirm `setMenuOpen(false)` fires and the menu exits with the split animation, not a snap.

- [ ] **Step 5: Final commit**

  ```bash
  git add src/components/Navbar.jsx tailwind.config.js
  git commit -m "chore(navbar): final verification pass — mobile responsive complete"
  ```

---

## Done

Navbar is fully responsive. Desktop identical. Two files touched. `tailwind.config.js` breakpoints (`tablet`, `desktop`) are now available project-wide for all future components.
