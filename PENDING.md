# Pending Improvements — Shravan Portfolio
# Last updated: 2026-03-26

---

## 🔴 Priority 1 — High Impact

### 1. Project Detail Page — Hero Video Autoplay
- Each project has a `video_url` field that's uploaded but never shown at the top of the detail page
- Add a full-bleed autoplay muted video as the hero of each project detail page
- Fall back to `cover_image` if no video uploaded
- **File:** `src/pages/ProjectDetailPage.jsx`

### 2. MyShots — Lightbox on Click
- Currently clicking a shot does nothing
- Add a full-screen lightbox overlay with prev/next navigation and close button
- Should work for both images and videos
- **File:** `src/components/MyShots.jsx`

### 3. Image Lazy Loading + Supabase Size Transforms
- All images load at full resolution regardless of display size
- Add `loading="lazy"` to all `<img>` tags across the site
- Use Supabase image transform params (`?width=800&quality=80`) on all Supabase-hosted images
- **Files:** `src/components/Portfolio.jsx`, `src/components/MyShots.jsx`, `src/pages/ProjectDetailPage.jsx`

### 4. Contact Form — Email Notification on Submit
- Messages are saved to Supabase but no alert is sent to Shravan
- Create a Supabase Edge Function triggered on `contact_messages` INSERT
- Send email via Resend or SendGrid with the message details
- **New file:** `supabase/functions/notify-contact/index.ts`

### 5. JS Bundle Code Splitting
- Current bundle is 786KB (from build output) — too large for mobile
- Lazy-load all page components in `App.jsx` using `React.lazy()` + `Suspense`
- Target: reduce initial load to ~200KB
- **File:** `src/App.jsx`

---

## 🟡 Priority 2 — Polish & Animation

### 6. Footer Stats — Count-Up Animation
- `projects`, `satisfaction`, `hours` stats in Footer appear as static numbers
- Add animated count-up when stats scroll into view
- **File:** `src/components/Footer.jsx`

### 7. Loading Skeleton / Shimmer
- Sections pop in empty then fill with data from Supabase
- Add shimmer skeleton placeholders for project cards and shots grid
- **Files:** `src/components/Portfolio.jsx`, `src/components/MyShots.jsx`

### 8. Page Transition on Browser Back Button
- The 5-block curtain only plays on in-app navigation
- Wire it to browser back/forward so experience is consistent
- **File:** `src/App.jsx`

### 9. Mobile Tap Ripple Effect
- Custom cursor is desktop-only (correct), but mobile has no equivalent premium feel
- Add a subtle tap ripple on touch events
- **File:** `src/components/CustomCursor.jsx` or new component

---

## 🟢 Priority 3 — SEO & Discoverability

### 10. Meta Tags + Open Graph Images
- No `<title>`, `<meta description>`, or OG tags anywhere
- Links shared on WhatsApp/Instagram show nothing
- Add per-page meta tags, especially for project detail pages using cover image as OG image
- **Files:** All page components + `index.html`

### 11. Sitemap + robots.txt
- Not generated — Google can't index efficiently
- Add `public/robots.txt` and auto-generate sitemap from projects
- **New files:** `public/robots.txt`, `public/sitemap.xml` (or dynamic generation)

---

## 🔵 Priority 4 — Admin / CMS

### 12. Drag-to-Reorder Projects
- Sort order requires manually editing numbers in each project
- Add drag-and-drop reordering in the Projects section of AdminPanel
- **File:** `src/pages/AdminPanel.jsx`

### 13. Contact Messages — Read/Unread Status
- All messages look the same, no way to track what's been read
- Add `is_read` boolean to `contact_messages` table
- Show unread count badge in admin header stats bar
- Mark as read on click/open
- **Files:** `src/pages/AdminPanel.jsx` + Supabase SQL

---

## ✅ Completed (for reference)
- Visual comparison polish against Framer template
- AboutPage animations (BlurText, FadeReveal, Framer Motion springs)
- ContactPage animations
- Mobile responsiveness (all pages, ≤809px)
- Homepage project picker (show_on_homepage toggle per project)
- Cover aspect ratio per project
- Gallery video + image aspect ratio (portrait + landscape options)
- Hero bottom bar / tagline / award visibility toggles
- Full security hardening (RLS, Supabase Auth, headers, embed URL whitelist)
- MyShots performance fix (shared scrollY, removed backdropFilter, reduced blur)
- Vercel deploy config (SPA rewrite, security headers, stable Vite)
