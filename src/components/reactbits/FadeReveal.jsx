import { motion } from 'framer-motion'

/**
 * FadeReveal — simple Framer Motion scroll-triggered reveal wrapper.
 * Drop in any children; they fade + slide up when they enter the viewport.
 */
export default function FadeReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.7,
  y = 40,
  once = true,
  style,
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ type: 'spring', stiffness: 60, damping: 14, mass: 0.8, delay }}
    >
      {children}
    </motion.div>
  )
}
