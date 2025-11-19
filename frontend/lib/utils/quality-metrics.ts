/**
 * Quality Metrics Calculation Utilities
 *
 * Calculates completeness, tone, clarity, and actionability scores
 * for Smart Adaptive Review Editor
 */

import {
  SmartReviewDraft,
  QualityMetrics,
} from '@/lib/types/smart-review';

/**
 * Calculate completeness score (0-100%)
 */
export function calculateCompleteness(draft: SmartReviewDraft): number {
  let score = 0;

  // Phase 1 (30%)
  if (draft.phase1_quick_assessment) {
    const phase1 = draft.phase1_quick_assessment;
    if (phase1.overall_rating) score += 10;
    if (phase1.primary_focus_areas?.length >= 2) score += 10;
    if (phase1.quick_summary?.length >= 50) score += 10;
  }

  // Phase 2 (40%)
  if (draft.phase2_rubric?.ratings) {
    const ratingsCount = Object.keys(draft.phase2_rubric.ratings).length;
    score += Math.min(40, ratingsCount * 10);
  }

  // Phase 3 (30%)
  if (draft.phase3_detailed_feedback) {
    const phase3 = draft.phase3_detailed_feedback;
    if (phase3.strengths?.length >= 2) score += 10;
    if (phase3.improvements?.length >= 2) score += 10;
    if (phase3.additional_notes && phase3.additional_notes.length >= 100) score += 10;
  }

  return Math.min(100, score);
}

/**
 * Estimate tone from text content
 */
export function estimateTone(
  text: string
): 'professional' | 'casual' | 'critical' | 'encouraging' {
  const lowerText = text.toLowerCase();

  // Check for encouraging words
  const encouragingWords = [
    'great',
    'excellent',
    'well done',
    'good job',
    'impressive',
    'outstanding',
    'fantastic',
    'wonderful',
  ];
  const encouragingCount = encouragingWords.filter((w) =>
    lowerText.includes(w)
  ).length;

  // Check for critical words
  const criticalWords = [
    'wrong',
    'bad',
    'poor',
    'terrible',
    'awful',
    'needs improvement',
    'lacking',
  ];
  const criticalCount = criticalWords.filter((w) => lowerText.includes(w)).length;

  // Check for professional markers
  const hasProfessionalMarkers =
    /\b(consider|suggest|recommend|however|although|furthermore)\b/i.test(text);

  if (criticalCount > 2) return 'critical';
  if (encouragingCount > 2) return 'encouraging';
  if (hasProfessionalMarkers) return 'professional';
  return 'casual';
}

/**
 * Calculate clarity score (0-100%)
 */
export function calculateClarity(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgWordLength =
    words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Ideal: 15-20 words per sentence, 4-6 characters per word
  let score = 100;

  // Penalize overly long sentences
  if (avgWordsPerSentence > 25) score -= 20;
  if (avgWordsPerSentence > 30) score -= 10; // Additional penalty

  // Penalize overly short sentences
  if (avgWordsPerSentence < 10) score -= 10;

  // Penalize complex vocabulary
  if (avgWordLength > 7) score -= 15;
  if (avgWordLength > 9) score -= 10; // Additional penalty

  // Bonus for good range
  if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) score += 5;
  if (avgWordLength >= 4 && avgWordLength <= 6) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate actionability score (0-100%)
 */
export function calculateActionability(draft: SmartReviewDraft): number {
  let score = 0;

  // Check if improvements are specific and actionable
  const improvements = draft.phase3_detailed_feedback?.improvements || [];

  if (improvements.length === 0) return 0;

  // Score based on number of improvements
  score += Math.min(30, improvements.length * 10);

  // Check for action verbs
  const actionVerbs = [
    'add',
    'remove',
    'refactor',
    'implement',
    'fix',
    'update',
    'change',
    'improve',
    'optimize',
    'simplify',
    'enhance',
    'consider',
    'try',
  ];

  const actionableCount = improvements.filter((imp) => {
    const lower = imp.toLowerCase();
    return actionVerbs.some((verb) => lower.includes(verb));
  }).length;

  score += Math.min(40, actionableCount * 10);

  // Check for specificity (longer feedback tends to be more specific)
  const avgLength =
    improvements.reduce((sum, imp) => sum + imp.length, 0) / improvements.length;

  if (avgLength > 50) score += 15;
  else if (avgLength > 30) score += 10;
  else if (avgLength > 20) score += 5;

  // Bonus if Phase 2 ratings are provided (shows structured thinking)
  if (draft.phase2_rubric?.ratings && Object.keys(draft.phase2_rubric.ratings).length >= 3) {
    score += 15;
  }

  return Math.min(100, score);
}

/**
 * Calculate all quality metrics for a draft
 */
export function calculateQualityMetrics(draft: SmartReviewDraft): QualityMetrics {
  // Combine all text for tone and clarity analysis
  const allText = [
    draft.phase1_quick_assessment?.quick_summary || '',
    ...(draft.phase3_detailed_feedback?.strengths || []),
    ...(draft.phase3_detailed_feedback?.improvements || []),
    draft.phase3_detailed_feedback?.additional_notes || '',
  ]
    .filter((t) => t.trim().length > 0)
    .join(' ');

  return {
    completeness_score: calculateCompleteness(draft),
    estimated_tone: allText.length > 0 ? estimateTone(allText) : 'casual',
    clarity_score: allText.length > 0 ? calculateClarity(allText) : 0,
    actionability_score: calculateActionability(draft),
  };
}

/**
 * Get color class for completeness score
 */
export function getCompletenessColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Get color class for tone
 */
export function getToneColor(
  tone: 'professional' | 'casual' | 'critical' | 'encouraging'
): string {
  switch (tone) {
    case 'professional':
      return 'text-blue-600';
    case 'encouraging':
      return 'text-green-600';
    case 'critical':
      return 'text-red-600';
    case 'casual':
      return 'text-gray-600';
  }
}

/**
 * Get display label for tone
 */
export function getToneLabel(
  tone: 'professional' | 'casual' | 'critical' | 'encouraging'
): string {
  return tone.charAt(0).toUpperCase() + tone.slice(1);
}

/**
 * Validate a phase is complete
 */
export function validatePhase1(draft: SmartReviewDraft): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!draft.phase1_quick_assessment) {
    return { isValid: false, errors: ['Phase 1 is required'] };
  }

  const phase1 = draft.phase1_quick_assessment;

  if (!phase1.overall_rating || phase1.overall_rating < 1 || phase1.overall_rating > 5) {
    errors.push('Overall rating is required (1-5 stars)');
  }

  if (!phase1.primary_focus_areas || phase1.primary_focus_areas.length < 1) {
    errors.push('At least one focus area is required');
  }

  if (!phase1.quick_summary || phase1.quick_summary.length < 50) {
    errors.push('Quick summary must be at least 50 characters');
  }

  if (phase1.quick_summary && phase1.quick_summary.length > 300) {
    errors.push('Quick summary must be less than 300 characters');
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePhase2(draft: SmartReviewDraft): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!draft.phase2_rubric) {
    return { isValid: false, errors: ['Phase 2 is required'] };
  }

  const phase2 = draft.phase2_rubric;

  if (!phase2.ratings || Object.keys(phase2.ratings).length === 0) {
    errors.push('At least one dimension rating is required');
  }

  // Validate all ratings are 1-5
  if (phase2.ratings) {
    for (const [dimension, rating] of Object.entries(phase2.ratings)) {
      if (rating < 1 || rating > 5) {
        errors.push(`Rating for ${dimension} must be between 1 and 5`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePhase3(draft: SmartReviewDraft): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Phase 3 is optional, but if provided, validate it
  if (!draft.phase3_detailed_feedback) {
    return { isValid: true, errors: [] }; // Optional phase
  }

  const phase3 = draft.phase3_detailed_feedback;

  if (phase3.strengths && phase3.strengths.length === 0) {
    errors.push('If providing strengths, include at least one item');
  }

  if (phase3.improvements && phase3.improvements.length === 0) {
    errors.push('If providing improvements, include at least one item');
  }

  if (phase3.additional_notes && phase3.additional_notes.length > 5000) {
    errors.push('Additional notes must be less than 5000 characters');
  }

  return { isValid: errors.length === 0, errors };
}
