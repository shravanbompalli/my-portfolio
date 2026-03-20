import { useRef } from 'react'

/*
  useReveal — keeps all existing components visible
  Returns [ref, true] so opacity: vis ? 1 : 0.001 always shows content.
  
  Individual components will be migrated to framer-motion's
  whileInView one by one. This hook is just a compatibility shim.
*/

export default function useReveal() {
  const ref = useRef(null)
  return [ref, true]
}