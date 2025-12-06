/**
 * Growth Analytics API Service
 * Handles portfolio growth metrics and analytics
 */

import apiClient from "./client";

/**
 * Growth summary metrics
 */
export interface GrowthData {
  total_reviews: number;
  improvement_score: number;
  top_category: string;
  growth_percentile: number;
  streak_days: number;
  total_projects: number;
}

/**
 * Milestone/Achievement
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string | null;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

/**
 * Reviewer who contributed to growth
 */
export interface ReviewerContribution {
  id: number;
  name: string;
  avatar: string | null;
  specialty: string;
  review_count: number;
  impact_score: number;
}

/**
 * Project with metrics
 */
export interface ProjectMetrics {
  id: number;
  title: string;
  description: string | null;
  content_type: string;
  image_url: string | null;
  before_image_url: string | null;
  project_url: string | null;
  views_count: number;
  rating: number | null;
  reviews_received: number;
  is_self_documented: boolean;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
}

/**
 * Complete portfolio growth response
 */
export interface PortfolioGrowthResponse {
  growth_data: GrowthData;
  milestones: Milestone[];
  top_reviewers: ReviewerContribution[];
  projects: ProjectMetrics[];
}

/**
 * Get growth summary metrics
 */
export async function getGrowthSummary(): Promise<GrowthData> {
  return await apiClient.get<GrowthData>("/growth/summary");
}

/**
 * Get user's milestones/achievements
 */
export async function getMilestones(): Promise<Milestone[]> {
  return await apiClient.get<Milestone[]>("/growth/milestones");
}

/**
 * Get reviewers who contributed to user's growth
 */
export async function getTopReviewers(limit: number = 10): Promise<ReviewerContribution[]> {
  return await apiClient.get<ReviewerContribution[]>(`/growth/reviewers?limit=${limit}`);
}

/**
 * Get portfolio projects with metrics
 */
export async function getProjectMetrics(limit: number = 20): Promise<ProjectMetrics[]> {
  return await apiClient.get<ProjectMetrics[]>(`/growth/projects?limit=${limit}`);
}

/**
 * Get complete portfolio growth analytics in one call
 */
export async function getFullPortfolioGrowth(): Promise<PortfolioGrowthResponse> {
  return await apiClient.get<PortfolioGrowthResponse>("/growth/full");
}

/**
 * Transform API growth data to frontend format
 */
export function transformGrowthData(data: GrowthData) {
  return {
    totalReviews: data.total_reviews,
    improvementScore: data.improvement_score,
    topCategory: data.top_category,
    growthPercentile: data.growth_percentile,
    streakDays: data.streak_days,
    totalProjects: data.total_projects,
  };
}

/**
 * Transform API milestones to frontend format
 */
export function transformMilestones(milestones: Milestone[]) {
  return milestones.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    icon: m.icon,
    earnedAt: m.earned_at,
    rarity: m.rarity,
  }));
}

/**
 * Transform API reviewers to frontend format
 */
export function transformReviewers(reviewers: ReviewerContribution[]) {
  return reviewers.map(r => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    specialty: r.specialty,
    reviewCount: r.review_count,
    impactScore: r.impact_score,
  }));
}
