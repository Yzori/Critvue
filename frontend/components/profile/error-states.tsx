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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4">
      <motion.div
        className="max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          {/* Error Icon */}
          <motion.div
            className="inline-flex items-center justify-center size-20 rounded-full bg-red-100 mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
          >
            <AlertCircle className="size-10 text-red-600" />
          </motion.div>

          {/* Error Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">{title}</h1>

          {/* Error Message */}
          <p className="text-base text-gray-600 leading-relaxed mb-8">{message}</p>

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
      className="p-12 rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200/50 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="size-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-peach/20 flex items-center justify-center">
        <AlertCircle className="size-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {isOwnProfile ? "No Portfolio Items Yet" : "No Portfolio Items"}
      </h3>
      <p className="text-gray-600 mb-6">
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
      className="p-4 rounded-xl bg-red-50 border-2 border-red-200"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-800 font-medium">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-semibold text-red-700 hover:text-red-900 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
