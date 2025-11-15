/**
 * Celebration Modal
 * Shows confetti and encouraging message at milestones
 */

'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { PartyPopper, Sparkles } from 'lucide-react'
import { vibrate, vibrationPatterns, prefersReducedMotion } from '@/lib/expert-application/auto-save'

interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  type: '50-percent' | '100-percent'
}

const celebrationContent = {
  '50-percent': {
    title: "Halfway There!",
    icon: Sparkles,
    message: "You're doing great! Just 4 more steps to go.",
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 to-yellow-500/20'
  },
  '100-percent': {
    title: "Application Submitted!",
    icon: PartyPopper,
    message: "Thank you for applying to become a Critvue expert reviewer.",
    color: 'text-green-500',
    bgGradient: 'from-green-500/20 to-emerald-500/20'
  }
}

export function CelebrationModal({ isOpen, onClose, type }: CelebrationModalProps) {
  const content = celebrationContent[type]
  const Icon = content.icon

  useEffect(() => {
    if (isOpen) {
      // Haptic feedback
      if (type === '100-percent') {
        vibrate(vibrationPatterns.celebration)
      } else {
        vibrate(vibrationPatterns.success)
      }

      // Confetti animation
      if (!prefersReducedMotion()) {
        if (type === '100-percent') {
          // Large celebration
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.5 },
            colors: ['#00C853', '#64DD17', '#76FF03'],
            ticks: 300,
            gravity: 0.8,
            scalar: 1.2
          })

          // Second burst
          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#00C853', '#64DD17', '#76FF03']
            })
            confetti({
              particleCount: 100,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#00C853', '#64DD17', '#76FF03']
            })
          }, 250)
        } else {
          // Medium celebration for 50%
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFA500', '#FFD700', '#FF8C00'],
            ticks: 200
          })
        }
      }

      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, type, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br ${content.bgGradient} p-8 shadow-2xl`}
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xl" />

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Icon */}
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1
                  }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-white to-gray-100 shadow-lg"
                >
                  <Icon className={`h-10 w-10 ${content.color}`} />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4 text-3xl font-bold text-foreground"
                >
                  {content.title}
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-foreground-muted"
                >
                  {content.message}
                </motion.p>

                {/* Additional info for 100% */}
                {type === '100-percent' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 space-y-2 text-left"
                  >
                    <p className="flex items-start gap-2 text-sm text-foreground-muted">
                      <span className="text-green-600">✓</span>
                      <span>We'll review your application (3-5 days)</span>
                    </p>
                    <p className="flex items-start gap-2 text-sm text-foreground-muted">
                      <span className="text-green-600">✓</span>
                      <span>You'll receive an email with next steps</span>
                    </p>
                    <p className="flex items-start gap-2 text-sm text-foreground-muted">
                      <span className="text-green-600">✓</span>
                      <span>Selected applicants will be invited to onboarding</span>
                    </p>
                  </motion.div>
                )}

                {/* Close hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="mt-6 text-xs text-foreground-muted"
                >
                  Tap anywhere to continue
                </motion.p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
