import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'images'
const CLOUD_NAME = 'dj7us5uhy'
const UPLOAD_PRESET = 'portfolio_uploads'
const accent = '#ff4d00'
const dark = '#0a0a0a'
const card = '#141414'
const border = '#222'
const gray = '#888'
const white = '#fff'

/* ── Compress image before upload ── */
function compressImage(file) {
  return new Promise((resolve) => {
    const maxW = 1920, quality = 0.8
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxW) { h = (maxW / w) * h; w = maxW }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/* ── Upload video to Cloudinary ── */
async function uploadToCloudinary(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('resource_type', 'video')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`)
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve(data.secure_url)
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }
    
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(formData)
  })
}

/* ── Gallery image normalizer — handles legacy string format + missing span ── */
function normalizeGalleryImage(img) {
  if (!img) return { url: '', aspect_ratio: '16:9', span: 1 }
  if (typeof img === 'string') return { url: img, aspect_ratio: '16:9', span: 1 }
  return { url: img.url || '', aspect_ratio: img.aspect_ratio || '16:9', span: img.span ?? 1 }
}

/* ── Column count: 3 if majority portrait, else 2 ── */
const PORTRAIT_RATIOS_ADMIN = new Set(['4:5', '3:4', '2:3', '9:16'])
function getGalleryCols(imgs) {
  const valid = imgs.filter(img => img?.url || typeof img === 'string')
  if (valid.length === 0) return 2
  const portraitCount = valid.filter(img => {
    const ar = typeof img === 'object' ? img.aspect_ratio : '16:9'
    return PORTRAIT_RATIOS_ADMIN.has(ar)
  }).length
  return portraitCount > valid.length / 2 ? 3 : 2
}

/* ── Image Uploader (Supabase) ── */
function ImageUploader({ value, onUpload, folder, label, height = '160px' }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const path = `${folder}/${Date.now()}.jpg`
      const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
      if (error) { alert('Upload failed: ' + error.message) }
      else {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
        onUpload(data.publicUrl)
      }
    } catch (e) { console.error(e); alert('Upload error') }
    setUploading(false)
  }

  return (
    <div onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files[0]) }}
      style={{
        width: '100%', height, borderRadius: '12px', overflow: 'hidden',
        border: `2px dashed ${dragOver ? accent : border}`,
        backgroundColor: dragOver ? '#1a1008' : '#0d0d0d',
        cursor: 'pointer', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.2s, background-color 0.2s',
      }}>
      {value ? (
        <>
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}>
            <span style={{ color: white, fontSize: '13px', fontFamily: '"Geist",sans-serif', background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: '20px' }}>Replace</span>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', border: `3px solid ${border}`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: accent, fontSize: '13px', fontFamily: '"Geist",sans-serif' }}>Uploading...</span>
            </div>
          ) : (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={gray} strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <p style={{ color: gray, fontSize: '12px', fontFamily: '"Geist",sans-serif', margin: '8px 0 0' }}>{label || 'Drop image or click'}</p>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => upload(e.target.files[0])} />
    </div>
  )
}

/* ── Video Uploader (Cloudinary) ── */
function VideoUploader({ value, onUpload, label, height = '200px' }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const upload = async (file) => {
    if (!file) return
    if (!file.type.startsWith('video/')) { alert('Please select a video file (MP4, MOV, WebM)'); return }
    if (file.size > 100 * 1024 * 1024) { alert('Video must be under 100MB. Your file: ' + (file.size / 1024 / 1024).toFixed(1) + 'MB'); return }
    
    setUploading(true)
    setProgress(0)
    try {
      const url = await uploadToCloudinary(file, setProgress)
      onUpload(url)
      setProgress(100)
    } catch (e) {
      console.error(e)
      alert('Video upload failed: ' + e.message)
    }
    setTimeout(() => { setUploading(false); setProgress(0) }, 500)
  }

  return (
    <div onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files[0]) }}
      style={{
        width: '100%', height, borderRadius: '12px', overflow: 'hidden',
        border: `2px dashed ${dragOver ? '#a855f7' : border}`,
        backgroundColor: dragOver ? '#1a0828' : '#0d0d0d',
        cursor: uploading ? 'wait' : 'pointer', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.2s, background-color 0.2s',
      }}>
      {value ? (
        <>
          <video src={value} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
            <span style={{ color: white, fontSize: '13px', fontFamily: '"Geist",sans-serif', background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: '20px' }}>Replace video</span>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '200px' }}>
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#1a1a1a', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#a855f7', borderRadius: '3px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ color: '#a855f7', fontSize: '13px', fontFamily: '"Geist",sans-serif' }}>
                {progress < 100 ? `Uploading ${progress}%` : '✓ Processing...'}
              </span>
            </div>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polygon points="10,8 16,12 10,16" fill="#a855f7" stroke="none" />
              </svg>
              <p style={{ color: gray, fontSize: '12px', fontFamily: '"Geist",sans-serif', margin: '8px 0 0' }}>{label || 'Drop video or click'}</p>
              <p style={{ color: '#555', fontSize: '11px', fontFamily: '"Geist",sans-serif', margin: '4px 0 0' }}>MP4, MOV, WebM • Max 100MB</p>
              <p style={{ color: '#a855f7', fontSize: '11px', fontFamily: '"Geist",sans-serif', margin: '4px 0 0' }}>↑ Uploads to Cloudinary</p>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => upload(e.target.files[0])} />
    </div>
  )
}

function Input({ label, value, onChange, multiline, placeholder, type, onKeyDown }) {
  const s = { width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '14px', color: white, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '8px', padding: '10px 14px', outline: 'none', resize: multiline ? 'vertical' : 'none' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: gray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>}
      {multiline
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4} placeholder={placeholder} style={s} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = border} />
        : <input type={type || 'text'} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown} style={s} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = border} />
      }
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', small, disabled, fullWidth }) {
  const bg = variant === 'primary' ? accent : variant === 'danger' ? '#dc2626' : variant === 'purple' ? '#a855f7' : '#222'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: '"Geist",sans-serif', fontSize: small ? '12px' : '14px', fontWeight: 500,
      color: white, backgroundColor: bg, border: 'none', borderRadius: '8px',
      padding: small ? '6px 12px' : '10px 20px', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, width: fullWidth ? '100%' : 'auto',
      transition: 'transform 0.15s, opacity 0.15s',
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  )
}

function Section({ title, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ backgroundColor: card, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', marginBottom: '16px' }}>
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', cursor: 'pointer',
        borderBottom: open ? `1px solid ${border}` : 'none',
        transition: 'background-color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ fontFamily: '"Geist",sans-serif', fontSize: '16px', fontWeight: 600, color: white, margin: 0 }}>{title}</h3>
          {badge && <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: dark, backgroundColor: accent, padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{badge}</span>}
        </div>
        <span style={{ color: gray, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s ease', fontSize: '12px' }}>▼</span>
      </div>
      {open && <div style={{ padding: '20px' }}>{children}</div>}
    </div>
  )
}

/* ── DB helper ── */
async function directSaveField(key, field, val, setSettings, showToast) {
  // maybeSingle() never errors on missing rows (unlike single())
  const { data } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle()
  const newValue = { ...(data?.value || {}), [field]: val }
  // upsert creates the row if it doesn't exist yet
  const { error: writeErr } = await supabase
    .from('site_settings')
    .upsert({ key, value: newValue }, { onConflict: 'key' })
  if (writeErr) { showToast(`Save failed: ${writeErr.message}`, 'error') }
  else {
    showToast(`${field} uploaded & saved!`, 'upload')
    setSettings(prev => ({ ...prev, [key]: { ...prev[key], value: newValue } }))
  }
}

/* ── Layout Canvas — inline blueprint for reordering gallery images and toggling span ── */
function LayoutCanvas({ images, displayStyle, onSave }) {
  const imgs = (images || []).map(normalizeGalleryImage)
  const cols = getGalleryCols(imgs)
  const wrapperRef = useRef()
  const gridRef = useRef()
  const dragIndex = useRef(null)
  const [dropTarget, setDropTarget] = useState(null)

  // Scale to fit container width — CSS zoom affects layout so vertical scroll works correctly
  function applyScale() {
    if (!wrapperRef.current || !gridRef.current) return
    const w = wrapperRef.current.offsetWidth
    const s = w / 1400
    gridRef.current.style.zoom = s
    gridRef.current.style.transform = 'none'
    gridRef.current.style.transformOrigin = ''
  }

  useEffect(() => {
    const raf = requestAnimationFrame(applyScale)
    return () => cancelAnimationFrame(raf)
  }, [imgs.length, displayStyle])

  useEffect(() => {
    const obs = new ResizeObserver(() => requestAnimationFrame(applyScale))
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

  // Stack display = row-major CSS grid (matches StackGallery on page)
  // Parallax display = column-major CSS columns masonry (matches parallax grid on page)
  const isStack = displayStyle === 'stack'

  return (
    <div style={{ marginTop: '16px' }}>
      <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: accent, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        🗂 Layout Editor — drag to reorder {cols === 3 ? '(3-col portrait)' : '(2-col landscape)'} · {isStack ? 'row flow' : 'masonry flow'}
      </p>
      <div ref={wrapperRef} style={{ width: '100%', overflowY: 'auto', maxHeight: '520px', position: 'relative', borderRadius: '8px', border: `1px solid ${border}` }}>
        <div
          ref={gridRef}
          style={{
            width: '1400px',
            padding: '16px',
            backgroundColor: '#0a0a0a',
            ...(isStack
              ? { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '20px' }
              : { columns: cols, columnGap: '20px' }
            ),
          }}
        >
          {imgs.map((img, idx) => {
            const effectiveSpan = (img.span === 2 && cols === 2) ? 2 : 1
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
                  ...(isStack
                    ? { gridColumn: effectiveSpan === 2 ? 'span 2' : 'span 1' }
                    : { breakInside: 'avoid', marginBottom: '20px', display: 'block', ...(effectiveSpan === 2 && { columnSpan: 'all' }) }
                  ),
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: isDropTarget ? `2px solid ${accent}` : `2px solid ${border}`,
                  cursor: 'grab',
                  backgroundColor: '#111',
                  position: 'relative',
                  aspectRatio: getRatio(img.aspect_ratio),
                }}
              >
                {/* Drag handle + span toggle */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', zIndex: 2 }}>
                  <span style={{ fontSize: '18px', lineHeight: 1, color: '#888' }}>⠿</span>
                  {cols === 2 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSpan(idx) }}
                      style={{
                        fontFamily: '"Geist",sans-serif', fontSize: '10px', fontWeight: 600,
                        color: img.span === 2 ? accent : '#888',
                        background: 'rgba(0,0,0,0.6)', border: `1px solid ${img.span === 2 ? accent : '#444'}`,
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

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [settings, setSettings] = useState({})
  const [services, setServices] = useState([])
  const [projects, setProjects] = useState([])
  const [reviews, setReviews] = useState([])
  const [faqs, setFaqs] = useState([])
  const [shots, setShots] = useState([])
  const [videos, setVideos] = useState([])
  const [collabs, setCollabs] = useState([])
  const [messages, setMessages] = useState([])
  const [newTool, setNewTool] = useState('')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(''), type === 'error' ? 6000 : 3500) }

  // Restore session on page load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuthed(true)
    })
  }, [])

  useEffect(() => { if (authed) loadAll() }, [authed])

  const loadAll = async () => {
    const [s, sv, p, r, f, sh, v, c, m] = await Promise.all([
      supabase.from('site_settings').select('*'),
      supabase.from('services').select('*').order('sort_order'),
      supabase.from('projects').select('*').order('sort_order'),
      supabase.from('reviews').select('*').order('sort_order'),
      supabase.from('faqs').select('*').order('sort_order'),
      supabase.from('my_shots').select('*').order('sort_order'),
      supabase.from('my_videos').select('*').order('sort_order'),
      supabase.from('collaborations').select('*').order('sort_order'),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
    ])
    if (s.data) { const obj = {}; s.data.forEach(row => { obj[row.key] = { id: row.id, value: row.value } }); setSettings(obj) }
    if (sv.data) setServices(sv.data)
    if (p.data) setProjects(p.data)
    if (r.data) setReviews(r.data)
    if (f.data) setFaqs(f.data)
    if (sh.data) setShots(sh.data)
    if (v.data) setVideos(v.data)
    if (c.data) setCollabs(c.data)
    if (m.data) setMessages(m.data)
  }

  const handleLogin = async () => {
    if (!pw) return
    setLoginLoading(true)
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    if (!adminEmail) {
      showToast('VITE_ADMIN_EMAIL not set in .env', 'error')
      setLoginLoading(false)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: pw })
    if (error) showToast('Wrong password. Please try again.', 'error')
    else setAuthed(true)
    setLoginLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAuthed(false)
  }

  const saveSetting = async (key, value) => {
    setSaving(true)
    const { error } = await supabase.from('site_settings').update({ value }).eq('key', key)
    if (error) showToast('Save failed. Please try again.', 'error')
    else showToast(`${key} saved successfully!`, 'success')
    setSaving(false)
  }

  const updateSetting = (key, field, val) => {
    setSettings(prev => ({ ...prev, [key]: { ...prev[key], value: { ...prev[key]?.value, [field]: val } } }))
  }

  const saveImage = async (key, field, url) => {
    setSaving(true)
    await directSaveField(key, field, url, setSettings, showToast)
    setSaving(false)
  }

  const saveRow = async (table, row) => {
    setSaving(true)
    const { id, created_at, ...rest } = row
    if (id) {
      const { error } = await supabase.from(table).update(rest).eq('id', id)
      if (error) { showToast('Update failed. Please try again.', 'error'); setSaving(false); return }
    } else {
      const { error } = await supabase.from(table).insert([rest])
      if (error) { showToast('Create failed. Please try again.', 'error'); setSaving(false); return }
    }
    showToast(`${table} item saved!`, 'success')
    await loadAll()
    setSaving(false)
  }

  const deleteRow = async (table, id) => {
    if (!confirm('Delete?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) showToast(`Delete failed: ${error.message}`, 'error')
    else showToast(`Item deleted`, 'warning')
    await loadAll()
  }

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: card, borderRadius: '20px', padding: 'clamp(24px, 5vw, 40px)', width: '100%', maxWidth: '400px', border: `1px solid ${border}` }}>
          <h1 style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 600, color: white, margin: '0 0 8px', textAlign: 'center' }}>
            <span style={{ color: accent }}>.</span>Admin Panel
          </h1>
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: gray, textAlign: 'center', margin: '0 0 24px' }}>Enter password to continue</p>
          <Input value={pw} onChange={setPw} placeholder="Password" type="password"
            onKeyDown={async e => { if (e.key === 'Enter') await handleLogin() }} />
          <div style={{ marginTop: '16px' }}>
            <Btn onClick={handleLogin} fullWidth disabled={loginLoading}>
              {loginLoading ? 'Signing in...' : 'Enter Dashboard'}
            </Btn>
          </div>
        </div>
      </div>
    )
  }

  /* ── Dashboard ── */
  return (
    <div style={{ minHeight: '100vh', backgroundColor: dark }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: toast.type === 'error' ? '#dc2626' : toast.type === 'warning' ? '#d97706' : toast.type === 'info' ? '#2563eb' : toast.type === 'upload' ? '#a855f7' : '#16a34a',
          color: white, padding: '12px 28px', borderRadius: '12px',
          fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 500,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          animation: 'slideDown 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '8px',
          maxWidth: '90vw',
        }}>
          <span>{toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : toast.type === 'upload' ? '📤' : toast.type === 'info' ? 'ℹ️' : '✅'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${border}`, padding: '12px clamp(16px, 4vw, 32px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100, backgroundColor: dark,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}>
        <h1 style={{ fontFamily: '"Geist",sans-serif', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 600, color: white, margin: 0 }}>
          <span style={{ color: accent }}>.</span>SHRAVAN
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/" target="_blank" style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: gray, textDecoration: 'none' }}>View Site →</a>
          <Btn onClick={handleLogout} variant="ghost" small>Logout</Btn>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        maxWidth: '900px', margin: '0 auto', padding: '16px clamp(12px, 3vw, 20px)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px',
      }}>
        {[
          { label: 'Services', count: services.length, color: accent },
          { label: 'Projects', count: projects.length, color: '#3b82f6' },
          { label: 'Shots', count: shots.length, color: '#a855f7' },
          { label: 'Reviews', count: reviews.length, color: '#eab308' },
          { label: 'Messages', count: messages.length, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: card, borderRadius: '10px', padding: '12px',
            border: `1px solid ${border}`, textAlign: 'center',
          }}>
            <p style={{ fontFamily: '"Geist Mono",monospace', fontSize: '20px', fontWeight: 600, color: s.color, margin: 0 }}>{s.count}</p>
            <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '4px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '8px clamp(12px, 3vw, 20px) 80px' }}>

        {/* ═══ HERO & BRAND ═══ */}
        <Section title="🏠 Hero & Brand" defaultOpen={true}>
          <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <Input label="Brand Name" value={settings.brand?.value?.name} onChange={v => updateSetting('brand', 'name', v)} />
            <Input label="Title" value={settings.brand?.value?.title} onChange={v => updateSetting('brand', 'title', v)} />
            <Input label="Location" value={settings.brand?.value?.location} onChange={v => updateSetting('brand', 'location', v)} />
            <Input label="Headline" value={settings.hero?.value?.headline} onChange={v => updateSetting('hero', 'headline', v)} />
            <Input label="Tagline" value={settings.hero?.value?.tagline} onChange={v => updateSetting('hero', 'tagline', v)} />
          </div>
          <div style={{ marginTop: '14px' }}>
            <Input label="Subtext" value={settings.hero?.value?.subtext} onChange={v => updateSetting('hero', 'subtext', v)} multiline />
          </div>

          {/* ── Headline Text Color ── */}
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: gray, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Headline Color</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { key: 'white',    label: 'White',    swatch: '#ffffff', note: 'mix-blend difference' },
                { key: 'orange',   label: 'Orange',   swatch: '#ff4d00', note: 'brand accent' },
                { key: 'gold',     label: 'Gold',     swatch: '#d4a843', note: 'luxury tone' },
                { key: 'gradient', label: 'Gradient', swatch: 'linear-gradient(90deg,#fff,#ff4d00,#fff)', note: 'animated flow' },
              ].map(opt => {
                const active = (settings.hero?.value?.text_color || 'white') === opt.key
                return (
                  <div key={opt.key} onClick={async () => {
                    updateSetting('hero', 'text_color', opt.key)
                    await directSaveField('hero', 'text_color', opt.key, setSettings, showToast)
                  }} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    cursor: 'pointer', padding: '8px 10px', borderRadius: '10px',
                    border: `2px solid ${active ? accent : border}`,
                    backgroundColor: active ? 'rgba(255,77,0,0.08)' : '#0d0d0d',
                    transition: 'all 0.2s', minWidth: '72px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: opt.swatch,
                      border: '2px solid rgba(255,255,255,0.1)',
                      boxShadow: active ? `0 0 0 3px ${accent}44` : 'none',
                    }} />
                    <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: active ? accent : white, fontWeight: active ? 600 : 400 }}>{opt.label}</span>
                    <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: gray, textAlign: 'center' }}>{opt.note}</span>
                    {active && <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '9px', color: accent, fontWeight: 700 }}>✓ ACTIVE</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Media uploads */}
          <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '16px' }}>
            <div>
              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Hero Background</p>
              <ImageUploader value={settings.hero?.value?.bg_image} folder="hero" label="Hero BG Image"
                onUpload={url => saveImage('hero', 'bg_image', url)} />
            </div>
            <div>
              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Recent Work Thumbnail</p>
              <ImageUploader value={settings.hero?.value?.recent_work_image} folder="hero" label="Recent Work"
                onUpload={url => saveImage('hero', 'recent_work_image', url)} />
            </div>
          </div>

          {/* Hero Video — Cloudinary */}
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#0d0d0d', borderRadius: '12px', border: `1px solid #2d1f4e` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#a855f7', fontSize: '14px' }}>🎬</span>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', fontWeight: 600, color: '#a855f7', margin: 0 }}>
                  HERO BACKGROUND
                </p>
              </div>
              {/* Toggle Switch — Video vs Image */}
              <div
                onClick={async () => {
                  const current = settings.hero?.value?.hero_mode || 'image'
                  const next = current === 'video' ? 'image' : 'video'
                  const newValue = { ...settings.hero?.value, hero_mode: next }
                  updateSetting('hero', 'hero_mode', next)
                  await saveSetting('hero', newValue)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span style={{
                  fontFamily: '"Geist",sans-serif', fontSize: '12px', fontWeight: 500,
                  color: (settings.hero?.value?.hero_mode || 'image') === 'image' ? accent : '#555',
                  transition: 'color 0.2s',
                }}>Image</span>
                <div style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  backgroundColor: (settings.hero?.value?.hero_mode || 'image') === 'video' ? '#a855f7' : '#333',
                  position: 'relative', transition: 'background-color 0.3s ease',
                  border: `1px solid ${(settings.hero?.value?.hero_mode || 'image') === 'video' ? '#a855f7' : '#444'}`,
                }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    backgroundColor: '#fff',
                    position: 'absolute', top: '2px',
                    left: (settings.hero?.value?.hero_mode || 'image') === 'video' ? '22px' : '2px',
                    transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
                <span style={{
                  fontFamily: '"Geist",sans-serif', fontSize: '12px', fontWeight: 500,
                  color: (settings.hero?.value?.hero_mode || 'image') === 'video' ? '#a855f7' : '#555',
                  transition: 'color 0.2s',
                }}>Video</span>
              </div>
            </div>
            <div style={{
              padding: '8px 14px', borderRadius: '8px', marginBottom: '12px',
              backgroundColor: (settings.hero?.value?.hero_mode || 'image') === 'video' ? 'rgba(168,85,247,0.1)' : 'rgba(255,77,0,0.1)',
              border: `1px solid ${(settings.hero?.value?.hero_mode || 'image') === 'video' ? 'rgba(168,85,247,0.2)' : 'rgba(255,77,0,0.2)'}`,
            }}>
              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: (settings.hero?.value?.hero_mode || 'image') === 'video' ? '#a855f7' : accent, margin: 0 }}>
                {(settings.hero?.value?.hero_mode || 'image') === 'video'
                  ? '🎬 Hero is showing VIDEO background. Upload or change video below.'
                  : '🖼️ Hero is showing IMAGE background. Change the hero image above.'}
              </p>
            </div>
            <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#666', margin: '0 0 12px' }}>
              Upload a cinematic showreel. Video plays on loop in the hero background. Takes priority over the image.
            </p>
            <VideoUploader
              value={settings.hero?.value?.hero_video}
              label="Hero Background Video"
              height="180px"
              onUpload={url => saveImage('hero', 'hero_video', url)}
            />
            {settings.hero?.value?.hero_video && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <Btn onClick={() => saveImage('hero', 'hero_video', '')} variant="danger" small>Remove Video</Btn>
                <a href={settings.hero?.value?.hero_video} target="_blank" rel="noopener"
                  style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#a855f7', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  Preview ↗
                </a>
              </div>
            )}
          </div>

          {/* ── Hero Visibility Toggles ── */}
          <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[
              { key: 'show_tagline', label: 'Tagline Line', note: '"Award-winning creative" above headline' },
              { key: 'show_bottom_bar', label: 'Bottom Tab Bar', note: 'social links + subtext + award strip' },
              { key: 'show_award', label: 'Award Panel', note: 'trophy + award name in bottom right' },
            ].map(({ key, label, note }) => {
              const on = settings.hero?.value?.[key] !== false
              return (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: '1 1 200px' }}>
                  <div
                    onClick={async () => {
                      const next = !on
                      updateSetting('hero', key, next)
                      await directSaveField('hero', key, next, setSettings, showToast)
                    }}
                    style={{
                      width: '36px', height: '20px', borderRadius: '10px',
                      backgroundColor: on ? accent : '#333',
                      position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: on ? '19px' : '3px',
                      width: '14px', height: '14px', borderRadius: '50%',
                      backgroundColor: '#fff', transition: 'left 0.2s',
                    }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: on ? accent : '#888', margin: 0, fontWeight: 500 }}>{label}</p>
                    <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: 0 }}>{note}</p>
                  </div>
                </label>
              )
            })}
          </div>

          <div style={{ marginTop: '16px' }}>
            <Btn onClick={async () => { await saveSetting('brand', settings.brand?.value); await saveSetting('hero', settings.hero?.value) }} disabled={saving} fullWidth>
              {saving ? 'Saving...' : 'Save Hero & Brand'}
            </Btn>
          </div>
        </Section>

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
            <Input label="Email" value={settings.contact?.value?.email} onChange={v => updateSetting('contact', 'email', v)} />
            <Input label="Phone" value={settings.contact?.value?.phone} onChange={v => updateSetting('contact', 'phone', v)} />
            <Input label="Instagram URL" value={settings.social?.value?.instagram} onChange={v => updateSetting('social', 'instagram', v)} />
            <Input label="YouTube URL" value={settings.social?.value?.youtube} onChange={v => updateSetting('social', 'youtube', v)} />
          </div>
          <div style={{ marginTop: '16px' }}>
            <Btn onClick={async () => { await saveSetting('contact', settings.contact?.value); await saveSetting('social', settings.social?.value) }} disabled={saving} fullWidth>Save Contact & Social</Btn>
          </div>
        </Section>

        {/* ═══ TESTIMONIAL ═══ */}
        <Section title="💬 Testimonial">
          <Input label="Quote" value={settings.testimonial?.value?.quote} onChange={v => updateSetting('testimonial', 'quote', v)} multiline />
          <div className="admin-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '14px' }}>
            <Input label="Reviewer Name" value={settings.testimonial?.value?.name} onChange={v => updateSetting('testimonial', 'name', v)} />
            <Input label="Reviewer Role" value={settings.testimonial?.value?.role} onChange={v => updateSetting('testimonial', 'role', v)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '14px', marginTop: '16px' }}>
            <div>
              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Avatar</p>
              <ImageUploader value={settings.testimonial?.value?.reviewer_image} folder="testimonial" label="Avatar" onUpload={url => saveImage('testimonial', 'reviewer_image', url)} height="100px" />
            </div>
            <div>
              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Portrait 1</p>
              <ImageUploader value={settings.testimonial?.value?.image_1} folder="testimonial" label="Tall" onUpload={url => saveImage('testimonial', 'image_1', url)} height="100px" />
            </div>
            <div>
              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Portrait 2</p>
              <ImageUploader value={settings.testimonial?.value?.image_2} folder="testimonial" label="Landscape" onUpload={url => saveImage('testimonial', 'image_2', url)} height="100px" />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}><Btn onClick={() => saveSetting('testimonial', settings.testimonial?.value)} disabled={saving} fullWidth>Save Testimonial</Btn></div>
        </Section>

        {/* ═══ ABOUT ═══ */}
        <Section title="👤 About Bio">
          {/* Background image */}
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
                    const current = settings.about?.value?.tools || []
                    if (current.includes(newTool.trim())) { showToast('Tool already added', 'error'); return }
                    const updated = [...current, newTool.trim()]
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
                const current = settings.about?.value?.tools || []
                if (current.includes(newTool.trim())) { showToast('Tool already added', 'error'); return }
                const updated = [...current, newTool.trim()]
                directSaveField('about', 'tools', updated, setSettings, showToast)
                setNewTool('')
              }}>Add</Btn>
            </div>
          </div>
        </Section>

        {/* ═══ ANIMATION STYLE ═══ */}
        <Section title="✨ Heading Animation Style">
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: gray, marginBottom: '16px' }}>
            Choose how headings animate on the project detail pages and throughout the site.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { key: 'none', label: 'None', desc: 'Plain — no animation' },
              { key: 'fade', label: 'Fade Reveal', desc: 'Slide up + fade in' },
              { key: 'blur', label: 'Blur Text', desc: 'Blur → sharp reveal' },
              { key: 'gradient', label: 'Gradient', desc: 'Animated color flow' },
              { key: 'fuzzy', label: 'Fuzzy Text', desc: 'Glitchy canvas effect' },
            ].map(opt => {
              const selected = (settings.animations?.value?.heading || 'blur') === opt.key
              return (
                <div key={opt.key} onClick={async () => {
                  updateSetting('animations', 'heading', opt.key)
                  await directSaveField('animations', 'heading', opt.key, setSettings, showToast)
                }} style={{
                  padding: '14px', borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${selected ? accent : border}`,
                  backgroundColor: selected ? 'rgba(255,77,0,0.08)' : '#0d0d0d',
                  transition: 'all 0.2s',
                }}>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', fontWeight: 600, color: selected ? accent : white, margin: '0 0 4px' }}>{opt.label}</p>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: 0 }}>{opt.desc}</p>
                  {selected && <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: accent, margin: '6px 0 0', fontWeight: 600 }}>✓ ACTIVE</p>}
                </div>
              )
            })}
          </div>
        </Section>

        {/* ═══ AWARDS & STATS ═══ */}
        <Section title="🏆 Awards & Stats">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
            <Input label="Award Name" value={settings.awards?.value?.name} onChange={v => updateSetting('awards', 'name', v)} />
            <Input label="Years" value={settings.awards?.value?.years} onChange={v => updateSetting('awards', 'years', v)} />
            <Input label="Count" value={settings.awards?.value?.count} onChange={v => updateSetting('awards', 'count', v)} />
            <Input label="Counter Label" value={settings.awards?.value?.label} onChange={v => updateSetting('awards', 'label', v)} />
            <Input label="Projects" value={settings.stats?.value?.projects} onChange={v => updateSetting('stats', 'projects', v)} />
            <Input label="Satisfaction %" value={settings.stats?.value?.satisfaction} onChange={v => updateSetting('stats', 'satisfaction', v)} />
            <Input label="Hours" value={settings.stats?.value?.hours} onChange={v => updateSetting('stats', 'hours', v)} />
          </div>
          <div style={{ marginTop: '16px' }}><Btn onClick={async () => { await saveSetting('awards', settings.awards?.value); await saveSetting('stats', settings.stats?.value) }} disabled={saving} fullWidth>Save Awards & Stats</Btn></div>
        </Section>

        {/* ═══ SERVICES ═══ */}
        <Section title="🎬 Services" badge={services.length}>
          {services.map((s, i) => (
            <div key={s.id} style={{ backgroundColor: '#0d0d0d', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: `1px solid ${border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '10px', marginBottom: '10px' }}>
                <Input label="No." value={s.number} onChange={v => { const u = [...services]; u[i].number = parseInt(v) || 0; setServices(u) }} />
                <Input label="Title" value={s.title} onChange={v => { const u = [...services]; u[i].title = v; setServices(u) }} />
              </div>
              <Input label="Description" value={s.description} onChange={v => { const u = [...services]; u[i].description = v; setServices(u) }} multiline />
              <div style={{ marginTop: '10px' }}><Input label="Tags (comma)" value={s.tags?.join(', ')} onChange={v => { const u = [...services]; u[i].tags = v.split(',').map(t => t.trim()).filter(Boolean); setServices(u) }} /></div>
              <div style={{ marginTop: '10px' }}>
                <ImageUploader value={s.image_url} folder="services" label={`Service image`} height="120px"
                  onUpload={url => { const u = [...services]; u[i] = { ...u[i], image_url: url }; setServices(u); saveRow('services', u[i]) }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <Btn onClick={() => saveRow('services', services[i])} small disabled={saving}>Save</Btn>
                <Btn onClick={() => deleteRow('services', s.id)} variant="danger" small>Delete</Btn>
              </div>
            </div>
          ))}
          <Btn onClick={() => saveRow('services', { title: 'New Service', description: '', number: services.length + 1, sort_order: services.length + 1, tags: [], is_active: true })}>+ Add Service</Btn>
        </Section>

        {/* ═══ PROJECTS ═══ */}
        <Section title="🖼️ Portfolio" badge={projects.length}>
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Portfolio Page Heading Image</p>
          <ImageUploader
            value={settings.portfolio?.value?.portfolio_image}
            folder="portfolio"
            label="Portfolio heading photo"
            onUpload={url => saveImage('portfolio', 'portfolio_image', url)}
          />
          <div style={{ marginTop: '20px' }} />
          {projects.map((p, i) => (
            <div key={p.id} style={{ backgroundColor: '#0d0d0d', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: `1px solid ${border}` }}>
              
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                <Input label="Title" value={p.title} onChange={v => { const u = [...projects]; u[i].title = v; setProjects(u) }} />
                <Input label="Slug (URL)" value={p.slug} onChange={v => { const u = [...projects]; u[i].slug = v; setProjects(u) }} placeholder="my-project-name" />
                <Input label="Category" value={p.category} onChange={v => { const u = [...projects]; u[i].category = v; setProjects(u) }} />
                <Input label="Client" value={p.client} onChange={v => { const u = [...projects]; u[i].client = v; setProjects(u) }} />
                <Input label="Location" value={p.location} onChange={v => { const u = [...projects]; u[i].location = v; setProjects(u) }} />
              </div>
              <div style={{ marginTop: '10px' }}>
                <Input label="Description" value={p.description} onChange={v => { const u = [...projects]; u[i].description = v; setProjects(u) }} multiline />
              </div>

              {/* Cover + Project Video */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Cover Image</p>
                  <ImageUploader value={p.cover_image} folder="portfolio" label="Cover" height="140px"
                    onUpload={url => { const u = [...projects]; u[i] = { ...u[i], cover_image: url }; setProjects(u); saveRow('projects', u[i]) }} />
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: gray, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cover Aspect Ratio</p>
                    <select
                      value={p.cover_aspect_ratio || 'auto'}
                      onChange={e => { const u = [...projects]; u[i] = { ...u[i], cover_aspect_ratio: e.target.value }; setProjects(u) }}
                      style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '12px', color: white, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '6px', padding: '8px', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = accent}
                      onBlur={e => e.target.style.borderColor = border}
                    >
                      <option value="auto">Auto (natural height)</option>
                      <option value="4/5">4:5 — Portrait</option>
                      <option value="3/4">3:4 — Portrait tall</option>
                      <option value="2/3">2:3 — Classic portrait</option>
                      <option value="1/1">1:1 — Square</option>
                      <option value="3/2">3:2 — Landscape</option>
                      <option value="16/9">16:9 — Widescreen</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: '#a855f7', margin: '0 0 6px', textTransform: 'uppercase' }}>🎬 BTS Video (Behind The Scenes)</p>
                  <VideoUploader value={p.video_url} label="Upload BTS video" height="140px"
                    onUpload={url => { const u = [...projects]; u[i] = { ...u[i], video_url: url }; setProjects(u); saveRow('projects', u[i]) }} />
                </div>
              </div>

              {/* Animation Style */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gallery Animation</p>
                  <select
                    value={p.gallery_animation || 'parallax'}
                    onChange={e => { const u = [...projects]; u[i].gallery_animation = e.target.value; setProjects(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '13px', color: white, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '8px', padding: '10px 14px', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = accent}
                    onBlur={e => e.target.style.borderColor = border}
                  >
                    <option value="parallax">Parallax Stack</option>
                    <option value="cinematic">Cinematic Reveal</option>
                  </select>
                </div>
                <div>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image Display Style</p>
                  <select
                    value={p.image_display_style || 'parallax'}
                    onChange={e => { const u = [...projects]; u[i].image_display_style = e.target.value; setProjects(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '13px', color: white, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '8px', padding: '10px 14px', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = accent}
                    onBlur={e => e.target.style.borderColor = border}
                  >
                    <option value="parallax">Parallax Grid</option>
                    <option value="circular">Circular Gallery</option>
                    <option value="stack">Stack</option>
                    <option value="infinite">Infinite Menu</option>
                  </select>
                </div>
              </div>

              {/* Gallery Videos */}
              <div style={{ marginTop: '14px' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: '#a855f7', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎬 Gallery Videos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: (p.gallery_videos || []).length > 2 ? '560px' : 'none', overflowY: (p.gallery_videos || []).length > 2 ? 'auto' : 'visible', paddingRight: (p.gallery_videos || []).length > 2 ? '4px' : '0' }}>
                  {(p.gallery_videos || []).map((vid, vi) => (
                    <div key={vi} style={{ backgroundColor: '#0a0a0a', borderRadius: '10px', padding: '12px', border: `1px solid ${border}` }}>
                      <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: '#a855f7', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎬 Video {vi + 1}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {/* Left col — upload + URL */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <VideoUploader
                            value={vid.url}
                            label="Upload video"
                            height="110px"
                            onUpload={url => {
                              const u = [...projects]
                              const vids = [...(u[i].gallery_videos || [])]
                              vids[vi] = { ...vids[vi], url }
                              u[i] = { ...u[i], gallery_videos: vids }
                              setProjects(u)
                              saveRow('projects', u[i])
                            }}
                          />
                          <div>
                            <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: gray, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>— OR — YouTube / Vimeo URL</p>
                            <input
                              value={vid.embed_url || ''}
                              placeholder="https://youtu.be/..."
                              onChange={e => {
                                const u = [...projects]
                                const vids = [...(u[i].gallery_videos || [])]
                                vids[vi] = { ...vids[vi], embed_url: e.target.value }
                                u[i] = { ...u[i], gallery_videos: vids }
                                setProjects(u)
                              }}
                              style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '12px', color: white, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '6px', padding: '8px', outline: 'none', boxSizing: 'border-box' }}
                              onFocus={e => e.target.style.borderColor = '#a855f7'}
                              onBlur={e => e.target.style.borderColor = border}
                            />
                            {vid.embed_url && (
                              <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: '#00c200', margin: '4px 0 0' }}>✓ Embed URL set</p>
                            )}
                          </div>
                        </div>
                        {/* Right col — aspect ratio */}
                        <div style={{ backgroundColor: '#111', borderRadius: '8px', padding: '10px', border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>📐 Aspect Ratio</p>
                          <select
                            value={vid.aspect_ratio || '16:9'}
                            onChange={e => {
                              const u = [...projects]
                              const vids = [...(u[i].gallery_videos || [])]
                              vids[vi] = { ...vids[vi], aspect_ratio: e.target.value }
                              u[i] = { ...u[i], gallery_videos: vids }
                              setProjects(u)
                            }}
                            style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '12px', color: white, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '6px', padding: '8px', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = accent}
                            onBlur={e => e.target.style.borderColor = border}
                          >
                            <option value="16:9">16:9 — Widescreen</option>
                            <option value="4:3">4:3 — Classic</option>
                            <option value="3:2">3:2 — Landscape</option>
                            <option value="1:1">1:1 — Square</option>
                            <option value="4:5">4:5 — Portrait</option>
                            <option value="3:4">3:4 — Tall Portrait</option>
                            <option value="2:3">2:3 — Classic Portrait</option>
                            <option value="9:16">9:16 — Vertical</option>
                            <option value="21:9">21:9 — Ultrawide</option>
                          </select>
                          {/* Visual ratio preview */}
                          {(() => {
                            const ratioMap = { '16:9':'16/9','4:3':'4/3','3:2':'3/2','1:1':'1/1','4:5':'4/5','3:4':'3/4','2:3':'2/3','9:16':'9/16','21:9':'21/9' }
                            const css = ratioMap[vid.aspect_ratio || '16:9'] || '16/9'
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
                                <div style={{ aspectRatio: css, height: css.split('/')[0] < css.split('/')[1] ? '48px' : '32px', maxWidth: '64px', backgroundColor: '#a855f722', border: '1px solid #a855f7', borderRadius: '4px' }} />
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <Btn onClick={async () => {
                          const u = [...projects]
                          u[i] = { ...u[i], gallery_videos: (u[i].gallery_videos || []).filter((_, idx) => idx !== vi) }
                          setProjects(u)
                          await saveRow('projects', u[i])
                        }} variant="danger" small>Remove Video {vi + 1}</Btn>
                      </div>
                    </div>
                  ))}
                  <Btn variant="ghost" small onClick={() => {
                    const u = [...projects]
                    u[i] = { ...u[i], gallery_videos: [...(u[i].gallery_videos || []), { url: '', aspect_ratio: '16:9' }] }
                    setProjects(u)
                  }}>+ Add Gallery Video</Btn>
                </div>
              </div>

              {/* Gallery Images — up to 8 */}
              <div style={{ marginTop: '14px' }}>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: accent, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📷 Gallery Images (max 8)</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {(p.gallery_images || []).slice(0, 8).map((img, gi) => {
                    const imgUrl = typeof img === 'string' ? img : img?.url
                    const imgRatio = typeof img === 'object' ? img?.aspect_ratio : '16:9'
                    return (
                      <div key={gi} style={{ backgroundColor: '#0a0a0a', borderRadius: '10px', border: `1px solid ${border}`, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📷 Image {gi + 1}</p>
                          <Btn onClick={async () => {
                            const u = [...projects]
                            u[i] = { ...u[i], gallery_images: (u[i].gallery_images || []).filter((_, idx) => idx !== gi) }
                            setProjects(u)
                            await saveRow('projects', u[i])
                          }} variant="danger" small>×</Btn>
                        </div>
                        <ImageUploader
                          value={imgUrl}
                          folder="portfolio"
                          label={`Image ${gi + 1}`}
                          height="120px"
                          onUpload={url => {
                            const u = [...projects]
                            const imgs = [...(u[i].gallery_images || [])]
                            imgs[gi] = { ...normalizeGalleryImage(imgs[gi]), url, aspect_ratio: imgRatio || '16:9' }
                            u[i] = { ...u[i], gallery_images: imgs }
                            setProjects(u)
                            saveRow('projects', u[i])
                          }}
                        />
                        <div style={{ padding: '8px', backgroundColor: '#111', borderTop: `1px solid ${border}` }}>
                          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: accent, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>📐 Aspect Ratio</p>
                          <select
                            value={imgRatio || '16:9'}
                            onChange={e => {
                              const u = [...projects]
                              const imgs = [...(u[i].gallery_images || [])]
                              imgs[gi] = { ...normalizeGalleryImage(imgs[gi]), aspect_ratio: e.target.value }
                              u[i] = { ...u[i], gallery_images: imgs }
                              setProjects(u)
                            }}
                            style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '11px', color: white, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '4px', padding: '6px', outline: 'none' }}
                            onFocus={e => e.target.style.borderColor = accent}
                            onBlur={e => e.target.style.borderColor = border}
                          >
                            <option value="16:9">16:9 — Widescreen</option>
                            <option value="4:3">4:3 — Classic</option>
                            <option value="3:2">3:2 — Landscape</option>
                            <option value="1:1">1:1 — Square</option>
                            <option value="4:5">4:5 — Portrait</option>
                            <option value="3:4">3:4 — Tall Portrait</option>
                            <option value="2:3">2:3 — Classic Portrait</option>
                            <option value="9:16">9:16 — Vertical</option>
                            <option value="21:9">21:9 — Ultrawide</option>
                          </select>
                        </div>
                      </div>
                    )
                  })}
                  {(p.gallery_images || []).length < 8 && (
                    <div
                      onClick={() => {
                        const u = [...projects]
                        u[i] = { ...u[i], gallery_images: [...(u[i].gallery_images || []), { url: '', aspect_ratio: '16:9', span: 1 }] }
                        setProjects(u)
                      }}
                      style={{ height: '120px', borderRadius: '10px', border: `2px dashed ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = border}
                    >
                      <span style={{ fontSize: '20px', color: gray }}>📷</span>
                      <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray }}>+ Add Image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Layout Editor Canvas */}
              {['parallax', 'stack'].includes(p.image_display_style) &&
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <div
                    onClick={async () => {
                      const u = [...projects]
                      u[i] = { ...u[i], show_on_homepage: !u[i].show_on_homepage }
                      setProjects(u)
                      await saveRow('projects', u[i])
                    }}
                    style={{
                      width: '36px', height: '20px', borderRadius: '10px',
                      backgroundColor: p.show_on_homepage ? '#ff4d00' : '#333',
                      position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: p.show_on_homepage ? '19px' : '3px',
                      width: '14px', height: '14px', borderRadius: '50%',
                      backgroundColor: '#fff', transition: 'left 0.2s',
                    }} />
                  </div>
                  <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: p.show_on_homepage ? '#ff4d00' : '#888' }}>
                    Show on Homepage
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  <Btn onClick={() => saveRow('projects', projects[i])} small disabled={saving}>Save</Btn>
                  <Btn onClick={() => deleteRow('projects', p.id)} variant="danger" small>Delete</Btn>
                </div>
              </div>

            </div>
          ))}
          <Btn onClick={() => saveRow('projects', { title: 'New Project', slug: 'new-project-' + Date.now(), category: 'Photography', description: '', sort_order: projects.length + 1, is_active: true, gallery_animation: 'parallax', image_display_style: 'parallax', gallery_videos: [], gallery_images: [] })}>+ Add Project</Btn>
        </Section>

        {/* ═══ MY SHOTS ═══ */}
        <Section title="📸 My Shots" badge={shots.length}>
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>My Shots Page Heading Image</p>
          <ImageUploader
            value={settings.myshots?.value?.myshots_image}
            folder="myshots"
            label="My Shots heading photo"
            onUpload={url => saveImage('myshots', 'myshots_image', url)}
          />
          <div style={{ marginTop: '20px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {shots.map((s, i) => (
              <div key={s.id} style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${border}`, backgroundColor: '#0d0d0d' }}>
                {s.media_type === 'video' ? (
                  <VideoUploader value={s.video_url} label="Video" height="160px"
                    onUpload={url => { const u = [...shots]; u[i] = { ...u[i], video_url: url }; setShots(u); saveRow('my_shots', u[i]) }} />
                ) : (
                  <ImageUploader value={s.image_url} folder="shots" label="Photo" height="160px"
                    onUpload={url => { const u = [...shots]; u[i] = { ...u[i], image_url: url }; setShots(u); saveRow('my_shots', u[i]) }} />
                )}
                <div style={{ padding: '8px' }}>
                  <input value={s.title || ''} placeholder="Title" onChange={e => { const u = [...shots]; u[i].title = e.target.value; setShots(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '11px', color: white, backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '4px 0', borderBottom: `1px solid ${border}` }} />
                  <input value={s.category || ''} placeholder="Category / Tag" onChange={e => { const u = [...shots]; u[i].category = e.target.value; setShots(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '11px', color: accent, backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '4px 0', marginTop: '4px', borderBottom: `1px solid ${border}` }} />
                  <select value={s.aspect_ratio || '3/4'} onChange={e => { const u = [...shots]; u[i].aspect_ratio = e.target.value; setShots(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '10px', color: gray, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '4px', padding: '4px', marginTop: '6px', outline: 'none' }}>
                    <option value="3/4">Portrait (3:4)</option>
                    <option value="4/3">Landscape (4:3)</option>
                    <option value="1/1">Square (1:1)</option>
                    <option value="16/9">Wide (16:9)</option>
                    <option value="9/16">Vertical (9:16)</option>
                  </select>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    <Btn onClick={() => saveRow('my_shots', shots[i])} small>Save</Btn>
                    <Btn onClick={() => deleteRow('my_shots', s.id)} variant="danger" small>×</Btn>
                  </div>
                </div>
              </div>
            ))}
            {/* Add photo */}
            <div onClick={() => saveRow('my_shots', { title: '', category: '', image_url: '', media_type: 'image', sort_order: shots.length + 1, is_active: true, aspect_ratio: '3/4' })}
              style={{ height: '160px', borderRadius: '10px', border: `2px dashed ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = border}>
              <span style={{ fontSize: '20px', color: gray }}>📷</span>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray }}>+ Photo</span>
            </div>
            {/* Add video */}
            <div onClick={() => saveRow('my_shots', { title: '', category: '', video_url: '', media_type: 'video', sort_order: shots.length + 1, is_active: true, aspect_ratio: '16/9' })}
              style={{ height: '160px', borderRadius: '10px', border: `2px dashed #2d1f4e`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#a855f7'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2d1f4e'}>
              <span style={{ fontSize: '20px', color: '#a855f7' }}>🎬</span>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: '#a855f7' }}>+ Video</span>
            </div>
          </div>
        </Section>

        {/* ═══ FRAMES ═══ */}
        <Section title="🎬 Frames" badge={videos.length}>
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray, margin: '0 0 6px', textTransform: 'uppercase' }}>Frames Page Hero Video</p>
          <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: '#666', margin: '0 0 12px' }}>
            This video plays on loop behind the "FRAMES" headline on the /frames page.
          </p>
          <VideoUploader
            value={settings.frames?.value?.hero_video}
            label="Frames Hero Video"
            height="160px"
            onUpload={url => saveImage('frames', 'hero_video', url)}
          />
          {settings.frames?.value?.hero_video && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <Btn onClick={() => saveImage('frames', 'hero_video', '')} variant="danger" small>Remove Video</Btn>
              <a href={settings.frames?.value?.hero_video} target="_blank" rel="noopener"
                style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: '#a855f7', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Preview ↗
              </a>
            </div>
          )}
          <div style={{ marginTop: '20px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {videos.map((v, i) => (
              <div key={v.id} style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${border}`, backgroundColor: '#0d0d0d' }}>
                <VideoUploader value={v.video_url} label="Video" height="160px"
                  onUpload={url => { const u = [...videos]; u[i] = { ...u[i], video_url: url }; setVideos(u); saveRow('my_videos', u[i]) }} />
                <div style={{ padding: '8px' }}>
                  <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '10px', color: gray, margin: '0 0 4px', textTransform: 'uppercase' }}>Thumbnail override (optional)</p>
                  <ImageUploader value={v.thumb_url} folder="frames" label="Thumb" height="60px"
                    onUpload={url => { const u = [...videos]; u[i] = { ...u[i], thumb_url: url }; setVideos(u); saveRow('my_videos', u[i]) }} />
                  <input value={v.title || ''} placeholder="Title" onChange={e => { const u = [...videos]; u[i].title = e.target.value; setVideos(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '11px', color: white, backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '4px 0', borderBottom: `1px solid ${border}`, marginTop: '6px' }} />
                  <input value={v.category || ''} placeholder="Category / Tag" onChange={e => { const u = [...videos]; u[i].category = e.target.value; setVideos(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '11px', color: accent, backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '4px 0', marginTop: '4px', borderBottom: `1px solid ${border}` }} />
                  <select value={v.aspect_ratio || '16/9'} onChange={e => { const u = [...videos]; u[i].aspect_ratio = e.target.value; setVideos(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '10px', color: gray, backgroundColor: '#0d0d0d', border: `1px solid ${border}`, borderRadius: '4px', padding: '4px', marginTop: '6px', outline: 'none' }}>
                    <option value="16/9">Landscape (16:9)</option>
                    <option value="9/16">Portrait (9:16)</option>
                    <option value="1/1">Square (1:1)</option>
                    <option value="4/3">Standard (4:3)</option>
                    <option value="4/5">Instagram (4:5)</option>
                  </select>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    <Btn onClick={() => saveRow('my_videos', videos[i])} small>Save</Btn>
                    <Btn onClick={() => deleteRow('my_videos', v.id)} variant="danger" small>×</Btn>
                  </div>
                </div>
              </div>
            ))}
            <div onClick={() => saveRow('my_videos', { title: '', category: '', video_url: '', thumb_url: '', aspect_ratio: '16/9', sort_order: videos.length + 1, is_active: true })}
              style={{ height: '160px', borderRadius: '10px', border: `2px dashed ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = border}>
              <span style={{ fontSize: '20px', color: gray }}>🎬</span>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray }}>+ Frame</span>
            </div>
          </div>
        </Section>

        {/* ═══ REVIEWS ═══ */}
        <Section title="⭐ Reviews" badge={reviews.length}>
          {reviews.map((r, i) => (
            <div key={r.id} style={{ backgroundColor: '#0d0d0d', borderRadius: '12px', padding: '14px', marginBottom: '10px', border: `1px solid ${border}` }}>
              <Input label="Quote" value={r.quote} onChange={v => { const u = [...reviews]; u[i].quote = v; setReviews(u) }} multiline />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '10px' }}>
                <Input label="Name" value={r.name} onChange={v => { const u = [...reviews]; u[i].name = v; setReviews(u) }} />
                <Input label="Role" value={r.role} onChange={v => { const u = [...reviews]; u[i].role = v; setReviews(u) }} />
                <Input label="Rating" value={r.rating} onChange={v => { const u = [...reviews]; u[i].rating = parseInt(v) || 5; setReviews(u) }} />
              </div>
              <div style={{ marginTop: '10px' }}>
                <ImageUploader value={r.avatar_url} folder="reviews" label="Avatar" height="70px"
                  onUpload={url => { const u = [...reviews]; u[i] = { ...u[i], avatar_url: url }; setReviews(u); saveRow('reviews', u[i]) }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <Btn onClick={() => saveRow('reviews', reviews[i])} small>Save</Btn>
                <Btn onClick={() => deleteRow('reviews', r.id)} variant="danger" small>Delete</Btn>
              </div>
            </div>
          ))}
          <Btn onClick={() => saveRow('reviews', { quote: 'New review...', name: 'Client', role: 'Role', rating: 5, sort_order: reviews.length + 1, is_active: true })}>+ Add Review</Btn>
        </Section>

        {/* ═══ FAQs ═══ */}
        <Section title="❓ FAQs" badge={faqs.length}>
          {faqs.map((f, i) => (
            <div key={f.id} style={{ backgroundColor: '#0d0d0d', borderRadius: '12px', padding: '14px', marginBottom: '10px', border: `1px solid ${border}` }}>
              <Input label="Question" value={f.question} onChange={v => { const u = [...faqs]; u[i].question = v; setFaqs(u) }} />
              <div style={{ marginTop: '10px' }}><Input label="Answer" value={f.answer} onChange={v => { const u = [...faqs]; u[i].answer = v; setFaqs(u) }} multiline /></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <Btn onClick={() => saveRow('faqs', faqs[i])} small>Save</Btn>
                <Btn onClick={() => deleteRow('faqs', f.id)} variant="danger" small>Delete</Btn>
              </div>
            </div>
          ))}
          <Btn onClick={() => saveRow('faqs', { question: 'New question?', answer: 'Answer...', sort_order: faqs.length + 1, is_active: true })}>+ Add FAQ</Btn>
        </Section>

        {/* ═══ COLLABORATIONS ═══ */}
        <Section title="🤝 Collaborations" badge={collabs.length}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {collabs.map((c, i) => (
              <div key={c.id} style={{ backgroundColor: '#0d0d0d', borderRadius: '10px', padding: '10px', border: `1px solid ${border}` }}>
                <ImageUploader value={c.logo_url} folder="collabs" label="Logo" height="80px"
                  onUpload={url => { const u = [...collabs]; u[i] = { ...u[i], logo_url: url }; setCollabs(u); saveRow('collaborations', u[i]) }} />
                <div style={{ marginTop: '8px' }}>
                  <input value={c.name || ''} placeholder="Brand name" onChange={e => { const u = [...collabs]; u[i] = { ...u[i], name: e.target.value }; setCollabs(u) }}
                    style={{ width: '100%', fontFamily: '"Geist",sans-serif', fontSize: '11px', color: white, backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '4px 0', borderBottom: `1px solid ${border}` }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  <Btn onClick={() => saveRow('collaborations', collabs[i])} small>Save</Btn>
                  <Btn onClick={() => deleteRow('collaborations', c.id)} variant="danger" small>×</Btn>
                </div>
              </div>
            ))}
            <div onClick={() => saveRow('collaborations', { name: 'Brand', logo_url: '', is_active: true, sort_order: collabs.length + 1 })}
              style={{ height: '80px', borderRadius: '10px', border: `2px dashed ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', transition: 'border-color 0.2s', marginTop: '2px' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = border}>
              <span style={{ fontSize: '20px', color: gray }}>🤝</span>
              <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '11px', color: gray }}>+ Add Brand</span>
            </div>
          </div>
        </Section>

        {/* ═══ MESSAGES ═══ */}
        <Section title="📨 Messages" badge={messages.length}>
          {messages.length === 0 ? <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: gray }}>No messages yet.</p> : (
            messages.map(m => (
              <div key={m.id} style={{ backgroundColor: '#0d0d0d', borderRadius: '10px', padding: '14px', marginBottom: '8px', border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '15px', fontWeight: 500, color: white }}>{m.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: '"Geist",sans-serif', fontSize: '12px', color: gray }}>{new Date(m.created_at).toLocaleDateString()}</span>
                    <Btn onClick={() => deleteRow('contact_messages', m.id)} variant="danger" small>Delete</Btn>
                  </div>
                </div>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '13px', color: accent, margin: '0 0 6px' }}>{m.email}</p>
                <p style={{ fontFamily: '"Geist",sans-serif', fontSize: '14px', color: '#ccc', margin: 0, lineHeight: 1.5 }}>{m.message}</p>
              </div>
            ))
          )}
        </Section>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  )
}