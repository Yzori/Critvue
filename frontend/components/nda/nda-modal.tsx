"use client";

/**
 * NDA Modal Component
 * Displays the NDA agreement and allows users to sign it with their legal name.
 * Used as a gate before viewing/claiming NDA-protected review requests.
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Shield, Lock, Check, X, Loader2, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getNDAContent, signNDA, NDAContentResponse } from "@/lib/api/nda";
import { getErrorMessage } from "@/lib/api/client";

interface NDAModalProps {
  reviewId: number;
  isOpen: boolean;
  onClose: () => void;
  onSigned: () => void;
}

export function NDAModal({ reviewId, isOpen, onClose, onSigned }: NDAModalProps) {
  const [ndaContent, setNdaContent] = useState<NDAContentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullLegalName, setFullLegalName] = useState("");
  const [hasReadNDA, setHasReadNDA] = useState(false);
  const [showFullNDA, setShowFullNDA] = useState(false);

  // Load NDA content when modal opens
  useEffect(() => {
    if (isOpen) {
      loadNDAContent();
    }
  }, [isOpen]);

  const loadNDAContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const content = await getNDAContent();
      setNdaContent(content);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!fullLegalName.trim() || fullLegalName.trim().length < 2) {
      setError("Please enter your full legal name (at least 2 characters)");
      return;
    }

    if (!hasReadNDA) {
      setError("Please confirm you have read and agree to the NDA");
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      await signNDA(reviewId, { full_legal_name: fullLegalName.trim() });
      onSigned();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSigning(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centering wrapper */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          {/* Modal */}
          <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                NDA Required
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign to view confidential work
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-full hover:bg-white/50 dark:hover:bg-black/20 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-purple-600" />
            </div>
          ) : error && !ndaContent ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertTriangle className="size-12 text-amber-500" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={loadNDAContent}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* NDA Summary */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                <div className="flex items-start gap-3">
                  <Lock className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      This work is protected by a Non-Disclosure Agreement
                    </p>
                    <p className="text-purple-700 dark:text-purple-300">
                      By signing, you agree to keep all materials confidential, not share or reproduce the work,
                      and only use it for providing feedback on Critvue.
                    </p>
                  </div>
                </div>
              </div>

              {/* View Full NDA Toggle */}
              <div className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowFullNDA(!showFullNDA)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {showFullNDA ? "Hide" : "View"} Full NDA Document
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Version {ndaContent?.version}
                  </span>
                </button>

                {showFullNDA && (
                  <div className="border-t border-border p-4 bg-gray-50 dark:bg-gray-800 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {ndaContent?.content}
                    </pre>
                  </div>
                )}
              </div>

              {/* Signature Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullLegalName" className="text-base font-semibold">
                    Type Your Full Legal Name to Sign
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    This serves as your electronic signature
                  </p>
                </div>

                <Input
                  id="fullLegalName"
                  type="text"
                  placeholder="e.g., John Alexander Smith"
                  value={fullLegalName}
                  onChange={(e) => setFullLegalName(e.target.value)}
                  className="text-lg h-12"
                  autoComplete="name"
                />

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={hasReadNDA}
                      onChange={(e) => setHasReadNDA(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="size-5 rounded border-2 border-muted-foreground/30 peer-checked:border-purple-600 peer-checked:bg-purple-600 transition-colors flex items-center justify-center">
                      {hasReadNDA && <Check className="size-3 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    I have read and agree to the Non-Disclosure Agreement. I understand that violating this agreement may result in legal action.
                  </span>
                </label>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && ndaContent && (
          <div className="flex-shrink-0 p-6 border-t border-border bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSign}
                disabled={isSigning || !fullLegalName.trim() || !hasReadNDA}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Shield className="size-4 mr-2" />
                    Sign & View Request
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
