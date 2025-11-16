/**
 * Expert Application Status Page
 * Shows application status for users who have already applied
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Home,
  AlertCircle,
  Calendar
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

interface Application {
  id: string
  application_number: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn'
  target_tier: string
  created_at: string
  submitted_at?: string
  decision_made_at?: string
  approved_tier?: string
}

export default function ApplicationStatusPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/apply/expert/status')
      return
    }

    // Fetch application status
    fetch('http://localhost:8000/api/v1/expert-applications/me/status', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setApplication(data)
        setLoading(false)

        // If no application, redirect to apply page
        if (!data) {
          router.push('/apply/expert')
        }
      })
      .catch(err => {
        console.error('Failed to fetch application status:', err)
        setLoading(false)
      })
  }, [isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent mx-auto mb-4" />
          <p className="text-foreground-muted">Loading application status...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return null // Will redirect
  }

  const getStatusConfig = (status: Application['status']) => {
    switch (status) {
      case 'submitted':
      case 'under_review':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Under Review',
          description: 'Your application is being reviewed by our team.'
        }
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Approved',
          description: 'Congratulations! Your application has been approved.'
        }
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Not Approved',
          description: 'Unfortunately, we are unable to approve your application at this time.'
        }
      case 'draft':
        return {
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Draft',
          description: 'Your application has not been submitted yet.'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: status,
          description: 'Application status'
        }
    }
  }

  const statusConfig = getStatusConfig(application.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--accent-blue)]/10 to-[var(--accent-peach)]/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="glass-heavy p-8 sm:p-12">
          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${statusConfig.bgColor}`}
          >
            <StatusIcon className={`h-12 w-12 ${statusConfig.color}`} />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-center text-3xl font-bold text-foreground sm:text-4xl"
          >
            Application {statusConfig.label}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 text-center text-lg text-foreground-muted"
          >
            {statusConfig.description}
          </motion.p>

          {/* Application Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 space-y-4"
          >
            {/* Application Number */}
            <div className="rounded-lg bg-[var(--accent-blue)]/10 p-4 text-center">
              <div className="mb-1 text-sm text-foreground-muted">Application ID</div>
              <div className="font-mono text-xl font-bold text-[var(--accent-blue)]">
                {application.application_number}
              </div>
            </div>

            {/* Timeline */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-foreground-muted" />
                  <div className="text-sm text-foreground-muted">Created</div>
                </div>
                <div className="text-sm font-medium">
                  {format(new Date(application.created_at), 'MMM d, yyyy')}
                </div>
              </div>

              {application.submitted_at && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-foreground-muted" />
                    <div className="text-sm text-foreground-muted">Submitted</div>
                  </div>
                  <div className="text-sm font-medium">
                    {format(new Date(application.submitted_at), 'MMM d, yyyy')}
                  </div>
                </div>
              )}

              {application.decision_made_at && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-foreground-muted" />
                    <div className="text-sm text-foreground-muted">Decision</div>
                  </div>
                  <div className="text-sm font-medium">
                    {format(new Date(application.decision_made_at), 'MMM d, yyyy')}
                  </div>
                </div>
              )}
            </div>

            {/* Target Tier */}
            <div className="rounded-lg border border-border p-4">
              <div className="text-sm text-foreground-muted mb-2">
                {application.approved_tier ? 'Approved Tier' : 'Target Tier'}
              </div>
              <Badge variant="default" className="text-base">
                {application.approved_tier || application.target_tier}
              </Badge>
            </div>
          </motion.div>

          {/* Status-specific content */}
          {(application.status === 'submitted' || application.status === 'under_review') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 rounded-lg bg-blue-50 border border-blue-200 p-6"
            >
              <h3 className="mb-3 font-semibold text-foreground">What's Next?</h3>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>Our team typically reviews applications within 3-5 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>You'll receive an email notification with our decision</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>Check back here anytime to see your status</span>
                </li>
              </ul>
            </motion.div>
          )}

          {application.status === 'approved' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 rounded-lg bg-green-50 border border-green-200 p-6"
            >
              <h3 className="mb-3 font-semibold text-foreground">Next Steps</h3>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span>Check your email for onboarding instructions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span>Complete the reviewer training program</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span>Start reviewing and earning</span>
                </li>
              </ul>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col gap-3"
          >
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center text-sm text-foreground-muted"
          >
            Questions? Contact us at{' '}
            <a
              href="mailto:experts@critvue.com"
              className="text-[var(--accent-blue)] hover:underline"
            >
              experts@critvue.com
            </a>
          </motion.p>
        </Card>
      </motion.div>
    </div>
  )
}
