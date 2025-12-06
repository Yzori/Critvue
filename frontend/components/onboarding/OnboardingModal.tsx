"use client";

/**
 * Onboarding Modal Component
 *
 * Displayed after user registration to collect primary interest
 * and optionally list them in the reviewer directory.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Palette,
  MessageSquare,
  Users,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { completeOnboarding, type PrimaryInterest } from "@/lib/api/onboarding";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface InterestOption {
  value: PrimaryInterest;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const interestOptions: InterestOption[] = [
  {
    value: "creator",
    title: "I'm a Creator",
    description: "I want to get expert feedback on my creative work",
    icon: <Palette className="size-6" />,
  },
  {
    value: "reviewer",
    title: "I'm a Reviewer",
    description: "I want to help others improve and share my expertise",
    icon: <MessageSquare className="size-6" />,
  },
  {
    value: "both",
    title: "I'm Both",
    description: "I want to give and receive feedback from the community",
    icon: <Users className="size-6" />,
  },
];

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedInterest, setSelectedInterest] = useState<PrimaryInterest | null>(null);
  const [listAsReviewer, setListAsReviewer] = useState(false);
  const [reviewerTagline, setReviewerTagline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInterestSelect = (interest: PrimaryInterest) => {
    setSelectedInterest(interest);

    // If they select "creator" only, skip the reviewer listing step
    if (interest === "creator") {
      handleComplete(interest, false, "");
    } else {
      // For "reviewer" or "both", ask about directory listing
      setStep(2);
    }
  };

  const handleComplete = async (
    interest: PrimaryInterest,
    listReviewer: boolean,
    tagline: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await completeOnboarding({
        primaryInterest: interest,
        listAsReviewer: listReviewer,
        reviewerTagline: tagline || undefined,
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const handleStep2Submit = () => {
    if (!selectedInterest) return;
    handleComplete(selectedInterest, listAsReviewer, reviewerTagline);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl text-center">
                  Welcome to Critvue!
                </DialogTitle>
                <DialogDescription className="text-center">
                  What brings you here today?
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-3">
                {interestOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleInterestSelect(option.value)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-accent-blue hover:bg-accent-blue/5 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex-shrink-0 p-2 rounded-lg bg-muted group-hover:bg-accent-blue/10 transition-colors">
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {option.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                    <ArrowRight className="size-5 text-muted-foreground group-hover:text-accent-blue transition-colors" />
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-4 text-sm text-destructive text-center">
                  {error}
                </p>
              )}

              {isLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">Setting up your account...</span>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl text-center">
                  Join the Reviewer Directory
                </DialogTitle>
                <DialogDescription className="text-center">
                  Get discovered by creators looking for expert feedback
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                {/* List as reviewer toggle */}
                <label className="flex items-start gap-4 p-4 rounded-lg border border-border cursor-pointer hover:border-accent-blue transition-colors">
                  <input
                    type="checkbox"
                    checked={listAsReviewer}
                    onChange={(e) => setListAsReviewer(e.target.checked)}
                    className="mt-1 size-5 rounded border-border text-accent-blue focus:ring-accent-blue focus:ring-offset-0"
                  />
                  <div>
                    <div className="font-medium text-foreground">
                      List me in the reviewer directory
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Let creators find and request reviews from you
                    </div>
                  </div>
                </label>

                {/* Tagline input - only show if listing */}
                <AnimatePresence>
                  {listAsReviewer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block">
                        <span className="text-sm font-medium text-foreground">
                          Your tagline (optional)
                        </span>
                        <input
                          type="text"
                          value={reviewerTagline}
                          onChange={(e) => setReviewerTagline(e.target.value)}
                          placeholder="e.g., UI/UX expert with 10 years experience"
                          maxLength={200}
                          className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {reviewerTagline.length}/200 characters
                        </p>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Benefits */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span>Earn karma and build your reputation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span>Connect with talented creators</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span>You can change this anytime in settings</span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-destructive text-center">
                  {error}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleStep2Submit}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
