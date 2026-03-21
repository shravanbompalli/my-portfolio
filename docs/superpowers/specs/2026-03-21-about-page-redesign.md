# About Page Redesign — Design Spec
Date: 2026-03-21

## Overview
Redesign `AboutPage.jsx` with a full-bleed hero image, existing char-reveal bio, a new "Tools & Gear" section, and corresponding AdminPanel fields. Remove the `<Services />` component from the about page entirely.

---

## Page Structure

```
Inline page navbar (existing 3-column in AboutPage.jsx — keep as-is)
↓
Hero — 100vh, full-bleed background photo + dark overlay
  • "ABOUT ME" headline — BlurText word-by-word reveal
  • Tagline — FadeReveal
  • "Capture Your Story" CTA button
↓
AboutText — existing char-reveal bio component (zero changes)
↓
Tools & Gear — light (#f5f5f5) section
  • Section label "TOOLS & GEAR"
  • Pill badges, FadeReveal stagger
↓
Footer (existing)
```

**Removed:** `<Services />` — not rendered on this page.

**Navbar clarification:** `AboutPage.jsx` renders its own inline 3-column navbar (contact | logo | title/location). This is NOT the global `<Navbar>` from `App.jsx`. Keep the existing inline navbar unchanged.

---

## Hero Section Detail

**Authorized scope:** This replaces the current hero section (lines ~65–136 in `AboutPage.jsx`). The old "ABOUT [inline-image] ME" layout and mobile image block are fully replaced. This is the explicitly authorized patch scope — not a full file rewrite.

- `position: relative`, `height: 100vh`, `overflow: hidden`, `backgroundColor: #000`
- Background: `{about?.about_image && <img src={about.about_image} ... />}` — guard against undefined/null. If no image, show a dark gradient fallback div.
- Image styles: `position: absolute`, `inset: 0`, `width: 100%`, `height: 100%`, `objectFit: cover`, load with `scale(1.05)` → `scale(1)` spring (`stiffness: 60, damping: 14`)
- Dark overlay: `position: absolute`, `inset: 0`, `backgroundColor: rgba(0,0,0,0.45)`, `zIndex: 1`
- Content: `position: absolute`, `inset: 0`, `zIndex: 2`, `display: flex`, `flexDirection: column`, `justifyContent: flex-end`, `padding: clamp(40px,6vw,80px)`
- Headline: `BlurText` component with `delay={100}` (milliseconds). Font size applied via a parent wrapper `<div style={{ fontSize: 'clamp(48px,11vw,148px)', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff' }}>` — BlurText renders a `<p>` internally using Tailwind flex, so heading styles must be on the parent wrapper, not passed as inline style to `BlurText` directly.
- Tagline: `<FadeReveal y={20} delay={0.5}>` — explicitly `y={20}` to get 20px upward travel (FadeReveal default is y=40). Text: "The person behind the lens", `fontSize: clamp(16px,2vw,22px)`, `color: rgba(255,255,255,0.7)`, `marginBottom: 24px`
- CTA: Framer Motion `<motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>` wrapping a `<Link>`. Black pill → `#ff4d00` background on hover (existing pattern from current AboutPage).

**Mobile (≤ 809px):**
- Headline font: `clamp(32px, 10vw, 64px)`
- Content padding reduced: `24px`
- Tagline and CTA stack vertically (already column layout, no change needed)
- Text-align stays left

---

## Tools & Gear Section Detail

- Background: `#f5f5f5`, `padding: clamp(60px,8vw,100px) clamp(18px,4vw,40px)`, `maxWidth: 1400px margin: 0 auto`
- Section label: `fontSize: 12px`, `letterSpacing: 0.15em`, `textTransform: uppercase`, `color: #aaa`, `marginBottom: 32px`, font Geist
- Pills container: `display: flex`, `flexWrap: wrap`, `gap: 12px`
- Each pill: `padding: 10px 20px`, `borderRadius: 40px`, `border: 1px solid rgba(0,0,0,0.12)`, `backgroundColor: #fff`, `fontFamily: Geist`, `fontSize: 15px`, `color: #000`
- Each pill wrapped in `<FadeReveal delay={index * 0.05}>` for stagger
- **Guard:** if `!tools || tools.length === 0`, section returns `null` entirely

---

## Admin Changes (AdminPanel.jsx — About Bio section)

### Pattern note
The existing About bio uses `saveSetting` (button-triggered). New fields use `directSaveField` (auto-save on change). Both patterns coexist in the same section — this is intentional, matching the existing mixed pattern in the codebase.

`directSaveField` full signature: `directSaveField(key, field, val, setSettings, showToast)`
Both `setSettings` and `showToast` are required arguments — pass them exactly as other calls in AdminPanel do.

### New field 1: About Page Image
```jsx
<ImageUpload
  label="About Page Background Image"
  value={settings.about?.value?.about_image}
  onUpload={url => directSaveField('about', 'about_image', url, setSettings, showToast)}
/>
```

### New field 2: Tools List
- Local state: `const [newTool, setNewTool] = useState('')`
- Input + "Add" button: on click, build new array `[...(settings.about?.value?.tools || []), newTool.trim()]`, call `directSaveField('about', 'tools', newArray, setSettings, showToast)`, clear input
- Display existing tools as removable tags: map over `settings.about?.value?.tools || []`, each with an × button that calls `directSaveField('about', 'tools', filteredArray, setSettings, showToast)`
- Guard: only show tags if `settings.about?.value?.tools?.length > 0`

---

## Data Shape

`site_settings` row with `key = 'about'` value JSONB:
```json
{
  "bio": "...",
  "about_image": "https://supabase-storage-url/...",
  "tools": ["DaVinci Resolve", "Adobe Premiere", "Lightroom", "After Effects", "Blackmagic Camera"]
}
```

---

## Animation Specs

| Element | Animation | Config |
|---|---|---|
| Hero BG image | scale 1.05→1 on load | spring stiffness 60, damping 14 |
| "ABOUT ME" | `BlurText` word-by-word | `delay={100}` (ms), `animateBy="words"` |
| Tagline | `FadeReveal y={20}` | `delay={0.5}` |
| CTA button | `whileHover={{ scale: 1.04 }}` | default spring |
| Tool pills | `FadeReveal` stagger | `delay={index * 0.05}` |

---

## Constraints

- Patch only. The hero section replacement (old lines ~65–136) is the authorized full-replace scope.
- `AboutText` component is completely unchanged
- Design tokens: accent `#ff4d00`, bg `#f5f5f5`, dark `#000`, font `Geist`
- Images → Supabase Storage only
- `about_image` always guarded: `{about?.about_image && <img ... />}` with gradient fallback
- Tools section always guarded: returns null if no tools
