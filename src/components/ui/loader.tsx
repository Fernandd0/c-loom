'use client'

import { motion } from 'framer-motion'

export function Loader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <motion.div
        className="relative h-12 w-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-(--line)"
          style={{ borderTopColor: 'transparent' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-[#8E8E93]"
          style={{
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    </div>
  )
}
