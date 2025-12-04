/**
 * Profile Error States
 * Brand-compliant error handling components
 */

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

/**
 * Generic Error State Component
 */
export function ErrorState({ title, message, onRetry, showHomeButton = false }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-muted flex items-center justify-center px-4">
      <motion.div
        className="max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          {/* Error Icon */}
          <motion.div
            className="inline-flex items-center justify-center size-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
          >
            <AlertCircle className="size-10 text-red-600 dark:text-red-400" />
          </motion.div>

          {/* Error Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-3">{title}</h1>

          {/* Error Message */}
          <p className="text-base text-muted-foreground leading-relaxed mb-8">{message}</p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button size="lg" onClick={onRetry} className="min-h-[48px]">
                <RefreshCw className="size-4 mr-2" />
                Try Again
              </Button>
            )}
            {showHomeButton && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => (window.location.href = "/dashboard")}
                className="min-h-[48px]"
              >
                <Home className="size-4 mr-2" />
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Profile Not Found Error
 */
export function ProfileNotFoundError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Profile Not Found"
      message="The profile you're looking for doesn't exist or has been removed. Please check the URL and try again."
      onRetry={onRetry}
      showHomeButton
    />
  );
}

/**
 * Profile Load Error
 */
export function ProfileLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      title="Failed to Load Profile"
      message="We couldn't load this profile. This might be a temporary issue. Please try again."
      onRetry={onRetry}
      showHomeButton
    />
  );
}

/**
 * Authentication Required Error
 */
export function AuthenticationRequiredError() {
  return (
    <ErrorState
      title="Authentication Required"
      message="You need to be logged in to view this profile. Please sign in to continue."
      showHomeButton
    />
  );
}

/**
 * Network Error
 */
export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      title="Connection Problem"
      message="We're having trouble connecting to the server. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  );
}

/**
 * Empty Portfolio State
 */
export function EmptyPortfolioState({ isOwnProfile }: { isOwnProfile: boolean }) {
  return (
    <motion.div
      className="p-12 rounded-2xl bg-gradient-to-br from-muted to-background border-2 border-border/50 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="size-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-peach/20 flex items-center justify-center">
        <AlertCircle className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        {isOwnProfile ? "No Portfolio Items Yet" : "No Portfolio Items"}
      </h3>
      <p className="text-muted-foreground mb-6">
        {isOwnProfile
          ? "Start building your portfolio by adding your first project."
          : "This user hasn't added any portfolio items yet."}
      </p>
      {isOwnProfile && (
        <Button size="lg" className="min-h-[48px]">
          Add Your First Project
        </Button>
      )}
    </motion.div>
  );
}

/**
 * Inline Error Alert
 * For displaying errors within sections
 */
export function InlineErrorAlert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-semibold text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
