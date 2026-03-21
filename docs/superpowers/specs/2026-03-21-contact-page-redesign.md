# Contact Page Redesign — Design Spec
Date: 2026-03-21

## Overview
Replace ContactPage's warm gradient hero with a 100vh full-bleed image hero matching the cinematic dark style of the About and Home pages. Polish card entrance animations using FadeReveal. Add `contact_image` admin field. No layout changes to the info/form cards.

---

## Page Structure

```
Navbar (existing 3-column inline — keep unchanged)
↓
Hero — 100vh, full-bleed background photo + dark overlay
  • "GET IN TOUCH" — BlurText word-by-word reveal
  • Tagline — "Let's create something timeless together."
  • Scroll indicator — bouncing arrow
↓
Contact section — existing 2-card grid on #f5f5f5
  • Info card — FadeReveal y=40 delay=0.1
  • Form card — FadeReveal y=40 delay=0.25
  • Form fields — existing stagger kept as-is
```

**Removed:** old `<section>` hero (gradient #e8d8d0, motion.p tagline, motion.h1 headline). Replaced entirely.

---

## Hero Section Detail

**Authorized patch scope:** replace the existing hero `<section>` block only. Navbar and contact form section are untouched.

- `position: relative`, `height: 100vh`, `overflow: hidden`, `backgroundColor: #000`
- Background image: `{contact?.contact_image ? <img .../> : <div gradient fallback/>}`
  - Image: `position: absolute`, `inset: 0`, `objectFit: cover`, `width/height: 100%`
  - Fallback: `background: linear-gradient(135deg, #1a1a1a, #000)`
  - Wrap in `<motion.div initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>`
- Dark overlay: `position: absolute`, `inset: 0`, `backgroundColor: rgba(0,0,0,0.5)`, `zIndex: 1`
- Content div: `position: absolute`, `inset: 0`, `zIndex: 2`, `display: flex`, `flexDirection: column`, `justifyContent: flex-end`, `padding: clamp(24px, 6vw, 80px)`
- Headline: parent wrapper `<div className="contact-headline-wrap">` with `fontSize: clamp(48px, 11vw, 148px)`, `fontWeight: 700`, `letterSpacing: -0.04em`, `color: #fff`, `lineHeight: 1`, `marginBottom: 16px`
  - `<BlurText text="GET IN TOUCH" delay={100} animateBy="words" direction="bottom" />`
- Tagline: `<motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.5 }}>` — "Let's create something timeless together.", `fontSize: clamp(16px, 2vw, 22px)`, `color: rgba(255,255,255,0.7)`, `margin: 0 0 32px`
- Scroll indicator: `<motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>` containing a downward chevron SVG, `color: rgba(255,255,255,0.4)`, `width: 24px`

**Mobile (≤ 809px):**
- Headline font: `clamp(32px, 10vw, 64px)` via `.contact-headline-wrap` mobile media query
- Content padding: `24px`

---

## Contact Cards Section

No structural changes. Replace existing `motion.div` entrance animations on both cards with `FadeReveal`:

- Info card: change `<motion.div className="contact-info-panel" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={...}>` → `<FadeReveal y={40} delay={0.1}><div className="contact-info-panel" style={...}>` (inner element demoted from `motion.div` to plain `div`, all style props kept)
- Form card: change `<motion.div className="contact-form-panel" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={...}>` → `<FadeReveal y={40} delay={0.25}><div className="contact-form-panel" style={...}>` (same demotion)
- **Critical:** the inner panels MUST be demoted to plain `div` — if they remain `motion.div` with their own `initial/animate` props, both animations fire simultaneously and conflict
- Form field `motion.div` elements with `whileInView` keep their existing animations untouched

---

## Admin Changes (AdminPanel.jsx — Contact section)

Find the existing Contact section (has email, phone fields). Add above the existing inputs:

```jsx
<p style={{ ...label style }}>Contact Page Background Image</p>
<ImageUploader
  value={settings.contact?.value?.contact_image}
  folder="contact"
  label="Contact background photo"
  onUpload={url => saveImage('contact', 'contact_image', url)}
/>
```

`saveImage('contact', 'contact_image', url)` calls `directSaveField` internally — auto-saves, no button needed.

---

## Data Shape

`site_settings` row `key = 'contact'` value JSONB — add new field:
```json
{
  "email": "...",
  "phone": "...",
  "contact_image": "https://supabase-storage-url/..."
}
```

`ContactPage.jsx` already queries `key = 'contact'` — just read `contact?.contact_image` off the existing state.

---

## Animation Specs

| Element | Animation | Config |
|---|---|---|
| Hero BG | scale 1.05→1 | spring stiffness 60, damping 14 |
| "GET IN TOUCH" | BlurText words | delay={100} ms, animateBy="words" |
| Tagline | motion.p animate y:20→0 | delay 0.5s |
| Scroll arrow | motion.div animate y:[0,8,0] | repeat Infinity, duration 1.4s |
| Info card | FadeReveal y=40 | delay 0.1s |
| Form card | FadeReveal y=40 | delay 0.25s |

---

## Imports to Add

```jsx
import { motion } from 'framer-motion'  // already imported
import BlurText from '../components/reactbits/BlurText'
import FadeReveal from '../components/reactbits/FadeReveal'
```

`motion` is already imported in ContactPage.jsx.

---

## Style Block

Replace existing `<style>` block with:
```css
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
  .contact-info-panel { min-width: 0 !important; width: 100% !important; flex: 1 1 100% !important; }
  .contact-form-panel { min-width: 0 !important; width: 100% !important; flex: 1 1 100% !important; }
  .contact-headline-wrap { font-size: clamp(32px, 10vw, 64px) !important; }
}
input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
```

---

## Constraints

- Patch only — hero section replacement is authorized scope
- Navbar unchanged
- Form and its field animations unchanged
- Images → Supabase Storage only
- `contact_image` always guarded with gradient fallback
- Design tokens: `#ff4d00`, `#f5f5f5`, `#000`, font `Geist`
