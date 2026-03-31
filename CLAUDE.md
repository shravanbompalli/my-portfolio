# portfolio-website — CLAUDE.md
# Project: Shravan Bompalli Portfolio
# Stack: Vite + React 18 + Tailwind CSS v3 + Framer Motion + Supabase + Cloudinary
# Reference template: https://simplest-breakfast-965445.framer.app/
# Last updated: 2026-03-26

---

## ⚡ CRITICAL — Read Before Touching Any File

1. **Never rewrite entire component files.** Read the file fully, change only the specific lines needed.
2. **Parallax = rAF + refs only.** Never useState on scroll — it causes re-renders that fight CSS transitions.
3. **Images → Supabase. Videos → Cloudinary.** Never mix.
4. **The Framer template is the single source of truth** for any visual/layout question.
5. **Animations must be dramatically visible.** Bold, slow, pronounced spring overshoot. Never subtle.
6. **Admin saves images immediately** via `directSaveField()` — no save button needed for uploads.
7. **RLS is ENABLED** on all Supabase tables. Admin writes require an authenticated Supabase session.
8. **Admin auth uses Supabase Auth** — `supabase.auth.signInWithPassword()`. Email comes from `VITE_ADMIN_EMAIL` env var. No hardcoded passwords anywhere.
9. **MyShots parallax uses a single shared `scrollY`** from `useScroll()` in `ShotsSection` — never add per-card `useScroll` back (causes lag).
10. **Never add `backdropFilter: blur()` inside MyShots cards** — too many compositor layers, causes GPU lag.

---

## 🗂️ Project Structure

```
portfolio-website/
├── src/
│   ├── pages/
│   │   ├── Home.jsx              ← Landing page (Hero + all scroll sections)
│   │   ├── AboutPage.jsx         ← About page ✅ animations done
│   │   ├── PortfolioPage.jsx     ← Full projects grid
│   │   ├── ProjectDetailPage.jsx ← Individual project detail
│   │   ├── MyShotsPage.jsx       ← Gallery masonry
│   │   ├── ContactPage.jsx       ← Contact form ✅ animations done
│   │   └── AdminPanel.jsx        ← Full CMS (/admin — uses Supabase Auth)
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx            ← Dark CTA, nav columns, stats
│   │   ├── Services.jsx          ← Numbered accordion, image on expand
│   │   ├── Portfolio.jsx         ← 2-col masonry cards, homepageOnly prop
│   │   ├── TestimonialHighlight.jsx ← Spring animations, quote + 2 images
│   │   ├── AboutText.jsx         ← Char-by-char scroll color reveal
│   │   ├── Collaborations.jsx    ← Logo grid with green badges
│   │   ├── MyShots.jsx           ← Masonry gallery, MagneticCard + parallax
│   │   ├── LoadingAnimation.jsx  ← 5 black blocks, 0→100% counter
│   │   └── CustomCursor.jsx      ← Camera aperture dot, trail particles
│   ├── lib/
│   │   └── supabase.js           ← Supabase client (persistSession: true)
│   ├── App.jsx                   ← Routes + 5-block curtain page transitions
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── vercel.json                   ← Security headers (X-Frame-Options, CSP, etc.)
├── .env                          ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_EMAIL
├── CLAUDE.md                     ← this file
└── package.json
```

---

## ⚙️ Common Commands

```bash
npm run dev       # dev server → localhost:5173 (Vite default)
npm run build     # production build → /dist
npm run preview   # preview production build locally
npm run lint      # ESLint check
```

---

## 🛣️ Routes

| Route | Component | Status |
|-------|-----------|--------|
| `/` | Home.jsx | ✅ Built |
| `/portfolio` | PortfolioPage.jsx | ✅ Built |
| `/portfolio/:slug` | ProjectDetailPage.jsx | ✅ Built |
| `/about` | AboutPage.jsx | ✅ Built |
| `/my-shots` | MyShotsPage.jsx | ✅ Built |
| `/contact` | ContactPage.jsx | ✅ Built |
| `/admin` | AdminPanel.jsx | ✅ Built |

---

## 🎨 Design Tokens — Never Deviate

```
Accent:     #ff4d00
Background: #f5f5f5
Dark:       #000000
Grays:      #aaa, #606060, #404040, #eee, #ddd, #ccc
Green:      #00c200
Font:       "Geist", sans-serif
Mono:       "Geist Mono", monospace
```

### Breakpoints
```
Desktop: ≥ 1280px
Tablet:  810px – 1279px
Phone:   ≤ 809px
```

---

## 🎬 Animation Rules

### Parallax (Home.jsx Hero)
- Uses `requestAnimationFrame` + direct DOM refs — **never useState**
- Content: `scrollY * -0.15`, BG: `scrollY * 0.3`
- BG transition set to `none` after initial scale animation completes

### MyShots Parallax
- Single `const { scrollY } = useScroll()` in `ShotsSection`
- Passed as prop to each `ParallaxImage`
- Each `ParallaxImage` uses `useLayoutEffect` to compute its own `inputRange` from its DOM position
- Entry blur capped at `blur(3px)` max — never go higher (GPU cost)

### Springs (Framer Motion)
- Testimonial quote: `stiffness: 70, damping: 10, mass: 0.7`
- Images: `stiffness: 40, damping: 10, mass: 2`
- General scroll reveals: `opacity 0→1, translateY 20-60px→0`, stagger `0.06-0.1s`

### Page Transitions (App.jsx)
- 5 blocks rise from bottom (stagger 100/200ms center-out)
- Block animation 0.8s each, 300ms hold while covered
- Then collapse from top

### Style Rule
**MORE dramatic, MORE visible. Bold effects, slow timing, pronounced spring overshoot. Never subtle.**

---

## 🗄️ Database (Supabase)

### RLS Status — ENABLED ✅
All tables have RLS enabled with these policies:
- **Public read**: `site_settings`, `services`, `projects`, `reviews`, `faqs`, `my_shots`, `collaborations` — anyone can SELECT
- **Admin write**: all above tables — only authenticated users can INSERT/UPDATE/DELETE
- **contact_messages**: anon INSERT allowed, only authenticated can SELECT/DELETE

### Storage
- Bucket name: `images`
- Bucket must be set to **Public** in Supabase dashboard (images served via CDN, no auth needed for reads)
- Authenticated uploads work automatically once admin is logged in

### site_settings (key-value JSONB)
- `hero`: headline, tagline, subtext, bg_image, recent_work_image, hero_video, hero_mode ("image"/"video"), text_color, show_tagline, show_bottom_bar, show_award
- `brand`: name, title, location, instagram
- `contact`: email, phone, contact_image
- `social`: instagram, youtube
- `awards`: name, years, count, label
- `about`: bio
- `testimonial`: quote, name, role, reviewer_image, image_1, image_2
- `stats`: projects, satisfaction, hours
- `portfolio`: portfolio_image
- `animations`: heading (blur/gradient/fuzzy/fade/none)

### projects table (extra columns added)
- `show_on_homepage` boolean DEFAULT false — controls homepage Portfolio section
- `cover_aspect_ratio` text DEFAULT 'auto' — controls card aspect ratio in grid (e.g. '4/5', '16/9')

### Other tables
`services` · `projects` · `reviews` · `faqs` · `my_shots` (media_type, video_url) · `collaborations` · `contact_messages`

### Media Rules
- **Images → Supabase Storage** (bucket: `images`, with compression)
- **Videos → Cloudinary** (cloud: `dj7us5uhy`, preset: `portfolio_uploads`)
- Admin uses `directSaveField()` — images auto-save on upload, no button needed

---

## 🔐 Authentication & Security

### Admin Login
- Route: `/admin`
- Uses `supabase.auth.signInWithPassword({ email: VITE_ADMIN_EMAIL, password: enteredPassword })`
- Session persists across refreshes (`persistSession: true` in supabase.js)
- Logout calls `supabase.auth.signOut()`
- To reset admin password: Supabase Dashboard → Authentication → Users

### Environment Variables (required in .env AND Vercel)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_EMAIL=...        ← email of the admin user created in Supabase Auth
```

### Security Headers
- Configured in `vercel.json` — X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy, Permissions-Policy

### Contact Form
- Validates email with regex, trims + limits name (100 chars), email (200 chars), message (2000 chars)
- No raw errors exposed to console or user

### Embed URLs (ProjectDetailPage)
- Whitelisted to `youtube.com`, `youtu.be`, `vimeo.com` only
- Validated with `new URL()` hostname check before rendering iframe

---

## 🧩 Admin Panel Features

| Feature | Where |
|---------|-------|
| Hero visibility toggles | Hero & Brand section — show_tagline, show_bottom_bar, show_award |
| Homepage project picker | Portfolio section — "Show on Homepage" toggle per project (auto-saves) |
| Cover aspect ratio | Portfolio section — per-project dropdown below cover image |
| Video/Image hero mode | Hero & Brand section — toggle switch |
| Headline color | Hero & Brand section — white/orange/gold/gradient swatches |
| All media uploads | Auto-save via directSaveField() |

---

## 🧩 React Bits Components (installed)

Located in `src/components/reactbits/`:
- `BlurText.jsx` — word-by-word blur reveal (used in AboutPage, ContactPage headings)
- `FadeReveal.jsx` — fade + translateY on scroll (used in ContactPage panels)
- `GradientText.jsx` — animated gradient text (used in Hero headline option)
- `FuzzyText.jsx` — fuzzy hover effect (used in ProjectDetailPage heading option)

Install new ones via:
```bash
npx shadcn@latest add @react-bits/ComponentName-JS-TW
```
Always use **JS + Tailwind** variant. Must match design tokens.

---

## 🔧 What Still Needs Work

**Immediate (pre-launch):**
1. Upload ~38 images via `/admin` — hero BG, services ×6, portfolio covers, testimonial portraits
2. Deploy to Vercel — GitHub repo + set env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_EMAIL)

**Post-launch improvements → see `PENDING.md` for full list with file references.**
Top items: project hero video, MyShots lightbox, image lazy loading, contact email notification, JS code splitting.

---

## ⛔ Hard Stops Specific to This Project

1. Never rewrite an entire component file — patch only
2. Never add BentoCards, Reviews carousel, or FAQs back (intentionally removed)
3. Never do mobile responsiveness at the same time as animation work
4. Never mix image/video storage (images=Supabase, videos=Cloudinary)
5. Never deploy without RLS enabled — it already is, don't disable it
6. Never add `backdropFilter: blur()` inside MyShots card children — kills GPU performance
7. Never add per-card `useScroll()` in MyShots — use the shared one from ShotsSection
8. Never hardcode passwords — admin auth must go through Supabase Auth

---

## 🪝 Project-Specific Hooks

| Event | Trigger | Action |
|-------|---------|--------|
| PostToolUse | Edit `.jsx` | Run Prettier |
| PostToolUse | Edit `.jsx` | Check for useState in scroll handlers (warn if found) |
| Stop | End of session | Check modified components against Framer template visually |

---

## 💡 Working Style

- Always read the file fully before making changes
- Give targeted patches (find X → replace with Y)
- Test one thing at a time — easy to revert
- Reference `https://simplest-breakfast-965445.framer.app/` for any visual question
- Treat this like a high-end cinematic website, not a generic portfolio
- When diagnosing performance issues — identify root cause first, confirm with user before fixing
