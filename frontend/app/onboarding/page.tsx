"use client";

/**
 * Onboarding Page
 *
 * A comprehensive intermediate landing page that guides new users
 * through the platform after registration. Features a multi-step
 * flow with animations and clear value propositions.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  completeOnboarding,
  getOnboardingStatus,
  type PrimaryInterest,
} from "@/lib/api/onboarding";
import {
  Palette,
  MessageSquare,
  Users,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Target,
  Award,
  Search,
  FolderOpen,
  UserCircle,
  PlusCircle,
  ChevronRight,
} from "lucide-react";

// Step configuration
type OnboardingStep = "welcome" | "features" | "role" | "reviewer-setup" | "complete";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const creatorFeatures: FeatureItem[] = [
  {
    icon: <Star className="size-6" />,
    title: "Expert Feedback",
    description: "Get detailed reviews from industry professionals",
    color: "text-accent-blue",
  },
  {
    icon: <TrendingUp className="size-6" />,
    title: "Track Progress",
    description: "Monitor your growth with actionable insights",
    color: "text-green-500",
  },
  {
    icon: <Shield className="size-6" />,
    title: "Secure Uploads",
    description: "Your work is protected with watermarks and encryption",
    color: "text-purple-500",
  },
];

const reviewerFeatures: FeatureItem[] = [
  {
    icon: <Zap className="size-6" />,
    title: "Earn Rewards",
    description: "Get paid for sharing your expertise",
    color: "text-accent-peach",
  },
  {
    icon: <Target className="size-6" />,
    title: "Build Reputation",
    description: "Grow your profile and attract more opportunities",
    color: "text-blue-500",
  },
  {
    icon: <Award className="size-6" />,
    title: "Flexible Schedule",
    description: "Review on your own time, set your availability",
    color: "text-amber-500",
  },
];

interface RoleOption {
  value: PrimaryInterest;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
}

const roleOptions: RoleOption[] = [
  {
    value: "creator",
    title: "Creator",
    description: "Get expert feedback on your creative work",
    icon: <Palette className="size-8" />,
    gradient: "from-accent-blue to-blue-600",
    features: [
      "Submit work for professional review",
      "Track feedback and improvements",
      "Build your portfolio",
    ],
  },
  {
    value: "reviewer",
    title: "Reviewer",
    description: "Share your expertise and earn rewards",
    icon: <MessageSquare className="size-8" />,
    gradient: "from-accent-peach to-orange-600",
    features: [
      "Review creative work from others",
      "Earn sparks and recognition",
      "Grow your professional network",
    ],
  },
  {
    value: "both",
    title: "Both",
    description: "Give and receive feedback from the community",
    icon: <Users className="size-8" />,
    gradient: "from-purple-500 to-pink-500",
    features: [
      "Full access to all features",
      "Create and review simultaneously",
      "Maximum community engagement",
    ],
  },
];

// Action items for the complete step - role-based next steps
interface ActionItem {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  primary?: boolean;
}

const creatorActions: ActionItem[] = [
  {
    href: "/review/new",
    icon: <PlusCircle className="size-5" />,
    iconBg: "bg-accent-blue/10",
    iconColor: "text-accent-blue",
    title: "Submit your first project",
    description: "Upload your work and get expert feedback",
    primary: true,
  },
  {
    href: "/reviewers",
    icon: <Search className="size-5" />,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    title: "Find expert reviewers",
    description: "Browse our directory of industry professionals",
  },
  {
    href: "/settings/account",
    icon: <UserCircle className="size-5" />,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    title: "Complete your profile",
    description: "Add a photo and bio to stand out",
  },
];

const reviewerActions: ActionItem[] = [
  {
    href: "/browse",
    icon: <Search className="size-5" />,
    iconBg: "bg-accent-peach/10",
    iconColor: "text-accent-peach",
    title: "Browse review requests",
    description: "Find projects that match your expertise",
    primary: true,
  },
  {
    href: "/portfolio",
    icon: <FolderOpen className="size-5" />,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    title: "Upload portfolio work",
    description: "Showcase your best work to attract creators",
  },
  {
    href: "/settings/account",
    icon: <UserCircle className="size-5" />,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    title: "Complete your profile",
    description: "Add your expertise and experience",
  },
];

const bothActions: ActionItem[] = [
  {
    href: "/review/new",
    icon: <PlusCircle className="size-5" />,
    iconBg: "bg-accent-blue/10",
    iconColor: "text-accent-blue",
    title: "Submit a project for review",
    description: "Get expert feedback on your work",
    primary: true,
  },
  {
    href: "/browse",
    icon: <Search className="size-5" />,
    iconBg: "bg-accent-peach/10",
    iconColor: "text-accent-peach",
    title: "Browse review requests",
    description: "Find projects to review and earn sparks",
  },
  {
    href: "/portfolio",
    icon: <FolderOpen className="size-5" />,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    title: "Build your portfolio",
    description: "Showcase your work to the community",
  },
  {
    href: "/settings/account",
    icon: <UserCircle className="size-5" />,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    title: "Complete your profile",
    description: "Add a photo, bio, and expertise",
  },
];

function getActionsForRole(role: PrimaryInterest | null): ActionItem[] {
  switch (role) {
    case "creator":
      return creatorActions;
    case "reviewer":
      return reviewerActions;
    case "both":
      return bothActions;
    default:
      return creatorActions;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [selectedRole, setSelectedRole] = useState<PrimaryInterest | null>(null);
  const [listAsReviewer, setListAsReviewer] = useState(false);
  const [reviewerTagline, setReviewerTagline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check if user is authenticated and needs onboarding
  useEffect(() => {
    const checkStatus = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      try {
        const status = await getOnboardingStatus();
        if (status.onboardingCompleted) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // If we can't check status, continue with onboarding
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [isAuthenticated, authLoading, router]);

  const handleRoleSelect = useCallback((role: PrimaryInterest) => {
    setSelectedRole(role);
    if (role === "creator") {
      // Creators skip the reviewer setup
      setCurrentStep("complete");
    } else {
      // Reviewers and "both" go to reviewer setup
      setCurrentStep("reviewer-setup");
    }
  }, []);

  const handleCompleteOnboarding = useCallback(async (redirectTo?: string) => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await completeOnboarding({
        primaryInterest: selectedRole,
        listAsReviewer: listAsReviewer,
        reviewerTagline: reviewerTagline || undefined,
      });

      // Navigate to specified route or dashboard after successful completion
      router.push(redirectTo || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }, [selectedRole, listAsReviewer, reviewerTagline, router]);

  const goBack = useCallback(() => {
    switch (currentStep) {
      case "features":
        setCurrentStep("welcome");
        break;
      case "role":
        setCurrentStep("features");
        break;
      case "reviewer-setup":
        setCurrentStep("role");
        setSelectedRole(null);
        break;
      case "complete":
        if (selectedRole === "creator") {
          setCurrentStep("role");
          setSelectedRole(null);
        } else {
          setCurrentStep("reviewer-setup");
        }
        break;
    }
  }, [currentStep, selectedRole]);

  // Loading state
  if (authLoading || isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="size-8 animate-spin mx-auto text-accent-blue" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-blue to-accent-peach"
          initial={{ width: "0%" }}
          animate={{
            width:
              currentStep === "welcome"
                ? "20%"
                : currentStep === "features"
                  ? "40%"
                  : currentStep === "role"
                    ? "60%"
                    : currentStep === "reviewer-setup"
                      ? "80%"
                      : "100%",
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {currentStep === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-peach text-white mb-4"
                >
                  <Sparkles className="size-10" />
                </motion.div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                  Welcome to Critvue
                  {user?.full_name && (
                    <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2 text-muted-foreground font-normal">
                      {user.full_name}!
                    </span>
                  )}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  You're about to join a community of creators and experts who help each other grow.
                  Let's get you set up in just a few steps.
                </p>
              </div>

              {/* Value propositions */}
              <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
                {[
                  {
                    icon: <Star className="size-6" />,
                    title: "Quality Feedback",
                    description: "Get actionable insights from professionals",
                  },
                  {
                    icon: <Shield className="size-6" />,
                    title: "Secure Platform",
                    description: "Your work is protected and private",
                  },
                  {
                    icon: <TrendingUp className="size-6" />,
                    title: "Grow Together",
                    description: "Build skills and connections",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm text-center"
                  >
                    <div className="inline-flex items-center justify-center size-12 rounded-xl bg-accent-blue/10 text-accent-blue mb-4">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={() => setCurrentStep("features")}
                  className="min-w-[200px] bg-gradient-to-r from-accent-blue to-accent-blue/90 hover:from-accent-blue/90 hover:to-accent-blue text-white shadow-lg shadow-accent-blue/20"
                >
                  Get Started
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Features Overview */}
          {currentStep === "features" && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                  What You Can Do on Critvue
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Whether you're here to improve your work or help others, we've got you covered.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Creator features */}
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-accent-blue/10 text-accent-blue">
                      <Palette className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">For Creators</h3>
                      <p className="text-sm text-muted-foreground">Get expert feedback</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {creatorFeatures.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`flex-shrink-0 ${feature.color}`}>{feature.icon}</div>
                        <div>
                          <div className="font-medium text-foreground">{feature.title}</div>
                          <div className="text-sm text-muted-foreground">{feature.description}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Reviewer features */}
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-accent-peach/10 text-accent-peach">
                      <MessageSquare className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">For Reviewers</h3>
                      <p className="text-sm text-muted-foreground">Share your expertise</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {reviewerFeatures.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`flex-shrink-0 ${feature.color}`}>{feature.icon}</div>
                        <div>
                          <div className="font-medium text-foreground">{feature.title}</div>
                          <div className="text-sm text-muted-foreground">{feature.description}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 size-4" />
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={() => setCurrentStep("role")}
                  className="bg-gradient-to-r from-accent-blue to-accent-blue/90 hover:from-accent-blue/90 hover:to-accent-blue text-white"
                >
                  Continue
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Role Selection */}
          {currentStep === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                  How Do You Want to Use Critvue?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Choose your primary role. Don't worry, you can always change this later in settings.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
                {roleOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    onClick={() => handleRoleSelect(option.value)}
                    className="group p-6 rounded-2xl border-2 border-border hover:border-accent-blue/50 bg-card text-left transition-all duration-200 hover:shadow-lg hover:shadow-accent-blue/5"
                  >
                    <div
                      className={`inline-flex items-center justify-center size-14 rounded-xl bg-gradient-to-br ${option.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-200`}
                    >
                      {option.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{option.title}</h3>
                    <p className="text-muted-foreground mb-4">{option.description}</p>
                    <ul className="space-y-2">
                      {option.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="size-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-start pt-4">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 size-4" />
                  Back
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Reviewer Setup (only for reviewers and "both") */}
          {currentStep === "reviewer-setup" && (
            <motion.div
              key="reviewer-setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 max-w-xl mx-auto"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-accent-peach to-orange-600 text-white mb-2">
                  <MessageSquare className="size-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Set Up Your Reviewer Profile
                </h2>
                <p className="text-muted-foreground">
                  Help creators find you by listing yourself in the reviewer directory.
                </p>
              </div>

              <div className="space-y-6">
                {/* List as reviewer toggle */}
                <label className="flex items-start gap-4 p-5 rounded-xl border-2 border-border cursor-pointer hover:border-accent-peach/50 transition-colors bg-card">
                  <input
                    type="checkbox"
                    checked={listAsReviewer}
                    onChange={(e) => setListAsReviewer(e.target.checked)}
                    className="mt-1 size-5 rounded border-border text-accent-peach focus:ring-accent-peach focus:ring-offset-0"
                  />
                  <div>
                    <div className="font-medium text-foreground">List me in the reviewer directory</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Let creators discover and request reviews from you
                    </div>
                  </div>
                </label>

                {/* Tagline input */}
                <AnimatePresence>
                  {listAsReviewer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
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
                          className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-peach focus:border-transparent transition-all"
                        />
                        <p className="mt-2 text-xs text-muted-foreground text-right">
                          {reviewerTagline.length}/200 characters
                        </p>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Benefits */}
                <div className="p-5 rounded-xl bg-muted/50 space-y-3">
                  <h4 className="font-medium text-foreground text-sm">Benefits of being listed:</h4>
                  <div className="space-y-2">
                    {[
                      "Get discovered by creators looking for feedback",
                      "Earn sparks and build your reputation",
                      "Connect with talented creators",
                      "You can change this anytime in settings",
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="size-4 text-green-500 flex-shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 size-4" />
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={() => setCurrentStep("complete")}
                  className="bg-gradient-to-r from-accent-peach to-accent-peach/90 hover:from-accent-peach/90 hover:to-accent-peach text-white"
                >
                  Continue
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {currentStep === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 max-w-xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center size-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white"
              >
                <CheckCircle2 className="size-12" />
              </motion.div>

              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                  You're All Set!
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your account is ready. Here's what you can do next:
                </p>
              </div>

              {/* Next steps - role-based actions */}
              <div className="space-y-3 text-left">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Click any action below to get started, or go to your dashboard.
                </p>
                {getActionsForRole(selectedRole).map((action, index) => (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <button
                      onClick={() => handleCompleteOnboarding(action.href)}
                      disabled={isSubmitting}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl border bg-card
                        transition-all duration-200 group text-left
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${action.primary
                          ? "border-accent-blue/50 hover:border-accent-blue hover:shadow-lg hover:shadow-accent-blue/10"
                          : "border-border hover:border-accent-blue/30 hover:shadow-md"
                        }
                      `}
                    >
                      <div className={`flex-shrink-0 size-10 rounded-lg ${action.iconBg} flex items-center justify-center ${action.iconColor}`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground group-hover:text-accent-blue transition-colors">
                          {action.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground group-hover:text-accent-blue group-hover:translate-x-1 transition-all" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Button variant="ghost" onClick={goBack} disabled={isSubmitting}>
                  <ArrowLeft className="mr-2 size-4" />
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleCompleteOnboarding()}
                  disabled={isSubmitting}
                  className="min-w-[200px] bg-gradient-to-r from-accent-blue via-purple-500 to-accent-peach hover:opacity-90 text-white shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Go to Dashboard
                      <ArrowRight className="ml-2 size-5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
