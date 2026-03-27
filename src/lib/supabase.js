import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing Supabase config: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

/**
 * Returns a Supabase image transform URL for server-side resizing.
 * Only rewrites Supabase storage URLs — Cloudinary/external URLs pass through unchanged.
 * quality=85 keeps photography-grade fidelity at ~40-60% smaller file size.
 */
export function sbImg(imgUrl, width, quality = 85) {
  if (!imgUrl || !imgUrl.includes('/storage/v1/object/public/')) return imgUrl
  return imgUrl
    .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    + `?width=${width}&quality=${quality}`
}
