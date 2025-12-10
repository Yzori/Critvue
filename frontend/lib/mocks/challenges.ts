/**
 * Mock data for challenges feature development and testing.
 *
 * This file centralizes all mock data for the challenges system,
 * making it easy to toggle between mock and real API data.
 *
 * Usage:
 * ```ts
 * import { USE_MOCK_DATA, mockChallengeData } from '@/lib/mocks/challenges';
 *
 * if (USE_MOCK_DATA) {
 *   setBattles(mockChallengeData.battles1v1);
 * }
 * ```
 */

import type {
  Challenge,
  ChallengeStats,
  ChallengeLeaderboardEntry,
  OpenSlotChallenge,
} from "@/lib/api/challenges";

// Toggle this to switch between mock and real API data
export const USE_MOCK_DATA = true;

// Helper to generate dynamic dates relative to now
const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

// Avatar generator URL
const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

// ==================== 1v1 BATTLES ====================

export const mock1v1Battles: Challenge[] = [
  {
    id: 1,
    title: "Cyberpunk UI Battle",
    description:
      "Design a futuristic dashboard interface with neon aesthetics",
    challengeType: "one_on_one",
    contentType: "design",
    status: "voting",
    submissionHours: 48,
    votingHours: 24,
    votingDeadline: hoursFromNow(8),
    maxWinners: 1,
    totalEntries: 2,
    participant1Id: 1,
    participant2Id: 2,
    participant1Votes: 127,
    participant2Votes: 98,
    participant1Name: "PixelMaster",
    participant1Avatar: avatarUrl("PixelMaster"),
    participant2Name: "NeonDreamer",
    participant2Avatar: avatarUrl("NeonDreamer"),
    isFeatured: true,
    totalVotes: 225,
    createdAt: new Date().toISOString(),
    createdBy: 1,
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
  {
    id: 2,
    title: "Portrait Lighting Challenge",
    description: "Capture the most dramatic portrait lighting",
    challengeType: "one_on_one",
    contentType: "photography",
    status: "voting",
    submissionHours: 24,
    votingHours: 12,
    votingDeadline: hoursFromNow(4),
    maxWinners: 1,
    totalEntries: 2,
    participant1Id: 3,
    participant2Id: 4,
    participant1Votes: 45,
    participant2Votes: 52,
    participant1Name: "CodeNinja",
    participant1Avatar: avatarUrl("CodeNinja"),
    participant2Name: "ByteWizard",
    participant2Avatar: avatarUrl("ByteWizard"),
    isFeatured: false,
    totalVotes: 97,
    createdAt: new Date().toISOString(),
    createdBy: 1,
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
  {
    id: 3,
    title: "Motion Magic",
    description: "Create a mesmerizing loading animation",
    challengeType: "one_on_one",
    contentType: "design",
    status: "voting",
    submissionHours: 24,
    votingHours: 12,
    votingDeadline: hoursFromNow(2),
    maxWinners: 1,
    totalEntries: 2,
    participant1Id: 5,
    participant2Id: 6,
    participant1Votes: 78,
    participant2Votes: 65,
    participant1Name: "AnimateX",
    participant1Avatar: avatarUrl("AnimateX"),
    participant2Name: "FrameFlow",
    participant2Avatar: avatarUrl("FrameFlow"),
    isFeatured: false,
    totalVotes: 143,
    createdAt: new Date().toISOString(),
    createdBy: 1,
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
];

// ==================== OPEN CHALLENGES ====================

export const mockOpenChallenges: Challenge[] = [
  {
    id: 101,
    title: "Mobile App Redesign Sprint",
    description:
      "Reimagine a popular app's user experience with fresh, modern design principles.",
    challengeType: "category",
    contentType: "design",
    status: "open",
    submissionHours: 72,
    votingHours: 48,
    submissionDeadline: daysFromNow(3),
    maxWinners: 3,
    totalEntries: 24,
    participant1Votes: 0,
    participant2Votes: 0,
    isFeatured: true,
    totalVotes: 0,
    winnerKarmaReward: 100,
    prizeDescription: "Top 3 designs will be featured on our homepage",
    createdAt: new Date().toISOString(),
    createdBy: 1,
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
  {
    id: 102,
    title: "React Component Challenge",
    description:
      "Capture a stunning landscape photo showcasing natural light and composition.",
    challengeType: "category",
    contentType: "photography",
    status: "open",
    submissionHours: 48,
    votingHours: 24,
    submissionDeadline: daysFromNow(2),
    maxWinners: 1,
    totalEntries: 18,
    participant1Votes: 0,
    participant2Votes: 0,
    isFeatured: false,
    totalVotes: 0,
    winnerKarmaReward: 75,
    createdAt: new Date().toISOString(),
    createdBy: 1,
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
  {
    id: 103,
    title: "Short Film Festival",
    description:
      "Create a compelling 60-second short film on the theme of 'Connection'.",
    challengeType: "category",
    contentType: "video",
    status: "open",
    submissionHours: 168,
    votingHours: 72,
    submissionDeadline: daysFromNow(7),
    maxWinners: 5,
    totalEntries: 12,
    participant1Votes: 0,
    participant2Votes: 0,
    isFeatured: false,
    totalVotes: 0,
    winnerKarmaReward: 150,
    createdAt: new Date().toISOString(),
    createdBy: 1,
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
  {
    id: 104,
    title: "Podcast Intro Battle",
    description:
      "Produce a captivating 30-second podcast intro with music and voice.",
    challengeType: "category",
    contentType: "audio",
    status: "voting",
    submissionHours: 48,
    votingHours: 24,
    votingDeadline: daysFromNow(1),
    maxWinners: 1,
    totalEntries: 8,
    participant1Votes: 0,
    participant2Votes: 0,
    isFeatured: false,
    totalVotes: 45,
    winnerKarmaReward: 50,
    createdAt: new Date().toISOString(),
    createdBy: 1,
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
];

// ==================== OPEN SLOTS ====================

export const mockOpenSlots: OpenSlotChallenge[] = [
  {
    id: 201,
    title: "Brand Identity Duel",
    description: "Create a complete brand identity for a fictional startup",
    contentType: "design",
    availableSlots: 2,
    slotsCloseAt: hoursFromNow(12),
    submissionHours: 48,
    votingHours: 24,
    winnerKarmaReward: 75,
    isFeatured: true,
  },
  {
    id: 202,
    title: "Street Photography Showdown",
    description: "Capture the essence of urban life in a single frame",
    contentType: "photography",
    availableSlots: 1,
    slotsCloseAt: hoursFromNow(24),
    submissionHours: 72,
    votingHours: 48,
    winnerKarmaReward: 100,
    isFeatured: false,
    participant1Id: 5,
    participant1Name: "AnimateX",
    participant1Avatar: avatarUrl("AnimateX"),
  },
];

// ==================== LEADERBOARD ====================

export const mockLeaderboard: ChallengeLeaderboardEntry[] = [
  {
    rank: 1,
    userId: 1,
    userName: "PixelMaster",
    userAvatar: avatarUrl("PixelMaster"),
    challengesWon: 15,
    winRate: 78,
    bestStreak: 7,
  },
  {
    rank: 2,
    userId: 3,
    userName: "CodeNinja",
    userAvatar: avatarUrl("CodeNinja"),
    challengesWon: 12,
    winRate: 72,
    bestStreak: 5,
  },
  {
    rank: 3,
    userId: 5,
    userName: "AnimateX",
    userAvatar: avatarUrl("AnimateX"),
    challengesWon: 10,
    winRate: 67,
    bestStreak: 4,
  },
  {
    rank: 4,
    userId: 2,
    userName: "NeonDreamer",
    userAvatar: avatarUrl("NeonDreamer"),
    challengesWon: 8,
    winRate: 62,
    bestStreak: 3,
  },
  {
    rank: 5,
    userId: 7,
    userName: "TypeLord",
    userAvatar: avatarUrl("TypeLord"),
    challengesWon: 6,
    winRate: 55,
    bestStreak: 2,
  },
];

// ==================== USER STATS ====================

export const mockStats: ChallengeStats = {
  challengesWon: 8,
  challengesLost: 4,
  challengesDrawn: 1,
  totalChallenges: 13,
  winRate: 62,
  currentStreak: 3,
  bestStreak: 5,
  totalVotesReceived: 234,
  totalVotesCast: 47,
  categoryParticipations: 6,
};

// ==================== DETAIL PAGE CHALLENGES ====================

/**
 * Mock challenges for the detail page with full entry data
 */
export const mockChallengeDetails: Record<number, Challenge> = {
  1: {
    ...mock1v1Battles[0],
    entries: [
      {
        id: 1,
        challengeId: 1,
        userId: 1,
        title: "Neon Pulse Dashboard",
        description:
          "A sleek cyberpunk dashboard with animated neon elements and holographic displays",
        fileUrls: [
          {
            url: "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800",
            type: "image",
          },
        ],
        externalLinks: [],
        voteCount: 127,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        user: {
          id: 1,
          username: "PixelMaster",
          avatarUrl: avatarUrl("PixelMaster"),
        },
      },
      {
        id: 2,
        challengeId: 1,
        userId: 2,
        title: "Cyber Grid Interface",
        description:
          "Futuristic grid-based dashboard with glowing elements and dark mode aesthetics",
        fileUrls: [
          {
            url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
            type: "image",
          },
        ],
        externalLinks: [],
        voteCount: 98,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        user: {
          id: 2,
          username: "NeonDreamer",
          avatarUrl: avatarUrl("NeonDreamer"),
        },
      },
    ],
  },
  2: {
    ...mock1v1Battles[1],
    entries: [
      {
        id: 3,
        challengeId: 2,
        userId: 3,
        title: "Golden Hour Portrait",
        description: "Dramatic portrait shot during golden hour with rim lighting",
        fileUrls: [
          {
            url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800",
            type: "image",
          },
        ],
        externalLinks: [],
        voteCount: 45,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        user: {
          id: 3,
          username: "CodeNinja",
          avatarUrl: avatarUrl("CodeNinja"),
        },
      },
      {
        id: 4,
        challengeId: 2,
        userId: 4,
        title: "Shadow Play",
        description: "Dramatic lighting using harsh shadows and contrast",
        fileUrls: [
          {
            url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
            type: "image",
          },
        ],
        externalLinks: [],
        voteCount: 52,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        user: {
          id: 4,
          username: "ByteWizard",
          avatarUrl: avatarUrl("ByteWizard"),
        },
      },
    ],
  },
  3: {
    ...mock1v1Battles[2],
    entries: [
      {
        id: 5,
        challengeId: 3,
        userId: 5,
        title: "Orbital Loader",
        description: "Mesmerizing orbital animation with particles",
        fileUrls: [
          {
            url: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800",
            type: "image",
          },
        ],
        externalLinks: [],
        voteCount: 78,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        user: {
          id: 5,
          username: "AnimateX",
          avatarUrl: avatarUrl("AnimateX"),
        },
      },
      {
        id: 6,
        challengeId: 3,
        userId: 6,
        title: "Liquid Flow",
        description: "Fluid motion animation with morphing shapes",
        fileUrls: [
          {
            url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800",
            type: "image",
          },
        ],
        externalLinks: [],
        voteCount: 65,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        user: {
          id: 6,
          username: "FrameFlow",
          avatarUrl: avatarUrl("FrameFlow"),
        },
      },
    ],
  },
};

/**
 * Get mock challenge by ID
 */
export function getMockChallenge(id: number): Challenge | null {
  // Check detail challenges first (have entries)
  if (mockChallengeDetails[id]) {
    return mockChallengeDetails[id];
  }

  // Check 1v1 battles
  const battle = mock1v1Battles.find((b) => b.id === id);
  if (battle) return battle;

  // Check open challenges
  const openChallenge = mockOpenChallenges.find((c) => c.id === id);
  if (openChallenge) return openChallenge;

  return null;
}

// ==================== COMBINED EXPORT ====================

export const mockChallengeData = {
  battles1v1: mock1v1Battles,
  openChallenges: mockOpenChallenges,
  openSlots: mockOpenSlots,
  leaderboard: mockLeaderboard,
  stats: mockStats,
  details: mockChallengeDetails,
  getChallenge: getMockChallenge,
};
