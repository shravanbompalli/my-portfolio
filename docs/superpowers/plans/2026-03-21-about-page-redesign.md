# About Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AboutPage's existing hero with a full-bleed image hero, add a Tools & Gear section, remove Services, and add admin fields for the background image and tools list.

**Architecture:** Patch `AboutPage.jsx` in two atomic tasks (Task 1 does the full hero replacement + import swap + Services removal all together so no intermediate broken state). Then patch `AdminPanel.jsx` to add `about_image` and `tools` fields to the existing About Bio section using the established `saveImage` + tools-array pattern.

**Tech Stack:** React 18, Framer Motion, Supabase, React Bits (BlurText, FadeReveal already in `src/components/reactbits/`)

**Spec:** `docs/superpowers/specs/2026-03-21-about-page-redesign.md`

---

## File Map

| File | Change |
|---|---|
| `src/pages/AboutPage.jsx` | Swap imports, add `about` state + query, replace hero section, add ToolsSection component, replace Sections block, replace `<style>` block — all in Task 1 |
| `src/pages/AdminPanel.jsx` | Add `newTool` state, replace About Bio section with image uploader + tools list |

---

## Task 1: Restructure AboutPage.jsx (atomic — all edits before first build)

**Files:**
- Modify: `src/pages/AboutPage.jsx`

All edits in this task happen before any build or commit so there is never a broken intermediate state.

- [ ] **Step 1: Swap imports**

Find exactly:
```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import AboutText from '../components/AboutText'
import Services from '../components/Services'
import Footer from '../components/Footer'
```

Replace with:
```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import AboutText from '../components/AboutText'
import Footer from '../components/Footer'
import BlurText from '../components/reactbits/BlurText'
import FadeReveal from '../components/reactbits/FadeReveal'
```

Note: `Services` removed here and in the JSX in the same task — no broken build.

- [ ] **Step 2: Add `about` state variable**

Find exactly:
```jsx
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
```

Replace with:
```jsx
  const [brand, setBrand] = useState(null)
  const [contact, setContact] = useState(null)
  const [about, setAbout] = useState(null)
```

- [ ] **Step 3: Extend Supabase query to include 'about'**

Find exactly:
```js
        .in('key', ['brand', 'contact'])
```

Replace with:
```js
        .in('key', ['brand', 'contact', 'about'])
```

- [ ] **Step 4: Wire setAbout in the forEach**

Find exactly:
```js
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
```

Replace with:
```js
          if (r.key === 'brand') setBrand(r.value)
          if (r.key === 'contact') setContact(r.value)
          if (r.key === 'about') setAbout(r.value)
```

- [ ] **Step 5: Add ToolsSection component above export default**

Find exactly:
```jsx
export default function AboutPage() {
```

Insert this block immediately before that line:
```jsx
function ToolsSection({ tools }) {
  if (!tools || tools.length === 0) return null
  return (
    <section style={{
      backgroundColor: '#f5f5f5',
      padding: 'clamp(60px, 8vw, 100px) clamp(18px, 4vw, 40px)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <p style={{
          fontFamily: '"Geist", sans-serif', fontSize: '12px',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#aaa', margin: '0 0 32px',
        }}>
          Tools &amp; Gear
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {tools.map((tool, i) => (
            <FadeReveal key={tool} delay={i * 0.05}>
              <span style={{
                fontFamily: '"Geist", sans-serif', fontSize: '15px', color: '#000',
                padding: '10px 20px', borderRadius: '40px',
                border: '1px solid rgba(0,0,0,0.12)', backgroundColor: '#fff',
                display: 'inline-block',
              }}>
                {tool}
              </span>
            </FadeReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

```

- [ ] **Step 6: Replace the hero section JSX**

Find the entire old hero section — from:
```jsx
      {/* ── Hero ── */}
      <section style={{
        padding: 'clamp(60px, 10vw, 140px) clamp(16px, 4vw, 40px) clamp(40px, 5vw, 60px)',
        maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1,
      }}>
```

All the way to (and including) its closing `</section>` tag — the block ends just before `{/* ── Sections ── */}`.

Replace the entire old hero section with:
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
          {about?.about_image ? (
            <img
              src={about.about_image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #000)' }} />
          )}
        </motion.div>

        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1 }} />

        {/* Content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 'clamp(24px, 6vw, 80px)',
        }}>
          {/* ABOUT ME headline via BlurText */}
          <div className="about-headline-wrap" style={{
            fontSize: 'clamp(48px, 11vw, 148px)', fontWeight: 700,
            letterSpacing: '-0.04em', color: '#fff', lineHeight: 1, marginBottom: '16px',
          }}>
            <BlurText text="ABOUT ME" delay={100} animateBy="words" direction="bottom" />
          </div>

          {/* Tagline — uses animate (not whileInView) since it's above the fold */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.5 }}
            style={{
              fontFamily: '"Geist", sans-serif',
              fontSize: 'clamp(16px, 2vw, 22px)',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 28px', lineHeight: 1.5,
            }}
          >
            The person behind the lens.
          </motion.p>

          {/* CTA — uses animate (not whileInView) since it's above the fold */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 14, delay: 0.7 }}
            style={{ display: 'inline-block' }}
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
              <Link to="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontFamily: '"Geist", sans-serif', fontSize: '15px', fontWeight: 500,
                color: '#fff', backgroundColor: '#000', padding: '14px 28px',
                borderRadius: '40px', textDecoration: 'none',
                transition: 'background-color 0.3s',
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ff4d00'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#000'}
              >
                <span style={{ fontSize: '14px' }}>✦</span> Capture Your Story
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
```

Note: Tagline and CTA use `animate` (not `whileInView`) because they are always above the fold. `FadeReveal` (which uses `whileInView`) is only used in the Tools section below.

- [ ] **Step 7: Replace the Sections block (remove Services, add ToolsSection)**

Find exactly:
```jsx
      {/* ── Sections ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AboutText />
        <Services />
        <Footer />
      </div>
```

Replace with:
```jsx
      {/* ── Sections ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <AboutText />
        <ToolsSection tools={about?.tools} />
        <Footer />
      </div>
```

- [ ] **Step 8: Replace the `<style>` block**

Find exactly:
```jsx
      <style>{`
        .headline-mobile-image { display: none; }
        @media (max-width: 809px) {
          .page-right-nav { display: none !important; }
          .nav-contact, .nav-info { display: none !important; }
          .hero-headline { justify-content: center !important; }
          .headline-inline-image { display: none !important; }
          .headline-mobile-image {
            display: block;
            margin-top: 20px;
            margin-bottom: 8px;
          }
        }
        @media (min-width: 810px) and (max-width: 1279px) {
          .page-right-nav { right: 20px !important; }
        }
      `}</style>
```

Replace with:
```jsx
      <style>{`
        .about-headline-wrap p {
          font-size: inherit !important;
          font-weight: inherit !important;
          letter-spacing: inherit !important;
          line-height: inherit !important;
          color: inherit !important;
          font-family: "Geist", sans-serif !important;
        }
        @media (max-width: 809px) {
          .nav-contact, .nav-info { display: none !important; }
          .about-headline-wrap {
            font-size: clamp(32px, 10vw, 64px) !important;
          }
        }
        @media (min-width: 810px) and (max-width: 1279px) {
          .page-right-nav { right: 20px !important; }
        }
      `}</style>
```

Note: `.page-right-nav` tablet rule is preserved for the inline navbar layout.

- [ ] **Step 9: Verify build passes**

```bash
npm run build
```
Expected: `✓ built in` with no errors. No reference to `Services` should remain.

- [ ] **Step 10: Commit**

```bash
git add src/pages/AboutPage.jsx
git commit -m "feat(about): full-bleed hero, Tools & Gear section, remove Services"
```

---

## Task 2: Add Admin Fields — About Image and Tools List

**Files:**
- Modify: `src/pages/AdminPanel.jsx`

- [ ] **Step 1: Add `newTool` state**

Find exactly:
```jsx
  const [collabs, setCollabs] = useState([])
  const [messages, setMessages] = useState([])
```

Replace with:
```jsx
  const [collabs, setCollabs] = useState([])
  const [messages, setMessages] = useState([])
  const [newTool, setNewTool] = useState('')
```

- [ ] **Step 2: Replace the About Bio section**

Find exactly:
```jsx
        {/* ═══ ABOUT ═══ */}
        <Section title="👤 About Bio">
          <Input label="Bio (supports emojis 🎬📷✨)" value={settings.about?.value?.bio} onChange={v => updateSetting('about', 'bio', v)} multiline />
          <div style={{ marginTop: '16px' }}><Btn onClick={() => saveSetting('about', settings.about?.value)} disabled={saving} fullWidth>Save About</Btn></div>
        </Section>
```

Replace with:
```jsx
        {/* ═══ ABOUT ═══ */}
        <Section title="👤 About Bio">
          {/* Background image */}
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>About Page Background Image</p>
          <ImageUploader
            value={settings.about?.value?.about_image}
            folder="about"
            label="About background photo"
            onUpload={url => saveImage('about', 'about_image', url)}
          />

          {/* Bio */}
          <div style={{ marginTop: '20px' }}>
            <Input label="Bio (supports emojis 🎬📷✨)" value={settings.about?.value?.bio} onChange={v => updateSetting('about', 'bio', v)} multiline />
            <div style={{ marginTop: '12px' }}><Btn onClick={() => saveSetting('about', settings.about?.value)} disabled={saving} fullWidth>Save Bio</Btn></div>
          </div>

          {/* Tools list */}
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: gray, margin: '0 0 12px' }}>Tools &amp; Gear</p>

            {(settings.about?.value?.tools || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {(settings.about?.value?.tools || []).map(tool => (
                  <span key={tool} style={{
                    fontFamily: '"Geist",sans-serif', fontSize: '13px', color: white,
                    backgroundColor: '#222', border: `1px solid ${border}`,
                    padding: '6px 14px', borderRadius: '40px',
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                  }}>
                    {tool}
                    <button
                      onClick={() => {
                        const filtered = (settings.about?.value?.tools || []).filter(t => t !== tool)
                        directSaveField('about', 'tools', filtered, setSettings, showToast)
                      }}
                      style={{ background: 'none', border: 'none', color: gray, cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1 }}
                    >×</button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={newTool}
                onChange={e => setNewTool(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTool.trim()) {
                    const updated = [...(settings.about?.value?.tools || []), newTool.trim()]
                    directSaveField('about', 'tools', updated, setSettings, showToast)
                    setNewTool('')
                  }
                }}
                placeholder="e.g. DaVinci Resolve"
                style={{
                  flex: 1, fontFamily: '"Geist",sans-serif', fontSize: '14px', color: white,
                  backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '8px',
                  padding: '10px 14px', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = border}
              />
              <Btn onClick={() => {
                if (!newTool.trim()) return
                const updated = [...(settings.about?.value?.tools || []), newTool.trim()]
                directSaveField('about', 'tools', updated, setSettings, showToast)
                setNewTool('')
              }}>Add</Btn>
            </div>
          </div>
        </Section>
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```
Expected: `✓ built in` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminPanel.jsx
git commit -m "feat(admin): add about_image upload and tools list editor"
```

---

## Task 3: Visual Verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Check hero on page load (not scroll)**
  - Navigate to `http://localhost:5173/about`
  - Hero fills full viewport height with dark background (or image if uploaded)
  - "ABOUT ME" text blurs in word-by-word **immediately on page load** (not on scroll)
  - Tagline fades up ~0.5s after page load
  - CTA fades up ~0.7s after page load, turns orange on hover

- [ ] **Step 3: Check Tools section**
  - Scroll below the bio text
  - If no tools in DB → Tools section not visible at all
  - After adding tools via admin → pills appear with staggered fade-in on scroll

- [ ] **Step 4: Confirm Services is gone**
  - Scroll entire page — Services accordion must not appear anywhere

- [ ] **Step 5: Check AdminPanel About Bio section**
  - Navigate to `http://localhost:5173/admin` (password: `shravan2025`)
  - Open "About Bio" section
  - See: image uploader at top, bio textarea + Save Bio button, tools tag list + add input below

- [ ] **Step 6: Tools round-trip test**
  - Type "DaVinci Resolve" in the tools input, press Enter
  - Toast appears: "tools uploaded & saved!"
  - Navigate to `/about`, scroll to Tools section — pill appears
  - Return to admin, click × on the tag — it disappears and saves immediately

- [ ] **Step 7: Image upload test**
  - Click the image uploader in About section, upload any photo
  - Toast confirms upload
  - Navigate to `/about` — hero shows the uploaded image
