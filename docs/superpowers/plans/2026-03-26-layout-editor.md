# Layout Editor (LayoutCanvas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inline draggable blueprint canvas to AdminPanel that lets the user reorder gallery images and toggle full-width vs half-width span, mirroring the frontend CSS Grid layout at a scaled-down size.

**Architecture:** Add a module-scope `normalizeGalleryImage` helper and a `LayoutCanvas` component to `AdminPanel.jsx`; patch three existing gallery-image handlers to preserve the new `span` field; update `ProjectDetailPage.jsx` to use `img.span` instead of the old positional rule for parallax and the old alternating-index algorithm for stack.

**Tech Stack:** React 18 (hooks: useRef, useState, useEffect, useLayoutEffect), HTML5 Drag and Drop API, ResizeObserver, CSS Grid, no new npm packages.

---

## File Map

| File | Change |
|------|--------|
| `src/pages/AdminPanel.jsx` | Add module-scope `normalizeGalleryImage`; add `LayoutCanvas` component; render `<LayoutCanvas>` below gallery uploader; patch `onUpload` (line 1063), ratio-change (line 1076), add-image (line 1102) handlers |
| `src/pages/ProjectDetailPage.jsx` | Parallax grid: replace positional `i === 0` rule with `img.span`-driven rule; StackGallery 2-col: replace alternating-index row builder with span-driven row builder |

---

## Task 1: Add `normalizeGalleryImage` at module scope in AdminPanel.jsx

**Files:**
- Modify: `src/pages/AdminPanel.jsx` — module scope, above all component definitions

- [ ] **Step 1: Read the top of AdminPanel.jsx to find the right insertion point**

  Read lines 1–40 of `src/pages/AdminPanel.jsx` to find the first component or function definition. The helper goes immediately before the first component definition.

- [ ] **Step 2: Insert `normalizeGalleryImage` at module scope**

  Find the first top-level `function` or `const` component declaration (e.g. `function AdminPanel` or `const AdminPanel`). Insert directly before it:

  ```js
  function normalizeGalleryImage(img) {
    if (!img) return { url: '', aspect_ratio: '16:9', span: 1 }
    if (typeof img === 'string') return { url: img, aspect_ratio: '16:9', span: 1 }
    return { url: img.url || '', aspect_ratio: img.aspect_ratio || '16:9', span: img.span ?? 1 }
  }
  ```

- [ ] **Step 3: Verify no duplicate definition**

  Search AdminPanel.jsx for `normalizeGalleryImage` — confirm exactly one definition.

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/AdminPanel.jsx
  git commit -m "feat(admin): add module-scope normalizeGalleryImage helper"
  ```

---

## Task 2: Patch three existing gallery-image handlers to preserve `span`

**Files:**
- Modify: `src/pages/AdminPanel.jsx` — lines 1063, 1076, 1102

- [ ] **Step 1: Patch `onUpload` handler (line 1063)**

  Find:
  ```js
  imgs[gi] = { url, aspect_ratio: imgRatio || '16:9' }
  ```
  Replace with:
  ```js
  imgs[gi] = { ...normalizeGalleryImage(imgs[gi]), url, aspect_ratio: imgRatio || '16:9' }
  ```

- [ ] **Step 2: Patch aspect-ratio dropdown `onChange` (line 1076)**

  Find:
  ```js
  imgs[gi] = { url: imgUrl, aspect_ratio: e.target.value }
  ```
  Replace with:
  ```js
  imgs[gi] = { ...normalizeGalleryImage(imgs[gi]), aspect_ratio: e.target.value }
  ```

- [ ] **Step 3: Patch "Add Image" button (line 1102)**

  Find:
  ```js
  u[i] = { ...u[i], gallery_images: [...(u[i].gallery_images || []), { url: '', aspect_ratio: '16:9' }] }
  ```
  Replace with:
  ```js
  u[i] = { ...u[i], gallery_images: [...(u[i].gallery_images || []), { url: '', aspect_ratio: '16:9', span: 1 }] }
  ```

- [ ] **Step 4: Verify no other places drop `span`**

  Search AdminPanel.jsx for `gallery_images` assignments that build image objects without using `normalizeGalleryImage`. Fix any found.

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/AdminPanel.jsx
  git commit -m "feat(admin): patch gallery image handlers to preserve span field"
  ```

---

## Task 3: Add `LayoutCanvas` component to AdminPanel.jsx

**Files:**
- Modify: `src/pages/AdminPanel.jsx` — insert `LayoutCanvas` function definition after `normalizeGalleryImage`

- [ ] **Step 1: Copy in `getGalleryCols` logic**

  `LayoutCanvas` needs column count. Define `getGalleryCols` locally (or copy from ProjectDetailPage) as a standalone function at module scope, below `normalizeGalleryImage`:

  ```js
  const PORTRAIT_RATIOS = new Set(['4:5', '3:4', '2:3', '9:16'])
  function getGalleryCols(imgs) {
    const valid = imgs.filter(img => img?.url || typeof img === 'string')
    if (valid.length === 0) return 2
    const portraitCount = valid.filter(img => {
      const ar = typeof img === 'object' ? img.aspect_ratio : '16:9'
      return PORTRAIT_RATIOS.has(ar)
    }).length
    return portraitCount > valid.length / 2 ? 3 : 2
  }
  ```

  Check if `PORTRAIT_RATIOS` and `getGalleryCols` already exist in ProjectDetailPage.jsx — use the same logic for consistency.

- [ ] **Step 2: Write `LayoutCanvas` component**

  Insert after `getGalleryCols`, before the main `AdminPanel` component:

  ```js
  function LayoutCanvas({ images, displayStyle, onSave }) {
    const imgs = (images || []).map(normalizeGalleryImage)
    const cols = getGalleryCols(imgs)
    const wrapperRef = React.useRef()
    const gridRef = React.useRef()
    const dragIndex = React.useRef(null)
    const [dropTarget, setDropTarget] = React.useState(null)

    // Initial scale + height on mount and when imgs change
    React.useLayoutEffect(() => {
      if (!wrapperRef.current || !gridRef.current) return
      const w = wrapperRef.current.offsetWidth
      const s = w / 1400
      gridRef.current.style.transform = `scale(${s})`
      gridRef.current.style.transformOrigin = 'top left'
      wrapperRef.current.style.height = `${gridRef.current.scrollHeight * s}px`
    }, [imgs])

    // Recalculate on container resize
    React.useEffect(() => {
      const obs = new ResizeObserver(([entry]) => {
        const w = entry.contentRect.width
        const s = w / 1400
        if (gridRef.current) {
          gridRef.current.style.transform = `scale(${s})`
          gridRef.current.style.transformOrigin = 'top left'
        }
        if (wrapperRef.current && gridRef.current) {
          wrapperRef.current.style.height = `${gridRef.current.scrollHeight * s}px`
        }
      })
      if (wrapperRef.current) obs.observe(wrapperRef.current)
      return () => obs.disconnect()
    }, [])

    function toggleSpan(index) {
      const updated = imgs.map((img, j) =>
        j === index ? { ...img, span: img.span === 2 ? 1 : 2 } : img
      )
      onSave(updated)
    }

    function getRatio(ar) {
      const map = {
        '16:9': '16/9', '4:3': '4/3', '3:2': '3/2', '1:1': '1/1',
        '4:5': '4/5', '3:4': '3/4', '2:3': '2/3', '9:16': '9/16', '21:9': '21/9'
      }
      return map[ar] || '16/9'
    }

    return (
      <div style={{ marginTop: '16px' }}>
        <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: '#ff4d00', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          🗂 Layout Editor — drag to reorder {cols === 3 ? '(3-col portrait grid)' : '(2-col landscape grid)'}
        </p>
        <div ref={wrapperRef} style={{ width: '100%', overflow: 'hidden', position: 'relative', borderRadius: '8px', border: '1px solid #222' }}>
          <div
            ref={gridRef}
            style={{
              width: '1400px',
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: '16px',
              padding: '16px',
              backgroundColor: '#0a0a0a',
            }}
          >
            {imgs.map((img, idx) => {
              const effectiveSpan = (img.span === 2 && cols === 2) ? 2 : 1
              const isDragging = dragIndex.current === idx
              const isDropTarget = dropTarget === idx
              return (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => { dragIndex.current = idx }}
                  onDragOver={(e) => { e.preventDefault(); setDropTarget(idx) }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={() => {
                    if (dragIndex.current === null || dragIndex.current === idx) {
                      setDropTarget(null)
                      return
                    }
                    const updated = [...imgs]
                    const [moved] = updated.splice(dragIndex.current, 1)
                    updated.splice(idx, 0, moved)
                    setDropTarget(null)
                    onSave(updated)
                  }}
                  onDragEnd={() => { dragIndex.current = null; setDropTarget(null) }}
                  style={{
                    gridColumn: `span ${effectiveSpan}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: isDropTarget ? '2px solid #ff4d00' : '2px solid #222',
                    opacity: isDragging ? 0.4 : 1,
                    cursor: 'grab',
                    backgroundColor: '#111',
                    position: 'relative',
                    aspectRatio: getRatio(img.aspect_ratio),
                  }}
                >
                  {/* Drag handle + span pill */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', zIndex: 2 }}>
                    <span style={{ fontSize: '18px', lineHeight: 1, color: '#888', cursor: 'grab' }}>⠿</span>
                    {cols === 2 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSpan(idx) }}
                        style={{
                          fontFamily: '"Geist",sans-serif', fontSize: '10px', fontWeight: 600,
                          color: img.span === 2 ? '#ff4d00' : '#888',
                          background: 'rgba(0,0,0,0.6)', border: `1px solid ${img.span === 2 ? '#ff4d00' : '#444'}`,
                          borderRadius: '4px', padding: '3px 7px', cursor: 'pointer', lineHeight: 1.4
                        }}
                      >
                        {img.span === 2 ? 'Full ▸' : 'Half ▸'}
                      </button>
                    )}
                  </div>
                  {/* Thumbnail */}
                  {img.url ? (
                    <img
                      src={img.url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      draggable={false}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '28px' }}>📷</div>
                  )}
                  {/* Aspect ratio badge */}
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', fontFamily: '"Geist Mono",monospace', fontSize: '10px', color: '#888', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '3px' }}>
                    {img.aspect_ratio}
                  </div>
                  {/* Index badge */}
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontFamily: '"Geist Mono",monospace', fontSize: '10px', color: '#555', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '3px' }}>
                    #{idx + 1}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 3: Verify no syntax errors**

  Run `npm run build` — confirm zero errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/AdminPanel.jsx
  git commit -m "feat(admin): add LayoutCanvas component"
  ```

---

## Task 4: Render `<LayoutCanvas>` in the project card

**Files:**
- Modify: `src/pages/AdminPanel.jsx` — insert after gallery images uploader grid (after line 1113)

- [ ] **Step 1: Locate insertion point**

  The gallery images uploader `</div>` closing tag is at line 1113. The "Homepage Toggle + Save + Delete" section starts at line 1116. The `<LayoutCanvas>` goes between these two, at line ~1114.

- [ ] **Step 2: Insert `showCanvas` check and `<LayoutCanvas>` render**

  Find (the closing div of the gallery uploader grid section, followed by the Homepage Toggle comment):
  ```js
              </div>
            </div>

              {/* Homepage Toggle + Save + Delete */}
  ```
  Replace with:
  ```js
              </div>
            </div>

              {/* Layout Editor Canvas */}
              {(['parallax', 'stack'].includes(p.image_display_style)) &&
               (p.gallery_images || []).filter(img => img?.url || typeof img === 'string').length >= 2 && (
                <LayoutCanvas
                  images={p.gallery_images}
                  displayStyle={p.image_display_style}
                  onSave={(newImages) => {
                    const u = [...projects]
                    u[i] = { ...u[i], gallery_images: newImages }
                    setProjects(u)
                    saveRow('projects', u[i])
                  }}
                />
              )}

              {/* Homepage Toggle + Save + Delete */}
  ```

- [ ] **Step 3: Run dev server and navigate to /admin**

  Open a project with `parallax` or `stack` display style and 2+ gallery images.
  Verify:
  - Canvas appears below the uploader grid
  - Tiles show correct aspect ratios and thumbnails
  - Canvas is hidden for projects with circular/infinite display style or < 2 images

- [ ] **Step 4: Test drag reorder**

  Drag one tile to another position — verify the order updates in the uploader grid above and is saved to Supabase.

- [ ] **Step 5: Test span toggle (2-col only)**

  For a landscape-grid project, click "Half ▸" on a tile — verify it becomes "Full ▸" and the tile spans both columns. Verify portrait grids (3-col) show no span button.

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/AdminPanel.jsx
  git commit -m "feat(admin): render LayoutCanvas below gallery uploader in project card"
  ```

---

## Task 5: Update ProjectDetailPage.jsx — parallax grid span rule

**Files:**
- Modify: `src/pages/ProjectDetailPage.jsx` — parallax grid section

- [ ] **Step 1: Find the old positional span rule**

  Search `ProjectDetailPage.jsx` for `spanFull` or `i === 0` near the parallax grid section. The current code is:
  ```js
  const spanFull = cols === 2 && i === 0
  style={{ gridColumn: spanFull ? `span ${cols}` : 'span 1' }}
  ```

- [ ] **Step 2: Replace with span-driven rule**

  Replace with:
  ```js
  const imgObj = typeof img === 'object' ? img : { url: img, aspect_ratio: '16:9', span: 1 }
  const spanFull = imgObj.span === 2 && cols === 2
  style={{ gridColumn: spanFull ? 'span 2' : 'span 1' }}
  ```

- [ ] **Step 3: Verify existing projects still look correct**

  Existing images have no `span` field → `imgObj.span` is `undefined` → `spanFull` is `false` → all images default to `span 1`. This is correct — previously only `i === 0` was full-width, but that was an arbitrary default that the layout editor now replaces.

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/ProjectDetailPage.jsx
  git commit -m "feat(project-detail): use img.span for parallax grid instead of positional i===0 rule"
  ```

---

## Task 6: Update ProjectDetailPage.jsx — StackGallery 2-col span-driven row builder

**Files:**
- Modify: `src/pages/ProjectDetailPage.jsx` — StackGallery component, 2-col landscape path

- [ ] **Step 1: Find the existing row builder**

  Search for `rowIndex % 2` or the landscape path inside `StackGallery`. The current code alternates full-width and 2-col rows based on row index.

- [ ] **Step 2: Find or confirm the local `normalize` helper**

  The spec notes a local `normalize` already exists in `ProjectDetailPage.jsx`. Search for it. If not found, add a local one at the top of the `StackGallery` component:
  ```js
  function norm(img) {
    if (!img) return { url: '', aspect_ratio: '16:9', span: 1 }
    if (typeof img === 'string') return { url: img, aspect_ratio: '16:9', span: 1 }
    return { url: img.url || '', aspect_ratio: img.aspect_ratio || '16:9', span: img.span ?? 1 }
  }
  ```

- [ ] **Step 3: Replace alternating-index row builder with span-driven builder**

  Find the landscape 2-col rows array construction and replace with:
  ```js
  const rows = []
  let idx = 0
  while (idx < images.length) {
    const img = norm(images[idx])
    if (img.span === 2) {
      rows.push([images[idx]])
      idx++
    } else {
      const next = images[idx + 1] ? norm(images[idx + 1]) : null
      if (next && next.span !== 2) {
        rows.push([images[idx], images[idx + 1]])
        idx += 2
      } else {
        rows.push([images[idx]])
        idx++
      }
    }
  }
  ```

- [ ] **Step 4: Verify 3-col portrait path is unchanged**

  Search for the portrait (3-col) path inside `StackGallery` — it should not reference `span` or the new row builder.

- [ ] **Step 5: Run dev server, open a project with `stack` display style**

  Verify:
  - Images with `span: 2` render full-width (solo rows)
  - Images with `span: 1` pair up into 2-col rows
  - Portrait stack grid is unaffected

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/ProjectDetailPage.jsx
  git commit -m "feat(project-detail): span-driven row builder for StackGallery 2-col landscape"
  ```

---

## Edge Case Checklist (verify before marking complete)

- [ ] Canvas hidden when display style is `circular` or `infinite`
- [ ] Canvas hidden when fewer than 2 images have a URL
- [ ] 3-col portrait grid: span button absent, `effectiveSpan` always 1
- [ ] Legacy string images (old format): `normalizeGalleryImage` handles them
- [ ] `span: 2` in a 3-col grid: clamped to `span 1` by `effectiveSpan` logic
- [ ] Uploading a new image preserves existing `span` value on that slot
- [ ] Changing aspect ratio preserves existing `span` value
- [ ] Adding a new image slot initializes with `span: 1`
- [ ] ResizeObserver cleans up on unmount (no memory leak in mapped project list)
