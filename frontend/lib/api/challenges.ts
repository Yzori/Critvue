/**
 * Challenges API Client
 *
 * Functions for the platform-curated creative challenges system:
 * - Challenge prompts
 * - Challenge CRUD (admin)
 * - 1v1 Invitations
 * - Category participation
 * - Entries
 * - Voting
 * - Leaderboards
 */

import apiClient from './client';

// ==================== Enums ====================

export type ContentType = 'design' | 'photography' | 'video' | 'stream' | 'audio' | 'writing' | 'art';
export type ChallengeStatus = 'draft' | 'inviting' | 'open' | 'active' | 'voting' | 'completed' | 'cancelled' | 'draw';
export type ChallengeType = 'one_on_one' | 'category';
export type PromptDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'replaced';
export type InvitationMode = 'admin_curated' | 'open_slots';

// ==================== Types ====================

export interface ChallengePrompt {
  id: number;
  title: string;
  description: string;
  contentType: ContentType;
  difficulty: PromptDifficulty;
  isActive: boolean;
  timesUsed: number;
  createdAt: string;
}

export interface ChallengeEntry {
  id: number;
  challengeId: number;
  userId: number;
  title: string;
  description?: string;
  fileUrls?: Array<{ url: string; filename: string; size: number; type: string }>;
  externalLinks?: Array<{ url: string; type: string; title?: string }>;
  thumbnailUrl?: string;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  userName?: string;
  userAvatar?: string;
  userTier?: string;
}

export interface ChallengeInvitation {
  id: number;
  challengeId: number;
  userId: number;
  slot: number;
  status: InvitationStatus;
  message?: string;
  expiresAt: string;
  createdAt: string;
  respondedAt?: string;
  userName?: string;
  userAvatar?: string;
  userTier?: string;
}

export interface ChallengeParticipant {
  id: number;
  challengeId: number;
  userId: number;
  joinedAt: string;
  placement?: number;
  karmaEarned?: number;
  userName?: string;
  userAvatar?: string;
  userTier?: string;
}

export interface ChallengeVote {
  id: number;
  challengeId: number;
  voterId: number;
  entryId: number;
  votedAt: string;
}

export interface ChallengeVoteStats {
  totalVotes: number;
  participant1Votes?: number;
  participant2Votes?: number;
  participant1Percentage?: number;
  participant2Percentage?: number;
  topEntries?: Array<{ entryId: number; userId: number; votes: number }>;
}

export interface Challenge {
  id: number;
  title: string;
  description?: string;
  challengeType: ChallengeType;
  contentType: ContentType;
  promptId?: number;
  status: ChallengeStatus;
  submissionHours: number;
  votingHours: number;
  submissionDeadline?: string;
  votingDeadline?: string;
  maxWinners: number;
  totalEntries: number;
  participant1Id?: number;
  participant2Id?: number;
  winnerId?: number;
  participant1Votes: number;
  participant2Votes: number;
  // Open slots mode for 1v1
  invitationMode: InvitationMode;
  slotsOpenAt?: string;
  slotsCloseAt?: string;
  hasOpenSlots: boolean;
  availableSlots: number;
  // Display
  isFeatured: boolean;
  bannerImageUrl?: string;
  prizeDescription?: string;
  totalVotes: number;
  winnerKarmaReward?: number;
  createdAt: string;
  startedAt?: string;
  votingStartedAt?: string;
  completedAt?: string;
  createdBy: number;
  prompt?: ChallengePrompt;
  entries: ChallengeEntry[];
  invitations: ChallengeInvitation[];
  participant1Name?: string;
  participant1Avatar?: string;
  participant2Name?: string;
  participant2Avatar?: string;
  winnerName?: string;
  creatorName?: string;
  currentUserEntry?: ChallengeEntry;
  currentUserVoted: boolean;
  currentUserVoteEntryId?: number;
  currentUserInvitation?: ChallengeInvitation;
  currentUserIsParticipant: boolean;
}

export interface ChallengeListResponse {
  items: Challenge[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
}

export interface ChallengePromptListResponse {
  items: ChallengePrompt[];
  total: number;
}

export interface ChallengeStats {
  challengesWon: number;
  challengesLost: number;
  challengesDrawn: number;
  totalChallenges: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  totalVotesReceived: number;
  totalVotesCast: number;
  categoryParticipations: number;
}

export interface ChallengeLeaderboardEntry {
  rank: number;
  userId: number;
  username?: string;  // SEO-friendly URL identifier
  userName: string;
  userAvatar?: string;
  userTier?: string;
  challengesWon: number;
  winRate: number;
  bestStreak: number;
}

export interface ChallengeLeaderboardResponse {
  entries: ChallengeLeaderboardEntry[];
  totalParticipants: number;
  currentUserRank?: number;
}

// Open Slots types
export interface OpenSlotChallenge {
  id: number;
  title: string;
  description?: string;
  contentType: ContentType;
  prompt?: ChallengePrompt;
  availableSlots: number;
  slotsCloseAt?: string;
  submissionHours: number;
  votingHours: number;
  prizeDescription?: string;
  winnerKarmaReward?: number;
  isFeatured: boolean;
  participant1Id?: number;
  participant1Name?: string;
  participant1Avatar?: string;
}

export interface SlotClaimResponse {
  challengeId: number;
  userId: number;
  slot: number;
  claimedAt: string;
  challengeActivated: boolean;
}

// ==================== API Request Types ====================

export interface CreateChallengeRequest {
  title: string;
  description?: string;
  contentType: ContentType;
  challengeType: ChallengeType;
  promptId?: number;
  submissionHours?: number;
  votingHours?: number;
  maxWinners?: number;
  invitationMode?: InvitationMode; // For 1v1: admin_curated or open_slots
  isFeatured?: boolean;
  bannerImageUrl?: string;
  prizeDescription?: string;
}

export interface UpdateChallengeRequest {
  title?: string;
  description?: string;
  submissionHours?: number;
  votingHours?: number;
  maxWinners?: number;
  isFeatured?: boolean;
  bannerImageUrl?: string;
  prizeDescription?: string;
}

export interface InviteCreatorRequest {
  userId: number;
  slot: 1 | 2;
  message?: string;
}

export interface ReplaceInvitationRequest {
  newUserId: number;
  message?: string;
}

export interface CreateEntryRequest {
  title: string;
  description?: string;
  fileUrls?: Array<{ url: string; filename: string; size: number; type: string }>;
  externalLinks?: Array<{ url: string; type: string; title?: string }>;
  thumbnailUrl?: string;
}

export interface CastVoteRequest {
  entryId: number;
}

// ==================== API Response Types (snake_case from backend) ====================

interface ApiChallengePrompt {
  id: number;
  title: string;
  description: string;
  content_type: string;
  difficulty: string;
  is_active: boolean;
  times_used: number;
  created_at: string;
}

interface ApiChallengeEntry {
  id: number;
  challenge_id: number;
  user_id: number;
  title: string;
  description?: string;
  file_urls?: Array<{ url: string; filename: string; size: number; type: string }>;
  external_links?: Array<{ url: string; type: string; title?: string }>;
  thumbnail_url?: string;
  vote_count: number;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  user_name?: string;
  user_avatar?: string;
  user_tier?: string;
}

interface ApiChallengeInvitation {
  id: number;
  challenge_id: number;
  user_id: number;
  slot: number;
  status: string;
  message?: string;
  expires_at: string;
  created_at: string;
  responded_at?: string;
  user_name?: string;
  user_avatar?: string;
  user_tier?: string;
}

interface ApiChallengeParticipant {
  id: number;
  challenge_id: number;
  user_id: number;
  joined_at: string;
  placement?: number;
  karma_earned?: number;
  user_name?: string;
  user_avatar?: string;
  user_tier?: string;
}

interface ApiChallenge {
  id: number;
  title: string;
  description?: string;
  challenge_type: string;
  content_type: string;
  prompt_id?: number;
  status: string;
  submission_hours: number;
  voting_hours: number;
  submission_deadline?: string;
  voting_deadline?: string;
  max_winners: number;
  total_entries: number;
  participant1_id?: number;
  participant2_id?: number;
  winner_id?: number;
  participant1_votes: number;
  participant2_votes: number;
  // Open slots mode
  invitation_mode: string;
  slots_open_at?: string;
  slots_close_at?: string;
  has_open_slots: boolean;
  available_slots: number;
  // Display
  is_featured: boolean;
  banner_image_url?: string;
  prize_description?: string;
  total_votes: number;
  winner_karma_reward?: number;
  created_at: string;
  started_at?: string;
  voting_started_at?: string;
  completed_at?: string;
  created_by: number;
  prompt?: ApiChallengePrompt;
  entries: ApiChallengeEntry[];
  invitations: ApiChallengeInvitation[];
  participant1_name?: string;
  participant1_avatar?: string;
  participant2_name?: string;
  participant2_avatar?: string;
  winner_name?: string;
  creator_name?: string;
  current_user_entry?: ApiChallengeEntry;
  current_user_voted: boolean;
  current_user_vote_entry_id?: number;
  current_user_invitation?: ApiChallengeInvitation;
  current_user_is_participant: boolean;
}

interface ApiChallengeListResponse {
  items: ApiChallenge[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

interface ApiChallengePromptListResponse {
  items: ApiChallengePrompt[];
  total: number;
}

interface ApiChallengeStats {
  challenges_won: number;
  challenges_lost: number;
  challenges_drawn: number;
  total_challenges: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  total_votes_received: number;
  total_votes_cast: number;
  category_participations: number;
}

interface ApiChallengeLeaderboardEntry {
  rank: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  user_tier?: string;
  challenges_won: number;
  win_rate: number;
  best_streak: number;
}

interface ApiChallengeLeaderboardResponse {
  entries: ApiChallengeLeaderboardEntry[];
  total_participants: number;
  current_user_rank?: number;
}

interface ApiChallengeVote {
  id: number;
  challenge_id: number;
  voter_id: number;
  entry_id: number;
  voted_at: string;
}

interface ApiChallengeVoteStats {
  total_votes: number;
  participant1_votes?: number;
  participant2_votes?: number;
  participant1_percentage?: number;
  participant2_percentage?: number;
  top_entries?: Array<{ entry_id: number; user_id: number; votes: number }>;
}

interface ApiOpenSlotChallenge {
  id: number;
  title: string;
  description?: string;
  content_type: string;
  prompt?: ApiChallengePrompt;
  available_slots: number;
  slots_close_at?: string;
  submission_hours: number;
  voting_hours: number;
  prize_description?: string;
  winner_karma_reward?: number;
  is_featured: boolean;
  participant1_id?: number;
  participant1_name?: string;
  participant1_avatar?: string;
}

interface ApiSlotClaimResponse {
  challenge_id: number;
  user_id: number;
  slot: number;
  claimed_at: string;
  challenge_activated: boolean;
}

// ==================== Transform Functions ====================

function transformPrompt(api: ApiChallengePrompt): ChallengePrompt {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    contentType: api.content_type as ContentType,
    difficulty: api.difficulty as PromptDifficulty,
    isActive: api.is_active,
    timesUsed: api.times_used,
    createdAt: api.created_at,
  };
}

function transformEntry(api: ApiChallengeEntry): ChallengeEntry {
  return {
    id: api.id,
    challengeId: api.challenge_id,
    userId: api.user_id,
    title: api.title,
    description: api.description,
    fileUrls: api.file_urls,
    externalLinks: api.external_links,
    thumbnailUrl: api.thumbnail_url,
    voteCount: api.vote_count,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    submittedAt: api.submitted_at,
    userName: api.user_name,
    userAvatar: api.user_avatar,
    userTier: api.user_tier,
  };
}

function transformInvitation(api: ApiChallengeInvitation): ChallengeInvitation {
  return {
    id: api.id,
    challengeId: api.challenge_id,
    userId: api.user_id,
    slot: api.slot,
    status: api.status as InvitationStatus,
    message: api.message,
    expiresAt: api.expires_at,
    createdAt: api.created_at,
    respondedAt: api.responded_at,
    userName: api.user_name,
    userAvatar: api.user_avatar,
    userTier: api.user_tier,
  };
}

function transformParticipant(api: ApiChallengeParticipant): ChallengeParticipant {
  return {
    id: api.id,
    challengeId: api.challenge_id,
    userId: api.user_id,
    joinedAt: api.joined_at,
    placement: api.placement,
    karmaEarned: api.karma_earned,
    userName: api.user_name,
    userAvatar: api.user_avatar,
    userTier: api.user_tier,
  };
}

function transformChallenge(api: ApiChallenge): Challenge {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    challengeType: api.challenge_type as ChallengeType,
    contentType: api.content_type as ContentType,
    promptId: api.prompt_id,
    status: api.status as ChallengeStatus,
    submissionHours: api.submission_hours,
    votingHours: api.voting_hours,
    submissionDeadline: api.submission_deadline,
    votingDeadline: api.voting_deadline,
    maxWinners: api.max_winners,
    totalEntries: api.total_entries,
    participant1Id: api.participant1_id,
    participant2Id: api.participant2_id,
    winnerId: api.winner_id,
    participant1Votes: api.participant1_votes,
    participant2Votes: api.participant2_votes,
    // Open slots mode
    invitationMode: api.invitation_mode as InvitationMode,
    slotsOpenAt: api.slots_open_at,
    slotsCloseAt: api.slots_close_at,
    hasOpenSlots: api.has_open_slots,
    availableSlots: api.available_slots,
    // Display
    isFeatured: api.is_featured,
    bannerImageUrl: api.banner_image_url,
    prizeDescription: api.prize_description,
    totalVotes: api.total_votes,
    winnerKarmaReward: api.winner_karma_reward,
    createdAt: api.created_at,
    startedAt: api.started_at,
    votingStartedAt: api.voting_started_at,
    completedAt: api.completed_at,
    createdBy: api.created_by,
    prompt: api.prompt ? transformPrompt(api.prompt) : undefined,
    entries: api.entries.map(transformEntry),
    invitations: api.invitations.map(transformInvitation),
    participant1Name: api.participant1_name,
    participant1Avatar: api.participant1_avatar,
    participant2Name: api.participant2_name,
    participant2Avatar: api.participant2_avatar,
    winnerName: api.winner_name,
    creatorName: api.creator_name,
    currentUserEntry: api.current_user_entry ? transformEntry(api.current_user_entry) : undefined,
    currentUserVoted: api.current_user_voted,
    currentUserVoteEntryId: api.current_user_vote_entry_id,
    currentUserInvitation: api.current_user_invitation ? transformInvitation(api.current_user_invitation) : undefined,
    currentUserIsParticipant: api.current_user_is_participant,
  };
}

function transformOpenSlotChallenge(api: ApiOpenSlotChallenge): OpenSlotChallenge {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    contentType: api.content_type as ContentType,
    prompt: api.prompt ? transformPrompt(api.prompt) : undefined,
    availableSlots: api.available_slots,
    slotsCloseAt: api.slots_close_at,
    submissionHours: api.submission_hours,
    votingHours: api.voting_hours,
    prizeDescription: api.prize_description,
    winnerKarmaReward: api.winner_karma_reward,
    isFeatured: api.is_featured,
    participant1Id: api.participant1_id,
    participant1Name: api.participant1_name,
    participant1Avatar: api.participant1_avatar,
  };
}

// ==================== API Functions - Prompts ====================

/**
 * Get available challenge prompts
 */
export async function getChallengePrompts(
  contentType?: ContentType,
  limit: number = 50
): Promise<ChallengePromptListResponse> {
  const params = new URLSearchParams();
  if (contentType) params.append('content_type', contentType);
  params.append('limit', limit.toString());

  const response = await apiClient.get<ApiChallengePromptListResponse>(
    `/challenges/prompts?${params.toString()}`
  );

  return {
    items: response.items.map(transformPrompt),
    total: response.total,
  };
}

/**
 * Get a specific prompt by ID
 */
export async function getChallengePrompt(promptId: number): Promise<ChallengePrompt> {
  const response = await apiClient.get<ApiChallengePrompt>(`/challenges/prompts/${promptId}`);
  return transformPrompt(response);
}

// ==================== API Functions - Admin Prompt Management ====================

/**
 * Create a challenge prompt (admin only)
 */
export async function createChallengePrompt(data: {
  title: string;
  description: string;
  contentType: ContentType;
  difficulty?: PromptDifficulty;
  isActive?: boolean;
}): Promise<ChallengePrompt> {
  const response = await apiClient.post<ApiChallengePrompt>('/challenges/prompts', {
    title: data.title,
    description: data.description,
    content_type: data.contentType,
    difficulty: data.difficulty || 'intermediate',
    is_active: data.isActive ?? true,
  });
  return transformPrompt(response);
}

/**
 * Update a challenge prompt (admin only)
 */
export async function updateChallengePrompt(
  promptId: number,
  data: {
    title?: string;
    description?: string;
    contentType?: ContentType;
    difficulty?: PromptDifficulty;
    isActive?: boolean;
  }
): Promise<ChallengePrompt> {
  const response = await apiClient.put<ApiChallengePrompt>(`/challenges/prompts/${promptId}`, {
    title: data.title,
    description: data.description,
    content_type: data.contentType,
    difficulty: data.difficulty,
    is_active: data.isActive,
  });
  return transformPrompt(response);
}

/**
 * Delete a challenge prompt (admin only)
 */
export async function deleteChallengePrompt(promptId: number): Promise<void> {
  await apiClient.delete(`/challenges/prompts/${promptId}`);
}

// ==================== API Functions - Admin Challenge Management ====================

/**
 * Create a new challenge (admin only)
 */
export async function createChallenge(data: CreateChallengeRequest): Promise<Challenge> {
  const response = await apiClient.post<ApiChallenge>('/challenges/admin/create', {
    title: data.title,
    description: data.description,
    content_type: data.contentType,
    challenge_type: data.challengeType,
    prompt_id: data.promptId,
    submission_hours: data.submissionHours || 72,
    voting_hours: data.votingHours || 48,
    max_winners: data.maxWinners || 1,
    invitation_mode: data.invitationMode || 'admin_curated',
    is_featured: data.isFeatured || false,
    banner_image_url: data.bannerImageUrl,
    prize_description: data.prizeDescription,
  });
  return transformChallenge(response);
}

/**
 * Update a challenge (admin only, DRAFT status only)
 */
export async function updateChallenge(
  challengeId: number,
  data: UpdateChallengeRequest
): Promise<Challenge> {
  const response = await apiClient.put<ApiChallenge>(`/challenges/admin/${challengeId}`, {
    title: data.title,
    description: data.description,
    submission_hours: data.submissionHours,
    voting_hours: data.votingHours,
    max_winners: data.maxWinners,
    is_featured: data.isFeatured,
    banner_image_url: data.bannerImageUrl,
    prize_description: data.prizeDescription,
  });
  return transformChallenge(response);
}

/**
 * Invite a creator to a 1v1 challenge (admin only)
 */
export async function inviteCreator(
  challengeId: number,
  data: InviteCreatorRequest
): Promise<ChallengeInvitation> {
  const response = await apiClient.post<ApiChallengeInvitation>(
    `/challenges/admin/${challengeId}/invite`,
    {
      user_id: data.userId,
      slot: data.slot,
      message: data.message,
    }
  );
  return transformInvitation(response);
}

/**
 * Replace a declined invitation (admin only)
 */
export async function replaceInvitation(
  challengeId: number,
  slot: 1 | 2,
  data: ReplaceInvitationRequest
): Promise<ChallengeInvitation> {
  const response = await apiClient.post<ApiChallengeInvitation>(
    `/challenges/admin/${challengeId}/replace-invite?slot=${slot}`,
    {
      new_user_id: data.newUserId,
      message: data.message,
    }
  );
  return transformInvitation(response);
}

/**
 * Activate a 1v1 challenge (admin only)
 */
export async function activateChallenge(challengeId: number): Promise<Challenge> {
  const response = await apiClient.post<ApiChallenge>(
    `/challenges/admin/${challengeId}/activate`
  );
  return transformChallenge(response);
}

/**
 * Open a category challenge for entries (admin only)
 */
export async function openChallenge(challengeId: number): Promise<Challenge> {
  const response = await apiClient.post<ApiChallenge>(
    `/challenges/admin/${challengeId}/open`
  );
  return transformChallenge(response);
}

/**
 * Close submissions and start voting (admin only)
 */
export async function closeSubmissions(challengeId: number): Promise<Challenge> {
  const response = await apiClient.post<ApiChallenge>(
    `/challenges/admin/${challengeId}/close-submissions`
  );
  return transformChallenge(response);
}

/**
 * Complete a challenge and determine winners (admin only)
 */
export async function completeChallenge(challengeId: number): Promise<Challenge> {
  const response = await apiClient.post<ApiChallenge>(
    `/challenges/admin/${challengeId}/complete`
  );
  return transformChallenge(response);
}

/**
 * Open slots for a 1v1 challenge (admin only)
 * Makes the challenge available for first-come-first-served slot claiming
 */
export async function openChallengeSlots(
  challengeId: number,
  durationHours: number = 24
): Promise<Challenge> {
  const response = await apiClient.post<ApiChallenge>(
    `/challenges/admin/${challengeId}/open-slots`,
    { duration_hours: durationHours }
  );
  return transformChallenge(response);
}

// ==================== API Functions - Open Slots ====================

/**
 * Get 1v1 challenges with available slots for claiming
 */
export async function getOpenSlotChallenges(
  contentType?: ContentType,
  limit: number = 20
): Promise<OpenSlotChallenge[]> {
  const params = new URLSearchParams();
  if (contentType) params.append('content_type', contentType);
  params.append('limit', limit.toString());

  const response = await apiClient.get<ApiOpenSlotChallenge[]>(
    `/challenges/open-slots?${params.toString()}`
  );
  return response.map(transformOpenSlotChallenge);
}

/**
 * Claim a slot in an open slots 1v1 challenge
 * Auto-activates the challenge when both slots are filled
 */
export async function claimChallengeSlot(challengeId: number): Promise<SlotClaimResponse> {
  const response = await apiClient.post<ApiSlotClaimResponse>(
    `/challenges/${challengeId}/claim-slot`
  );
  return {
    challengeId: response.challenge_id,
    userId: response.user_id,
    slot: response.slot,
    claimedAt: response.claimed_at,
    challengeActivated: response.challenge_activated,
  };
}

// ==================== API Functions - Public Challenges ====================

/**
 * Get challenges with optional filters
 */
export async function getChallenges(
  status?: ChallengeStatus,
  challengeType?: ChallengeType,
  contentType?: ContentType,
  isFeatured?: boolean,
  skip: number = 0,
  limit: number = 20
): Promise<ChallengeListResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (challengeType) params.append('challenge_type', challengeType);
  if (contentType) params.append('content_type', contentType);
  if (isFeatured !== undefined) params.append('is_featured', isFeatured.toString());
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const response = await apiClient.get<ApiChallengeListResponse>(`/challenges?${params.toString()}`);

  return {
    items: response.items.map(transformChallenge),
    total: response.total,
    skip: response.skip,
    limit: response.limit,
    hasMore: response.has_more,
  };
}

/**
 * Get a specific challenge by ID
 */
export async function getChallenge(challengeId: number): Promise<Challenge> {
  const response = await apiClient.get<ApiChallenge>(`/challenges/${challengeId}`);
  return transformChallenge(response);
}

/**
 * Get active challenges (in voting phase)
 */
export async function getActiveChallenges(
  contentType?: ContentType,
  limit: number = 20
): Promise<Challenge[]> {
  const params = new URLSearchParams();
  if (contentType) params.append('content_type', contentType);
  params.append('limit', limit.toString());

  const response = await apiClient.get<ApiChallenge[]>(`/challenges/active?${params.toString()}`);
  return response.map(transformChallenge);
}

// ==================== API Functions - User Invitations ====================

/**
 * Get pending invitations for current user
 */
export async function getMyInvitations(): Promise<ChallengeInvitation[]> {
  const response = await apiClient.get<ApiChallengeInvitation[]>('/challenges/invitations/pending');
  return response.map(transformInvitation);
}

/**
 * Respond to an invitation (accept or decline)
 */
export async function respondToInvitation(
  invitationId: number,
  accept: boolean
): Promise<ChallengeInvitation> {
  const response = await apiClient.post<ApiChallengeInvitation>(
    `/challenges/invitations/${invitationId}/respond`,
    { accept }
  );
  return transformInvitation(response);
}

// ==================== API Functions - Category Challenges ====================

/**
 * Join a category challenge
 */
export async function joinCategoryChallenge(challengeId: number): Promise<ChallengeParticipant> {
  const response = await apiClient.post<ApiChallengeParticipant>(
    `/challenges/${challengeId}/join`
  );
  return transformParticipant(response);
}

// ==================== API Functions - Entries ====================

/**
 * Create or update an entry
 */
export async function createEntry(
  challengeId: number,
  data: CreateEntryRequest
): Promise<ChallengeEntry> {
  const response = await apiClient.post<ApiChallengeEntry>(`/challenges/${challengeId}/entries`, {
    title: data.title,
    description: data.description,
    file_urls: data.fileUrls,
    external_links: data.externalLinks,
    thumbnail_url: data.thumbnailUrl,
  });
  return transformEntry(response);
}

/**
 * Submit an entry (mark as final)
 */
export async function submitEntry(challengeId: number): Promise<ChallengeEntry> {
  const response = await apiClient.post<ApiChallengeEntry>(
    `/challenges/${challengeId}/entries/submit`
  );
  return transformEntry(response);
}

/**
 * Get entries for a challenge
 */
export async function getEntries(challengeId: number): Promise<ChallengeEntry[]> {
  const response = await apiClient.get<ApiChallengeEntry[]>(`/challenges/${challengeId}/entries`);
  return response.map(transformEntry);
}

// ==================== API Functions - Voting ====================

/**
 * Cast a vote for an entry
 */
export async function castVote(
  challengeId: number,
  data: CastVoteRequest
): Promise<ChallengeVote> {
  const response = await apiClient.post<ApiChallengeVote>(`/challenges/${challengeId}/vote`, {
    entry_id: data.entryId,
  });
  return {
    id: response.id,
    challengeId: response.challenge_id,
    voterId: response.voter_id,
    entryId: response.entry_id,
    votedAt: response.voted_at,
  };
}

/**
 * Get vote statistics for a challenge
 */
export async function getVoteStats(challengeId: number): Promise<ChallengeVoteStats> {
  const response = await apiClient.get<ApiChallengeVoteStats>(`/challenges/${challengeId}/votes`);
  return {
    totalVotes: response.total_votes,
    participant1Votes: response.participant1_votes,
    participant2Votes: response.participant2_votes,
    participant1Percentage: response.participant1_percentage,
    participant2Percentage: response.participant2_percentage,
    topEntries: response.top_entries?.map((e) => ({
      entryId: e.entry_id,
      userId: e.user_id,
      votes: e.votes,
    })),
  };
}

// ==================== API Functions - Statistics & Leaderboard ====================

/**
 * Get current user's challenge stats
 */
export async function getMyStats(): Promise<ChallengeStats> {
  const response = await apiClient.get<ApiChallengeStats>('/challenges/stats/me');
  return {
    challengesWon: response.challenges_won,
    challengesLost: response.challenges_lost,
    challengesDrawn: response.challenges_drawn,
    totalChallenges: response.total_challenges,
    winRate: response.win_rate,
    currentStreak: response.current_streak,
    bestStreak: response.best_streak,
    totalVotesReceived: response.total_votes_received,
    totalVotesCast: response.total_votes_cast,
    categoryParticipations: response.category_participations,
  };
}

/**
 * Get a user's challenge stats
 */
export async function getUserStats(userId: number): Promise<ChallengeStats> {
  const response = await apiClient.get<ApiChallengeStats>(`/challenges/stats/${userId}`);
  return {
    challengesWon: response.challenges_won,
    challengesLost: response.challenges_lost,
    challengesDrawn: response.challenges_drawn,
    totalChallenges: response.total_challenges,
    winRate: response.win_rate,
    currentStreak: response.current_streak,
    bestStreak: response.best_streak,
    totalVotesReceived: response.total_votes_received,
    totalVotesCast: response.total_votes_cast,
    categoryParticipations: response.category_participations,
  };
}

/**
 * Get challenge leaderboard
 */
export async function getLeaderboard(limit: number = 50): Promise<ChallengeLeaderboardResponse> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());

  const response = await apiClient.get<ApiChallengeLeaderboardResponse>(
    `/challenges/leaderboard?${params.toString()}`
  );

  return {
    entries: response.entries.map((e) => ({
      rank: e.rank,
      userId: e.user_id,
      userName: e.user_name,
      userAvatar: e.user_avatar,
      userTier: e.user_tier,
      challengesWon: e.challenges_won,
      winRate: e.win_rate,
      bestStreak: e.best_streak,
    })),
    totalParticipants: response.total_participants,
    currentUserRank: response.current_user_rank,
  };
}

// ==================== Helper Functions ====================

/**
 * Get time remaining until a deadline
 */
export function getTimeRemaining(deadline: string): {
  days: number;
  hours: number;
  minutes: number;
  total: number;
  isExpired: boolean;
} {
  const now = new Date().getTime();
  const end = new Date(deadline).getTime();
  const total = end - now;

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, total: 0, isExpired: true };
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, total, isExpired: false };
}

/**
 * Get display info for challenge status
 */
export function getChallengeStatusInfo(status: ChallengeStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const statusMap: Record<ChallengeStatus, { label: string; color: string; bgColor: string }> = {
    draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    inviting: { label: 'Inviting Creators', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    open: { label: 'Open for Entries', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    active: { label: 'Submissions Open', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    voting: { label: 'Voting Open', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100' },
    draw: { label: 'Draw', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  };
  return statusMap[status] || { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
}

/**
 * Get display info for challenge type
 */
export function getChallengeTypeInfo(type: ChallengeType): {
  label: string;
  description: string;
} {
  const typeMap: Record<ChallengeType, { label: string; description: string }> = {
    one_on_one: { label: '1v1 Challenge', description: 'Two creators compete head-to-head' },
    category: { label: 'Open Competition', description: 'Multiple participants compete for top spots' },
  };
  return typeMap[type];
}

/**
 * Get display info for content type
 */
export function getContentTypeInfo(contentType: ContentType): {
  label: string;
  icon: string;
  color: string;
} {
  const contentTypeMap: Record<ContentType, { label: string; icon: string; color: string }> = {
    design: { label: 'Design', icon: 'palette', color: 'text-pink-500' },
    photography: { label: 'Photography', icon: 'camera', color: 'text-blue-500' },
    video: { label: 'Video', icon: 'video', color: 'text-red-500' },
    stream: { label: 'Stream', icon: 'broadcast', color: 'text-purple-500' },
    audio: { label: 'Audio', icon: 'music', color: 'text-green-500' },
    writing: { label: 'Writing', icon: 'edit', color: 'text-yellow-500' },
    art: { label: 'Art', icon: 'brush', color: 'text-orange-500' },
  };
  return contentTypeMap[contentType];
}
