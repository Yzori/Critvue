/**
 * Mock data module for development and testing.
 *
 * This module provides centralized mock data that can be used
 * during development when the backend is unavailable or for
 * testing UI components in isolation.
 *
 * Usage:
 * ```ts
 * import { USE_MOCK_DATA, mockChallengeData } from '@/lib/mocks';
 *
 * if (USE_MOCK_DATA) {
 *   // Use mock data
 * }
 * ```
 */

export * from "./challenges";
