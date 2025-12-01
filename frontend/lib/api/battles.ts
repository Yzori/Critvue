/**
 * Battles API Client
 *
 * Functions for the 1v1 creative battle system:
 * - Battle prompts
 * - Battle CRUD
 * - Queue matchmaking
 * - Challenges
 * - Entries
 * - Voting
 * - Leaderboards
 */

import apiClient from './client';

// ==================== Enums ====================

export type ContentType = 'design' | 'code' | 'video' | 'stream' | 'audio' | 'writing' | 'art';
export type BattleStatus = 'pending' | 'active' | 'voting' | 'completed' | 'cancelled' | 'draw';
export type BattleType = 'queue' | 'direct_challenge';
export type PromptDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// ==================== Types ====================

export interface BattlePrompt {
  id: number;
  title: string;
  description: string;
  contentType: ContentType;
  difficulty: PromptDifficulty;
  isActive: boolean;
  timesUsed: number;
  createdAt: string;
}

export interface BattleEntry {
  id: number;
  battleId: number;
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
}

export interface BattleChallenge {
  id: number;
  battleId: number;
  challengerId: number;
  challengedId: number;
  message?: string;
  status: ChallengeStatus;
  expiresAt: string;
  createdAt: string;
  respondedAt?: string;
  challengerName?: string;
  challengerAvatar?: string;
  challengedName?: string;
  challengedAvatar?: string;
}

export interface BattleVote {
  id: number;
  battleId: number;
  voterId: number;
  entryId: number;
  votedAt: string;
}

export interface BattleVoteStats {
  totalVotes: number;
  creatorVotes: number;
  opponentVotes: number;
  creatorPercentage: number;
  opponentPercentage: number;
}

export interface Battle {
  id: number;
  title: string;
  contentType: ContentType;
  promptId: number;
  creatorId: number;
  opponentId?: number;
  winnerId?: number;
  battleType: BattleType;
  status: BattleStatus;
  submissionHours: number;
  votingHours: number;
  submissionDeadline?: string;
  votingDeadline?: string;
  creatorVotes: number;
  opponentVotes: number;
  totalVotes: number;
  winnerKarmaReward?: number;
  loserKarmaChange?: number;
  createdAt: string;
  startedAt?: string;
  votingStartedAt?: string;
  completedAt?: string;
  prompt?: BattlePrompt;
  entries: BattleEntry[];
  challenge?: BattleChallenge;
  creatorName?: string;
  creatorAvatar?: string;
  opponentName?: string;
  opponentAvatar?: string;
  winnerName?: string;
  currentUserEntry?: BattleEntry;
  currentUserVoted: boolean;
  currentUserVoteEntryId?: number;
}

export interface BattleListResponse {
  items: Battle[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
}

export interface BattlePromptListResponse {
  items: BattlePrompt[];
  total: number;
}

export interface QueueStatus {
  inQueue: boolean;
  contentType?: ContentType;
  promptId?: number;
  promptTitle?: string;
  joinedAt?: string;
  estimatedWait?: string;
}

export interface BattleStats {
  battlesWon: number;
  battlesLost: number;
  battlesDrawn: number;
  totalBattles: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  totalVotesReceived: number;
  totalVotesCast: number;
}

export interface BattleLeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  battlesWon: number;
  winRate: number;
  bestStreak: number;
}

export interface BattleLeaderboardResponse {
  entries: BattleLeaderboardEntry[];
  totalParticipants: number;
  currentUserRank?: number;
}

// ==================== API Request Types ====================

export interface CreateBattleRequest {
  title: string;
  contentType: ContentType;
  promptId: number;
  battleType?: BattleType;
  submissionHours?: number;
  votingHours?: number;
  challengedUserId?: number;
  challengeMessage?: string;
}

export interface JoinQueueRequest {
  contentType: ContentType;
  promptId: number;
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

interface ApiBattlePrompt {
  id: number;
  title: string;
  description: string;
  content_type: string;
  difficulty: string;
  is_active: boolean;
  times_used: number;
  created_at: string;
}

interface ApiBattleEntry {
  id: number;
  battle_id: number;
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
}

interface ApiBattleChallenge {
  id: number;
  battle_id: number;
  challenger_id: number;
  challenged_id: number;
  message?: string;
  status: string;
  expires_at: string;
  created_at: string;
  responded_at?: string;
  challenger_name?: string;
  challenger_avatar?: string;
  challenged_name?: string;
  challenged_avatar?: string;
}

interface ApiBattle {
  id: number;
  title: string;
  content_type: string;
  prompt_id: number;
  creator_id: number;
  opponent_id?: number;
  winner_id?: number;
  battle_type: string;
  status: string;
  submission_hours: number;
  voting_hours: number;
  submission_deadline?: string;
  voting_deadline?: string;
  creator_votes: number;
  opponent_votes: number;
  total_votes: number;
  winner_karma_reward?: number;
  loser_karma_change?: number;
  created_at: string;
  started_at?: string;
  voting_started_at?: string;
  completed_at?: string;
  prompt?: ApiBattlePrompt;
  entries: ApiBattleEntry[];
  challenge?: ApiBattleChallenge;
  creator_name?: string;
  creator_avatar?: string;
  opponent_name?: string;
  opponent_avatar?: string;
  winner_name?: string;
  current_user_entry?: ApiBattleEntry;
  current_user_voted: boolean;
  current_user_vote_entry_id?: number;
}

interface ApiBattleListResponse {
  items: ApiBattle[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

interface ApiBattlePromptListResponse {
  items: ApiBattlePrompt[];
  total: number;
}

interface ApiQueueStatus {
  in_queue: boolean;
  content_type?: string;
  prompt_id?: number;
  prompt_title?: string;
  joined_at?: string;
  estimated_wait?: string;
}

interface ApiBattleStats {
  battles_won: number;
  battles_lost: number;
  battles_drawn: number;
  total_battles: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  total_votes_received: number;
  total_votes_cast: number;
}

interface ApiBattleLeaderboardEntry {
  rank: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  battles_won: number;
  win_rate: number;
  best_streak: number;
}

interface ApiBattleLeaderboardResponse {
  entries: ApiBattleLeaderboardEntry[];
  total_participants: number;
  current_user_rank?: number;
}

interface ApiBattleVote {
  id: number;
  battle_id: number;
  voter_id: number;
  entry_id: number;
  voted_at: string;
}

interface ApiBattleVoteStats {
  total_votes: number;
  creator_votes: number;
  opponent_votes: number;
  creator_percentage: number;
  opponent_percentage: number;
}

// ==================== Transform Functions ====================

function transformPrompt(api: ApiBattlePrompt): BattlePrompt {
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

function transformEntry(api: ApiBattleEntry): BattleEntry {
  return {
    id: api.id,
    battleId: api.battle_id,
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
  };
}

function transformChallenge(api: ApiBattleChallenge): BattleChallenge {
  return {
    id: api.id,
    battleId: api.battle_id,
    challengerId: api.challenger_id,
    challengedId: api.challenged_id,
    message: api.message,
    status: api.status as ChallengeStatus,
    expiresAt: api.expires_at,
    createdAt: api.created_at,
    respondedAt: api.responded_at,
    challengerName: api.challenger_name,
    challengerAvatar: api.challenger_avatar,
    challengedName: api.challenged_name,
    challengedAvatar: api.challenged_avatar,
  };
}

function transformBattle(api: ApiBattle): Battle {
  return {
    id: api.id,
    title: api.title,
    contentType: api.content_type as ContentType,
    promptId: api.prompt_id,
    creatorId: api.creator_id,
    opponentId: api.opponent_id,
    winnerId: api.winner_id,
    battleType: api.battle_type as BattleType,
    status: api.status as BattleStatus,
    submissionHours: api.submission_hours,
    votingHours: api.voting_hours,
    submissionDeadline: api.submission_deadline,
    votingDeadline: api.voting_deadline,
    creatorVotes: api.creator_votes,
    opponentVotes: api.opponent_votes,
    totalVotes: api.total_votes,
    winnerKarmaReward: api.winner_karma_reward,
    loserKarmaChange: api.loser_karma_change,
    createdAt: api.created_at,
    startedAt: api.started_at,
    votingStartedAt: api.voting_started_at,
    completedAt: api.completed_at,
    prompt: api.prompt ? transformPrompt(api.prompt) : undefined,
    entries: api.entries.map(transformEntry),
    challenge: api.challenge ? transformChallenge(api.challenge) : undefined,
    creatorName: api.creator_name,
    creatorAvatar: api.creator_avatar,
    opponentName: api.opponent_name,
    opponentAvatar: api.opponent_avatar,
    winnerName: api.winner_name,
    currentUserEntry: api.current_user_entry ? transformEntry(api.current_user_entry) : undefined,
    currentUserVoted: api.current_user_voted,
    currentUserVoteEntryId: api.current_user_vote_entry_id,
  };
}

// ==================== API Functions - Prompts ====================

/**
 * Get available battle prompts
 */
export async function getBattlePrompts(
  contentType?: ContentType,
  limit: number = 50
): Promise<BattlePromptListResponse> {
  const params = new URLSearchParams();
  if (contentType) params.append('content_type', contentType);
  params.append('limit', limit.toString());

  const response = await apiClient.get<ApiBattlePromptListResponse>(
    `/battles/prompts?${params.toString()}`
  );

  return {
    items: response.items.map(transformPrompt),
    total: response.total,
  };
}

/**
 * Get a specific prompt by ID
 */
export async function getBattlePrompt(promptId: number): Promise<BattlePrompt> {
  const response = await apiClient.get<ApiBattlePrompt>(`/battles/prompts/${promptId}`);
  return transformPrompt(response);
}

// ==================== API Functions - Battles ====================

/**
 * Create a new battle
 */
export async function createBattle(data: CreateBattleRequest): Promise<Battle> {
  const response = await apiClient.post<ApiBattle>('/battles', {
    title: data.title,
    content_type: data.contentType,
    prompt_id: data.promptId,
    battle_type: data.battleType || 'queue',
    submission_hours: data.submissionHours || 72,
    voting_hours: data.votingHours || 48,
    challenged_user_id: data.challengedUserId,
    challenge_message: data.challengeMessage,
  });
  return transformBattle(response);
}

/**
 * Get battles with optional filters
 */
export async function getBattles(
  status?: BattleStatus,
  contentType?: ContentType,
  userId?: number,
  skip: number = 0,
  limit: number = 20
): Promise<BattleListResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status_filter', status);
  if (contentType) params.append('content_type', contentType);
  if (userId) params.append('user_id', userId.toString());
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const response = await apiClient.get<ApiBattleListResponse>(`/battles?${params.toString()}`);

  return {
    items: response.items.map(transformBattle),
    total: response.total,
    skip: response.skip,
    limit: response.limit,
    hasMore: response.has_more,
  };
}

/**
 * Get a specific battle by ID
 */
export async function getBattle(battleId: number): Promise<Battle> {
  const response = await apiClient.get<ApiBattle>(`/battles/${battleId}`);
  return transformBattle(response);
}

/**
 * Get active battles (in voting phase)
 */
export async function getActiveBattles(
  contentType?: ContentType,
  limit: number = 20
): Promise<Battle[]> {
  const params = new URLSearchParams();
  if (contentType) params.append('content_type', contentType);
  params.append('limit', limit.toString());

  const response = await apiClient.get<ApiBattle[]>(`/battles/active?${params.toString()}`);
  return response.map(transformBattle);
}

/**
 * Get current user's battles
 */
export async function getMyBattles(
  status?: BattleStatus,
  skip: number = 0,
  limit: number = 20
): Promise<BattleListResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status_filter', status);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());

  const response = await apiClient.get<ApiBattleListResponse>(`/battles/my?${params.toString()}`);

  return {
    items: response.items.map(transformBattle),
    total: response.total,
    skip: response.skip,
    limit: response.limit,
    hasMore: response.has_more,
  };
}

/**
 * Get pending challenges for current user
 */
export async function getPendingChallenges(): Promise<Battle[]> {
  const response = await apiClient.get<ApiBattle[]>('/battles/challenges/pending');
  return response.map(transformBattle);
}

// ==================== API Functions - Queue ====================

/**
 * Join the matchmaking queue
 */
export async function joinQueue(data: JoinQueueRequest): Promise<Battle> {
  const response = await apiClient.post<ApiBattle>('/battles/queue/join', {
    content_type: data.contentType,
    prompt_id: data.promptId,
  });
  return transformBattle(response);
}

/**
 * Get queue status
 */
export async function getQueueStatus(): Promise<QueueStatus> {
  const response = await apiClient.get<ApiQueueStatus>('/battles/queue/status');
  return {
    inQueue: response.in_queue,
    contentType: response.content_type as ContentType | undefined,
    promptId: response.prompt_id,
    promptTitle: response.prompt_title,
    joinedAt: response.joined_at,
    estimatedWait: response.estimated_wait,
  };
}

/**
 * Leave the matchmaking queue
 */
export async function leaveQueue(): Promise<void> {
  await apiClient.delete('/battles/queue/leave');
}

// ==================== API Functions - Challenges ====================

/**
 * Accept a battle challenge
 */
export async function acceptChallenge(battleId: number): Promise<Battle> {
  const response = await apiClient.post<ApiBattle>(`/battles/${battleId}/accept`);
  return transformBattle(response);
}

/**
 * Decline a battle challenge
 */
export async function declineChallenge(battleId: number): Promise<Battle> {
  const response = await apiClient.post<ApiBattle>(`/battles/${battleId}/decline`);
  return transformBattle(response);
}

// ==================== API Functions - Entries ====================

/**
 * Create or update a battle entry
 */
export async function createEntry(
  battleId: number,
  data: CreateEntryRequest
): Promise<BattleEntry> {
  const response = await apiClient.post<ApiBattleEntry>(`/battles/${battleId}/entries`, {
    title: data.title,
    description: data.description,
    file_urls: data.fileUrls,
    external_links: data.externalLinks,
    thumbnail_url: data.thumbnailUrl,
  });
  return transformEntry(response);
}

/**
 * Submit (finalize) a battle entry
 */
export async function submitEntry(battleId: number): Promise<BattleEntry> {
  const response = await apiClient.post<ApiBattleEntry>(`/battles/${battleId}/entries/submit`);
  return transformEntry(response);
}

/**
 * Get entries for a battle
 */
export async function getBattleEntries(battleId: number): Promise<BattleEntry[]> {
  const response = await apiClient.get<ApiBattleEntry[]>(`/battles/${battleId}/entries`);
  return response.map(transformEntry);
}

// ==================== API Functions - Voting ====================

/**
 * Cast a vote for an entry
 */
export async function castVote(battleId: number, entryId: number): Promise<BattleVote> {
  const response = await apiClient.post<ApiBattleVote>(`/battles/${battleId}/vote`, {
    entry_id: entryId,
  });
  return {
    id: response.id,
    battleId: response.battle_id,
    voterId: response.voter_id,
    entryId: response.entry_id,
    votedAt: response.voted_at,
  };
}

/**
 * Get vote statistics for a battle
 */
export async function getVoteStats(battleId: number): Promise<BattleVoteStats> {
  const response = await apiClient.get<ApiBattleVoteStats>(`/battles/${battleId}/votes`);
  return {
    totalVotes: response.total_votes,
    creatorVotes: response.creator_votes,
    opponentVotes: response.opponent_votes,
    creatorPercentage: response.creator_percentage,
    opponentPercentage: response.opponent_percentage,
  };
}

// ==================== API Functions - Stats & Leaderboard ====================

/**
 * Get current user's battle statistics
 */
export async function getMyBattleStats(): Promise<BattleStats> {
  const response = await apiClient.get<ApiBattleStats>('/battles/stats/me');
  return {
    battlesWon: response.battles_won,
    battlesLost: response.battles_lost,
    battlesDrawn: response.battles_drawn,
    totalBattles: response.total_battles,
    winRate: response.win_rate,
    currentStreak: response.current_streak,
    bestStreak: response.best_streak,
    totalVotesReceived: response.total_votes_received,
    totalVotesCast: response.total_votes_cast,
  };
}

/**
 * Get a user's battle statistics
 */
export async function getUserBattleStats(userId: number): Promise<BattleStats> {
  const response = await apiClient.get<ApiBattleStats>(`/battles/stats/${userId}`);
  return {
    battlesWon: response.battles_won,
    battlesLost: response.battles_lost,
    battlesDrawn: response.battles_drawn,
    totalBattles: response.total_battles,
    winRate: response.win_rate,
    currentStreak: response.current_streak,
    bestStreak: response.best_streak,
    totalVotesReceived: response.total_votes_received,
    totalVotesCast: response.total_votes_cast,
  };
}

/**
 * Get battle leaderboard
 */
export async function getBattleLeaderboard(limit: number = 50): Promise<BattleLeaderboardResponse> {
  const response = await apiClient.get<ApiBattleLeaderboardResponse>(
    `/battles/leaderboard?limit=${limit}`
  );
  return {
    entries: response.entries.map((e) => ({
      rank: e.rank,
      userId: e.user_id,
      userName: e.user_name,
      userAvatar: e.user_avatar,
      battlesWon: e.battles_won,
      winRate: e.win_rate,
      bestStreak: e.best_streak,
    })),
    totalParticipants: response.total_participants,
    currentUserRank: response.current_user_rank,
  };
}

// ==================== Utility Functions ====================

/**
 * Get time remaining until deadline
 */
export function getTimeRemaining(deadline: string): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
  formatted: string;
} {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true, formatted: 'Expired' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let formatted = '';
  if (days > 0) formatted = `${days}d ${hours}h`;
  else if (hours > 0) formatted = `${hours}h ${minutes}m`;
  else formatted = `${minutes}m`;

  return { days, hours, minutes, isExpired: false, formatted };
}

/**
 * Get status display info
 */
export function getBattleStatusInfo(status: BattleStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const statusMap: Record<BattleStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Waiting for Opponent', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    active: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    voting: { label: 'Voting Open', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    draw: { label: 'Draw', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  };
  return statusMap[status];
}

/**
 * Get content type icon and label
 */
export function getContentTypeInfo(contentType: ContentType): {
  label: string;
  icon: string;
  color: string;
} {
  const typeMap: Record<ContentType, { label: string; icon: string; color: string }> = {
    design: { label: 'Design', icon: 'Palette', color: 'text-pink-500' },
    code: { label: 'Code', icon: 'Code', color: 'text-green-500' },
    video: { label: 'Video', icon: 'Video', color: 'text-red-500' },
    stream: { label: 'Stream', icon: 'Radio', color: 'text-orange-500' },
    audio: { label: 'Audio', icon: 'Headphones', color: 'text-yellow-500' },
    writing: { label: 'Writing', icon: 'FileText', color: 'text-blue-500' },
    art: { label: 'Art', icon: 'Brush', color: 'text-purple-500' },
  };
  return typeMap[contentType] || { label: contentType, icon: 'FileText', color: 'text-gray-500' };
}
