# Contact Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ContactPage's warm gradient hero with a 100vh full-bleed image hero, upgrade card entrance animations to FadeReveal, and add a contact_image field in AdminPanel.

**Architecture:** Two atomic patches — Task 1 modifies ContactPage.jsx (imports, hero replacement, card demotion to div + FadeReveal wrap, style block update) as a single build+commit. Task 2 adds one ImageUploader to AdminPanel.jsx's Contact & Social section.

**Tech Stack:** React 18, Framer Motion (already imported), Supabase, BlurText + FadeReveal from `src/components/reactbits/`

**Spec:** `docs/superpowers/specs/2026-03-21-contact-page-redesign.md`

---

## File Map

| File | Change |
|---|---|
| `src/pages/ContactPage.jsx` | Add imports, replace hero section, demote card motion.divs to divs + wrap with FadeReveal, update style block |
| `src/pages/AdminPanel.jsx` | Add ImageUploader for contact_image inside Contact & Social section |

---

## Task 1: Restructure ContactPage.jsx (atomic — all edits before first build)

**Files:**
- Modify: `src/pages/ContactPage.jsx`

All edits happen before any build or commit.

- [ ] **Step 1: Add BlurText and FadeReveal imports**

Find exactly:
```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
```

Replace with:
```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import BlurText from '../components/reactbits/BlurText'
import FadeReveal from '../components/reactbits/FadeReveal'
```

- [ ] **Step 2: Replace the hero section**

Find the entire old hero section — starts with:
```jsx
      {/* ── Hero ── */}
      <section style={{
        position: 'relative', width: '100%', minHeight: 'clamp(300px, 50vh, 500px)',
        overflow: 'hidden', backgroundColor: '#e8d8d0',
      }}>
```

And ends just before `{/* ── Contact Form ── */}`. Replace the entire block with:

```jsx
      {/* ── Hero: full-bleed image ── */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
        {/* Background image */}
        <motion.div
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {contact?.contact_image ? (
            <img
              src={contact.contact_image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #000)' }} />
          )}
        </motion.div>

        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 }} />

        {/* Content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 'clamp(24px, 6vw, 80px)',
        }}>
          {/* GET IN TOUCH headline */}
          <div className="contact-headline-wrap" style={{
            fontSize: 'clamp(48px, 11vw, 148px)', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#fff', lineHeight: 1, marginBottom: '16px',
          }}>
            <BlurText text="GET IN TOUCH" delay={100} animateBy="words" direction="bottom" />
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.5 }}
            style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: 'clamp(16px, 2vw, 22px)',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 32px', lineHeight: 1.5,
            }}
          >
            Let's create something timeless together.
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            style={{ color: 'rgba(255,255,255,0.4)', width: '24px' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>
        </div>
      </section>
```

- [ ] **Step 3: Demote info card from motion.div to div and wrap with FadeReveal**

Find exactly:
```jsx
          <motion.div
            className="contact-info-panel"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.1 }}
            style={{
              flex: '1 1 300px', minWidth: '260px',
              backgroundColor: '#fff', borderRadius: '12px', padding: 'clamp(20px, 3vw, 40px)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
```

Replace with:
```jsx
          <FadeReveal y={40} delay={0.1}>
          <div
            className="contact-info-panel"
            style={{
              flex: '1 1 300px', minWidth: '260px',
              backgroundColor: '#fff', borderRadius: '12px', padding: 'clamp(20px, 3vw, 40px)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
```

Then find the closing tag of that panel. It ends just before the form panel starts. Find exactly:
```jsx
          </motion.div>

          {/* Right — Form */}
          <motion.div
```

Replace with:
```jsx
          </div>
          </FadeReveal>

          {/* Right — Form */}
          <FadeReveal y={40} delay={0.25}>
          <motion.div
```

- [ ] **Step 4: Demote form card from motion.div to div and wrap with FadeReveal**

The form card `motion.div` was just wrapped with `<FadeReveal>` in Step 3 but its own `initial/animate` props must be removed to prevent conflicting animations.

Find exactly:
```jsx
          <FadeReveal y={40} delay={0.25}>
          <motion.div
            className="contact-form-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.2 }}
            style={{
              flex: '1.5 1 350px', minWidth: '280px',
              backgroundColor: '#000', borderRadius: '12px', padding: 'clamp(20px, 3vw, 40px)',
            }}
          >
```

Replace with:
```jsx
          <FadeReveal y={40} delay={0.25}>
          <div
            className="contact-form-panel"
            style={{
              flex: '1.5 1 350px', minWidth: '280px',
              backgroundColor: '#000', borderRadius: '12px', padding: 'clamp(20px, 3vw, 40px)',
            }}
          >
```

Then find the closing tag of the form panel. It ends just before `</div>` (closing the contact-grid). Find exactly:
```jsx
          </motion.div>
        </div>
      </section>

      <style>
```

Replace with:
```jsx
          </div>
          </FadeReveal>
        </div>
      </section>

      <style>
```

- [ ] **Step 5: Replace the style block**

Find exactly:
```jsx
      <style>{`
        @media (max-width: 809px) {
          .page-right-nav { display: none !important; }
          .nav-contact, .nav-info { display: none !important; }
          .contact-grid { flex-direction: column !important; }
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
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
```

Replace with:
```jsx
      <style>{`
        .contact-headline-wrap p {
          font-size: inherit !important;
          font-weight: inherit !important;
          letter-spacing: inherit !important;
          line-height: inherit !important;
          color: inherit !important;
          font-family: "Geist", sans-serif !important;
        }
        @media (max-width: 809px) {
          .page-right-nav { display: none !important; }
          .nav-contact, .nav-info { display: none !important; }
          .contact-grid { flex-direction: column !important; }
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
          .contact-headline-wrap {
            font-size: clamp(32px, 10vw, 64px) !important;
          }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
```

- [ ] **Step 6: Verify build passes**

```bash
cd "C:/Users/91809/OneDrive/Desktop/AI_Projects/portfolio" && npm run build
```
Expected: `✓ built in` with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/ContactPage.jsx
git commit -m "feat(contact): full-bleed hero, BlurText headline, FadeReveal cards"
```

---

## Task 2: Add contact_image field to AdminPanel

**Files:**
- Modify: `src/pages/AdminPanel.jsx`

- [ ] **Step 1: Add ImageUploader to Contact & Social section**

Find exactly:
```jsx
        {/* ═══ CONTACT & SOCIAL ═══ */}
        <Section title="📞 Contact & Social">
          <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
```

Replace with:
```jsx
        {/* ═══ CONTACT & SOCIAL ═══ */}
        <Section title="📞 Contact & Social">
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Contact Page Background Image</p>
          <ImageUploader
            value={settings.contact?.value?.contact_image}
            folder="contact"
            label="Contact background photo"
            onUpload={url => saveImage('contact', 'contact_image', url)}
          />
          <div style={{ marginTop: '16px' }} />
          <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
```

- [ ] **Step 2: Verify build passes**

```bash
cd "C:/Users/91809/OneDrive/Desktop/AI_Projects/portfolio" && npm run build
```
Expected: `✓ built in` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminPanel.jsx
git commit -m "feat(admin): add contact_image upload to Contact & Social section"
```

---

## Task 3: Visual Verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Check hero on page load**
  - Navigate to `http://localhost:5173/contact`
  - Hero fills full viewport height with dark gradient (or image if uploaded)
  - "GET IN TOUCH" blurs in word-by-word on page load immediately
  - Tagline fades up ~0.5s after load
  - Bouncing chevron arrow visible below tagline

- [ ] **Step 3: Check card animations on scroll**
  - Scroll down — info card and form card should slide up from below (FadeReveal y=40)
  - No x-direction slide (old x:-40 / x:40 animations are gone)
  - Form fields still stagger in as you scroll into them

- [ ] **Step 4: Check AdminPanel**
  - Navigate to `http://localhost:5173/admin` (password: `shravan2025`)
  - Open "Contact & Social" section
  - Image uploader appears at top above the email/phone fields

- [ ] **Step 5: Image upload round-trip**
  - Upload a photo in the Contact section
  - Navigate to `/contact` — hero shows the image
