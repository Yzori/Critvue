/**
 * Auto-Save Indicator
 * Visual indicator showing save status with animations
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, CloudOff, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAutoSave } from '@/lib/expert-application/auto-save'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

interface AutoSaveIndicatorProps {
  className?: string
}

export function AutoSaveIndicator({ className = '' }: AutoSaveIndicatorProps) {
  const { isSaving, lastSavedAt } = useAutoSave(false) // Set to true to enable API saves
  const isDirty = useExpertApplicationStore((state) => state.isDirty)

  const getSaveStatus = () => {
    if (isSaving || isDirty) {
      return {
        icon: Cloud,
        text: 'Saving...',
        color: 'text-[var(--accent-blue)]'
      }
    }

    if (lastSavedAt) {
      return {
        icon: Check,
        text: `Saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`,
        color: 'text-green-600'
      }
    }

    return {
      icon: CloudOff,
      text: 'Not saved',
      color: 'text-foreground-muted'
    }
  }

  const status = getSaveStatus()
  const Icon = status.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={status.text}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          <Icon className={`h-4 w-4 ${status.color}`} />
          <span className={`text-sm ${status.color}`}>{status.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
