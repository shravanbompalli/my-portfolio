# portfolio-website — CLAUDE.md
# Project: Shravan Bompalli Portfolio
# Stack: Vite + React 18 + Tailwind CSS v3 + Framer Motion + Supabase + Cloudinary
# Reference template: https://simplest-breakfast-965445.framer.app/

---

## ⚡ CRITICAL — Read Before Touching Any File

1. **Never rewrite entire component files.** Read the file fully, change only the specific lines needed.
2. **Parallax = rAF + refs only.** Never useState on scroll — it causes re-renders that fight CSS transitions.
3. **Images → Supabase. Videos → Cloudinary.** Never mix.
4. **The Framer template is the single source of truth** for any visual/layout question.
5. **Animations must be dramatically visible.** Bold, slow, pronounced spring overshoot. Never subtle.
6. **Admin saves images immediately** via `directSaveField()` — no save button needed for uploads.
7. **RLS is disabled** on all Supabase tables. Must re-enable before production.

---

## 🗂️ Project Structure

```
portfolio-website/
├── src/
│   ├── pages/
│   │   ├── Home.jsx              ← Landing page (Hero + all scroll sections)
│   │   ├── AboutPage.jsx         ← About page (needs animation polish)
│   │   ├── PortfolioPage.jsx     ← Full projects grid
│   │   ├── ProjectDetailPage.jsx ← Individual project detail
│   │   ├── MyShotsPage.jsx       ← Gallery masonry
│   │   ├── ContactPage.jsx       ← Contact form (needs animation polish)
│   │   └── AdminPanel.jsx        ← Full CMS (/admin, password: shravan2025)
│   ├── components/
│   │   ├── Hero.jsx              ← Video/image toggle, parallax, grid lines
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx            ← Dark CTA, nav columns, stats
│   │   ├── Services.jsx          ← Numbered accordion, image on expand
│   │   ├── Portfolio.jsx         ← 2-col cards, gradient masks
│   │   ├── TestimonialHighlight.jsx ← Spring animations, quote + 2 images
│   │   ├── AboutText.jsx         ← Char-by-char scroll color reveal
│   │   ├── Collaborations.jsx    ← Logo grid with green badges
│   │   ├── MyShots.jsx           ← Gallery component
│   │   ├── LoadingAnimation.jsx  ← 5 black blocks, 0→100% counter
│   │   └── CustomCursor.jsx      ← Camera aperture dot, trail particles
│   ├── App.jsx                   ← Routes + 5-block curtain page transitions
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── agents/
├── commands/
├── plugins/
├── skills/
├── .env                          ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
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
| `/about` | AboutPage.jsx | 🔧 Needs animation polish |
| `/my-shots` | MyShotsPage.jsx | ✅ Built |
| `/contact` | ContactPage.jsx | 🔧 Needs animation polish |
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

### Parallax (Hero.jsx)
- Uses `requestAnimationFrame` + direct DOM refs — **never useState**
- Content: `scrollY * -0.15`, BG: `scrollY * 0.3`
- BG transition set to `none` after initial scale animation completes

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

### site_settings (key-value JSONB)
- `hero`: headline, tagline, subtext, bg_image, recent_work_image, hero_video, hero_mode ("image"/"video")
- `brand`: name, title, location, instagram
- `contact`: email, phone
- `social`: instagram, youtube
- `awards`: name, years, count, label
- `about`: bio
- `testimonial`: quote, name, role, reviewer_image, image_1, image_2
- `stats`: projects, satisfaction, hours

### Other tables
`services` · `projects` (slug, gallery_images JSONB, video_url) · `reviews` · `faqs` · `my_shots` (media_type, video_url) · `collaborations` · `contact_messages`

### Media Rules
- **Images → Supabase Storage** (with compression)
- **Videos → Cloudinary** (cloud: `dj7us5uhy`, preset: `portfolio_uploads`)
- Admin uses `directSaveField()` — images auto-save on upload, no button needed

---

## 🧩 React Bits Library

Use components from `https://reactbits.dev/` for unpolished sections.
Always use **JS + Tailwind** variant.

### Best candidates
- `AboutPage.jsx` — BlurText, SplitText for headings
- `ContactPage.jsx` — FadeContent, ScrollReveal
- Section headers — GradientText, SplitText
- Must match design tokens (#ff4d00 accent, Geist font, #f5f5f5 bg)

Install via:
```bash
npx shadcn@latest add @react-bits/ComponentName-JS-TW
```

---

## 🔧 What Still Needs Work (Priority Order)

1. Upload ~38 images via `/admin` (hero BG, services ×6, portfolio covers, testimonial portraits)
2. Visual comparison polish — side-by-side with Framer template
3. `AboutPage.jsx` — add Framer Motion + React Bits animations
4. `ContactPage.jsx` — add Framer Motion + React Bits animations
5. Mobile responsiveness — 3 breakpoints, one component at a time, LAST
6. Deploy to Vercel — GitHub + env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
7. SEO + meta tags — lowest priority

---

## 🤖 Subagents for This Project

| Agent | When to use |
|-------|------------|
| `frontend-design.md` | Visual polish, animation work, React Bits integration |
| `a11y-checker.md` | Accessibility review before deploy |
| `seo-reviewer.md` | Meta tags, OG images phase |

Delegate with: `Use a subagent to review animations in Hero.jsx against the Framer template.`

---

## 🔌 MCPs for This Project

Enable only these:
- `vercel` — for deployment
- `github` — for version control

Disable everything else. Context window protection is critical.

---

## ⛔ Hard Stops Specific to This Project

1. Never rewrite an entire component file — patch only
2. Never add BentoCards, Reviews carousel, or FAQs back (intentionally removed)
3. Never do mobile responsiveness at the same time as animation work
4. Never mix image/video storage (images=Supabase, videos=Cloudinary)
5. Never deploy without re-enabling RLS on all Supabase tables

---

## 🪝 Project-Specific Hooks

| Event | Trigger | Action |
|-------|---------|--------|
| PostToolUse | Edit `.jsx` | Run Prettier |
| PostToolUse | Edit `.jsx` | Check for useState in scroll handlers (warn if found) |
| Stop | End of session | Check modified components against Framer template visually |

---

## 💡 Working Style

- Always ask for current file code before making changes
- Read it completely before making changes
- Give targeted patches (find X → replace with Y)
- Test one thing at a time — easy to revert
- Reference `https://simplest-breakfast-965445.framer.app/` for any visual question
- Treat this like a high-end cinematic website, not a generic portfolio