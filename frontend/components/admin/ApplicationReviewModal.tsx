"use client";

/**
 * Application Review Modal
 *
 * A full-featured modal for reviewing expert applications.
 * Features:
 * - Full application details display
 * - Vote submission (Approve/Reject/Request Changes)
 * - Rejection reason selection
 * - Internal notes and feedback
 * - Previous review history
 */

import * as React from "react";
import { useFormState, useToggle } from "@/hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  User,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  History,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ApplicationDetail,
  RejectionReason,
  VoteRequest,
  ApplicationReview,
} from "@/lib/api/admin/applications";
import { format } from "date-fns";

interface ApplicationReviewModalProps {
  application: ApplicationDetail | null;
  rejectionReasons: RejectionReason[];
  isOpen: boolean;
  onClose: () => void;
  onVote: (vote: VoteRequest) => Promise<void>;
  onRelease: () => Promise<void>;
  isSubmitting?: boolean;
  isClaimed?: boolean;
}

type VoteType = "approve" | "reject" | "request_changes";

function VoteButton({
  type,
  selected,
  onClick,
  disabled,
}: {
  type: VoteType;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const config = {
    approve: {
      label: "Approve",
      icon: CheckCircle2,
      selectedClass: "bg-green-500 text-white border-green-500",
      defaultClass:
        "border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300",
    },
    reject: {
      label: "Reject",
      icon: XCircle,
      selectedClass: "bg-red-500 text-white border-red-500",
      defaultClass:
        "border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300",
    },
    request_changes: {
      label: "Request Changes",
      icon: RefreshCw,
      selectedClass: "bg-amber-500 text-white border-amber-500",
      defaultClass:
        "border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300",
    },
  };

  const { label, icon: Icon, selectedClass, defaultClass } = config[type];

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
        selected ? selectedClass : defaultClass,
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}

function ReviewHistory({ reviews }: { reviews: ApplicationReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <History className="h-4 w-4" />
        Previous Reviews
      </h4>
      <div className="space-y-2">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border bg-gray-50/50 p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <Badge
                variant={
                  review.vote === "approve"
                    ? "success"
                    : review.vote === "reject"
                    ? "error"
                    : review.vote === "request_changes"
                    ? "warning"
                    : "neutral"
                }
                size="sm"
              >
                {review.vote || review.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {review.voted_at
                  ? format(new Date(review.voted_at), "MMM d, yyyy")
                  : review.claimed_at
                  ? format(new Date(review.claimed_at), "MMM d, yyyy")
                  : ""}
              </span>
            </div>
            {review.rejection_reason_label && (
              <p className="mt-2 text-xs text-muted-foreground">
                Reason: {review.rejection_reason_label}
              </p>
            )}
            {review.additional_feedback && (
              <p className="mt-1 text-xs text-gray-600">
                {review.additional_feedback}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Type definitions for application data structure
interface PersonalInfo {
  fullName?: string;
  email?: string;
  location?: string;
  timezone?: string;
  linkedinUrl?: string;
}

interface ProfessionalBackground {
  level?: string;
  customLevel?: string;
  yearsOfExperience?: number;
  currentRole?: string;
  briefBio?: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  isPrimary: boolean;
}

interface PortfolioItem {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

interface Education {
  id: string;
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

interface ApplicationData {
  personalInfo?: PersonalInfo;
  professionalBackground?: ProfessionalBackground;
  skills?: Skill[];
  portfolio?: PortfolioItem[];
  credentials?: {
    education?: Education[];
  };
}

function getLevelLabel(level?: string): string {
  const labels: Record<string, string> = {
    "industry-professional": "Industry Professional",
    "senior-expert": "Senior Expert",
    "established-creator": "Established Creator",
    "emerging-talent": "Emerging Talent",
  };
  return level ? labels[level] || level : "Not specified";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ApplicationDataSection({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const { value: expanded, toggle: toggleExpanded } = useToggle(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  // Cast to typed structure
  const appData = data as ApplicationData;
  const personalInfo = appData.personalInfo;
  const professional = appData.professionalBackground;
  const skills = appData.skills || [];
  const portfolio = appData.portfolio || [];
  const education = appData.credentials?.education || [];

  // Separate primary and secondary skills
  const primarySkills = skills.filter((s) => s.isPrimary);
  const secondarySkills = skills.filter((s) => !s.isPrimary);

  return (
    <div className="space-y-6">
      <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <FileText className="h-4 w-4" />
        Application Details
      </h4>

      {/* Personal Info */}
      {personalInfo && (
        <div className="rounded-lg border bg-gray-50/50 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Personal Info
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {personalInfo.location && (
              <div>
                <span className="text-muted-foreground">Location:</span>{" "}
                <span className="font-medium">{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.timezone && (
              <div>
                <span className="text-muted-foreground">Timezone:</span>{" "}
                <span className="font-medium">{personalInfo.timezone}</span>
              </div>
            )}
            {personalInfo.linkedinUrl && (
              <div className="col-span-2">
                <a
                  href={personalInfo.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent-blue hover:underline"
                >
                  LinkedIn Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Background */}
      {professional && (
        <div className="rounded-lg border bg-gradient-to-br from-accent-blue/5 to-accent-peach/5 p-4 space-y-3 overflow-hidden">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Professional Background
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">
              {getLevelLabel(professional.level)}
            </Badge>
            {professional.yearsOfExperience && (
              <Badge variant="neutral">
                {professional.yearsOfExperience} years experience
              </Badge>
            )}
            {professional.currentRole && (
              <Badge variant="neutral">{professional.currentRole}</Badge>
            )}
          </div>
          {professional.briefBio && (
            <p className="text-sm text-gray-700 leading-relaxed mt-2 break-all">
              {professional.briefBio}
            </p>
          )}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Skills & Expertise
          </p>
          {primarySkills.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Primary Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {primarySkills.map((skill) => (
                  <Badge key={skill.id} variant="success" size="sm">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {secondarySkills.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Additional Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {secondarySkills.map((skill) => (
                  <Badge key={skill.id} variant="neutral" size="sm">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Portfolio ({portfolio.length} item{portfolio.length !== 1 ? "s" : ""})
          </p>
          <div className="grid grid-cols-2 gap-3">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedImage(item.url)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {item.fileType?.startsWith("image/") ? (
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.title || item.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-2 space-y-0.5">
                  <p className="text-sm font-medium truncate">
                    {item.title || item.fileName}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(item.fileSize)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage}
              alt="Portfolio preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Education/Credentials */}
      {education.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Education & Credentials
          </p>
          <div className="space-y-2">
            {education.map((edu) => (
              <div
                key={edu.id}
                className="rounded-lg border bg-gray-50/50 p-3 text-sm"
              >
                {edu.degree && edu.fieldOfStudy && (
                  <p className="font-medium">
                    {edu.degree} in {edu.fieldOfStudy}
                  </p>
                )}
                {edu.institution && (
                  <p className="text-muted-foreground">{edu.institution}</p>
                )}
                {edu.startYear && (
                  <p className="text-xs text-muted-foreground">
                    {edu.startYear}
                    {edu.endYear ? ` - ${edu.endYear}` : " - Present"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show raw data toggle */}
      <button
        onClick={toggleExpanded}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-700"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            expanded && "rotate-180"
          )}
        />
        {expanded ? "Hide raw data" : "Show raw data"}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100 max-h-60"
          >
            {JSON.stringify(data, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
}

interface VoteFormData {
  selectedVote: VoteType | null;
  rejectionReasonId: string;
  additionalFeedback: string;
  internalNotes: string;
}

const initialVoteForm: VoteFormData = {
  selectedVote: null,
  rejectionReasonId: "",
  additionalFeedback: "",
  internalNotes: "",
};

export function ApplicationReviewModal({
  application,
  rejectionReasons,
  isOpen,
  onClose,
  onVote,
  onRelease,
  isSubmitting,
  isClaimed,
}: ApplicationReviewModalProps) {
  const { values: form, setValue, reset } = useFormState<VoteFormData>(initialVoteForm);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleSubmit = async () => {
    if (!form.selectedVote) return;

    const voteRequest: VoteRequest = {
      vote: form.selectedVote,
      additional_feedback: form.additionalFeedback || undefined,
      internal_notes: form.internalNotes || undefined,
    };

    if (form.selectedVote === "reject" && form.rejectionReasonId) {
      voteRequest.rejection_reason_id = parseInt(form.rejectionReasonId);
    }

    await onVote(voteRequest);
  };

  if (!application) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 z-50 mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl md:inset-8 lg:inset-12"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-gray-50 to-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">Review Application</h2>
                <p className="font-mono text-sm text-muted-foreground">
                  {application.application_number}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-6">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Left column - Applicant Info */}
                <div className="space-y-6">
                  {/* Applicant header */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-peach/20">
                      <User className="h-7 w-7 text-accent-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {application.full_name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {application.email}
                      </p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Joined{" "}
                        {application.user_joined_at
                          ? format(new Date(application.user_joined_at), "MMM d, yyyy")
                          : "Unknown"}
                      </p>
                    </div>
                  </div>

                  {/* Rejection count warning */}
                  {application.rejection_count > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        Previously rejected {application.rejection_count} time
                        {application.rejection_count !== 1 && "s"}
                      </span>
                    </div>
                  )}

                  {/* Application data */}
                  <ApplicationDataSection
                    data={application.application_data || {}}
                  />

                  {/* Previous reviews */}
                  <ReviewHistory reviews={application.reviews || []} />
                </div>

                {/* Right column - Vote Form */}
                <div className="space-y-6">
                  {isClaimed ? (
                    <>
                      {/* Vote selection */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          Your Decision
                        </h4>
                        <div className="flex gap-3">
                          <VoteButton
                            type="approve"
                            selected={form.selectedVote === "approve"}
                            onClick={() => setValue("selectedVote", "approve")}
                            disabled={isSubmitting}
                          />
                          <VoteButton
                            type="reject"
                            selected={form.selectedVote === "reject"}
                            onClick={() => setValue("selectedVote", "reject")}
                            disabled={isSubmitting}
                          />
                          <VoteButton
                            type="request_changes"
                            selected={form.selectedVote === "request_changes"}
                            onClick={() => setValue("selectedVote", "request_changes")}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {/* Rejection reason */}
                      <AnimatePresence>
                        {form.selectedVote === "reject" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <label className="text-sm font-medium text-gray-700">
                              Rejection Reason *
                            </label>
                            <Select
                              value={form.rejectionReasonId}
                              onValueChange={(v) => setValue("rejectionReasonId", v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {rejectionReasons.map((reason) => (
                                  <SelectItem
                                    key={reason.id}
                                    value={reason.id.toString()}
                                  >
                                    {reason.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Additional feedback (for applicant) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          <MessageSquare className="mr-1 inline h-4 w-4" />
                          Feedback for Applicant (optional)
                        </label>
                        <Textarea
                          value={form.additionalFeedback}
                          onChange={(e) =>
                            setValue("additionalFeedback", e.target.value)
                          }
                          placeholder="This will be shared with the applicant..."
                          rows={3}
                        />
                      </div>

                      {/* Internal notes */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Internal Notes (optional)
                        </label>
                        <Textarea
                          value={form.internalNotes}
                          onChange={(e) => setValue("internalNotes", e.target.value)}
                          placeholder="Notes for other committee members (not shared with applicant)..."
                          rows={2}
                          className="bg-gray-50"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12">
                      <p className="text-sm text-muted-foreground">
                        Claim this application to submit your review
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
              <div>
                {isClaimed && (
                  <Button
                    variant="ghost"
                    onClick={onRelease}
                    disabled={isSubmitting}
                    className="text-muted-foreground"
                  >
                    Release Application
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                {isClaimed && (
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !form.selectedVote ||
                      (form.selectedVote === "reject" && !form.rejectionReasonId) ||
                      isSubmitting
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Submit Vote
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
