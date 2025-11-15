/**
 * Step 1: Welcome & Introduction
 * Value proposition, what to expect, and estimated time
 */

'use client'

import { motion } from 'framer-motion'
import { Sparkles, Clock, CheckCircle2, Users, Award, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getAnimationDuration } from '@/lib/expert-application/auto-save'

export function Step1Welcome() {
  const animDuration = getAnimationDuration(0.5)

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animDuration }}
      >
        {/* Hero card */}
        <Card className="glass-medium mb-8 overflow-hidden border-2 border-[var(--accent-blue)]/20 p-8 sm:p-12">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-blue)]/10 to-[var(--accent-peach)]/10" />

          <div className="relative z-10 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-peach)] shadow-lg"
            >
              <Sparkles className="h-10 w-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: animDuration }}
              className="mb-4 text-4xl font-bold text-foreground sm:text-5xl"
            >
              Join Our Expert Reviewer Community
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: animDuration }}
              className="text-lg text-foreground-muted sm:text-xl"
            >
              Share your expertise, help others improve, and earn while doing it
            </motion.p>
          </div>
        </Card>

        {/* Benefits grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <BenefitCard
            icon={Award}
            title="Get Recognized"
            description="Build your reputation as a trusted expert"
            delay={0.5}
          />
          <BenefitCard
            icon={Zap}
            title="Flexible Schedule"
            description="Review on your own time, anywhere"
            delay={0.6}
          />
          <BenefitCard
            icon={Users}
            title="Join Community"
            description="Connect with fellow professionals"
            delay={0.7}
          />
        </div>

        {/* What to expect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: animDuration }}
          className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 sm:p-8"
        >
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
            <CheckCircle2 className="h-6 w-6 text-[var(--accent-blue)]" />
            What to Expect
          </h2>

          <ul className="space-y-4">
            <ExpectationItem
              number={1}
              text="Share your professional background and expertise"
            />
            <ExpectationItem
              number={2}
              text="Upload 3-5 work samples showcasing your skills"
            />
            <ExpectationItem
              number={3}
              text="Provide professional references"
            />
            <ExpectationItem
              number={4}
              text="Complete a sample review to demonstrate your abilities"
            />
          </ul>

          {/* Time estimate */}
          <div className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-blue)]/10 p-4">
            <Clock className="h-5 w-5 text-[var(--accent-blue)]" />
            <span className="font-medium text-foreground">
              Estimated time: 15-20 minutes
            </span>
          </div>

          {/* Auto-save notice */}
          <p className="mt-4 text-center text-sm text-foreground-muted">
            Your progress is saved automatically. You can exit and resume anytime.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

interface BenefitCardProps {
  icon: React.ElementType
  title: string
  description: string
  delay: number
}

function BenefitCard({ icon: Icon, title, description, delay }: BenefitCardProps) {
  const animDuration = getAnimationDuration(0.5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: animDuration }}
    >
      <Card className="glass-light h-full p-6 text-center transition-transform hover:scale-105">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-blue)]/10">
          <Icon className="h-6 w-6 text-[var(--accent-blue)]" />
        </div>
        <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-foreground-muted">{description}</p>
      </Card>
    </motion.div>
  )
}

interface ExpectationItemProps {
  number: number
  text: string
}

function ExpectationItem({ number, text }: ExpectationItemProps) {
  return (
    <li className="flex items-start gap-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)] text-sm font-bold text-white">
        {number}
      </div>
      <span className="pt-1 text-foreground">{text}</span>
    </li>
  )
}
