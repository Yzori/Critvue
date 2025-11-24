/**
 * API Client Tests
 *
 * Tests for error handling, retry logic, and error message formatting
 */

import {
  ApiClientError,
  getErrorMessage,
  isRetryableError,
} from '@/lib/api/client';

describe('ApiClientError', () => {
  describe('constructor', () => {
    it('creates error with status-based message when no detail provided', () => {
      const error = new ApiClientError(500, {});
      expect(error.message).toBe('Server error. Please try again later.');
      expect(error.status).toBe(500);
    });

    it('creates error with detail string message', () => {
      const error = new ApiClientError(400, { detail: 'Invalid email format' });
      expect(error.message).toBe('Invalid email format');
    });

    it('creates error with validation error array', () => {
      const error = new ApiClientError(422, {
        detail: [
          { msg: 'Email is required', type: 'value_error' },
          { msg: 'Password too short', type: 'value_error' },
        ],
      });
      expect(error.message).toBe('Email is required, Password too short');
    });

    it('creates error with message field fallback', () => {
      const error = new ApiClientError(400, { message: 'Custom message' });
      expect(error.message).toBe('Custom message');
    });

    it('stores endpoint when provided', () => {
      const error = new ApiClientError(404, {}, '/api/v1/users/123');
      expect(error.endpoint).toBe('/api/v1/users/123');
    });
  });

  describe('isNetworkError', () => {
    it('returns true for status 0', () => {
      const error = new ApiClientError(0, { detail: 'Network error' });
      expect(error.isNetworkError()).toBe(true);
    });

    it('returns false for other status codes', () => {
      const error = new ApiClientError(500, {});
      expect(error.isNetworkError()).toBe(false);
    });
  });

  describe('isClientError', () => {
    it('returns true for 4xx status codes', () => {
      expect(new ApiClientError(400, {}).isClientError()).toBe(true);
      expect(new ApiClientError(401, {}).isClientError()).toBe(true);
      expect(new ApiClientError(404, {}).isClientError()).toBe(true);
      expect(new ApiClientError(422, {}).isClientError()).toBe(true);
      expect(new ApiClientError(499, {}).isClientError()).toBe(true);
    });

    it('returns false for non-4xx status codes', () => {
      expect(new ApiClientError(200, {}).isClientError()).toBe(false);
      expect(new ApiClientError(500, {}).isClientError()).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('returns true for 5xx status codes', () => {
      expect(new ApiClientError(500, {}).isServerError()).toBe(true);
      expect(new ApiClientError(502, {}).isServerError()).toBe(true);
      expect(new ApiClientError(503, {}).isServerError()).toBe(true);
    });

    it('returns false for non-5xx status codes', () => {
      expect(new ApiClientError(400, {}).isServerError()).toBe(false);
      expect(new ApiClientError(200, {}).isServerError()).toBe(false);
    });
  });

  describe('isRetryable', () => {
    it('returns true for network errors (status 0)', () => {
      expect(new ApiClientError(0, {}).isRetryable()).toBe(true);
    });

    it('returns true for server errors (5xx)', () => {
      expect(new ApiClientError(500, {}).isRetryable()).toBe(true);
      expect(new ApiClientError(502, {}).isRetryable()).toBe(true);
      expect(new ApiClientError(503, {}).isRetryable()).toBe(true);
    });

    it('returns true for rate limiting (429)', () => {
      expect(new ApiClientError(429, {}).isRetryable()).toBe(true);
    });

    it('returns false for client errors (4xx except 429)', () => {
      expect(new ApiClientError(400, {}).isRetryable()).toBe(false);
      expect(new ApiClientError(401, {}).isRetryable()).toBe(false);
      expect(new ApiClientError(404, {}).isRetryable()).toBe(false);
    });
  });
});

describe('getErrorMessage', () => {
  it('extracts message from ApiClientError', () => {
    const error = new ApiClientError(400, { detail: 'Bad request' });
    expect(getErrorMessage(error)).toBe('Bad request');
  });

  it('handles generic Error objects', () => {
    const error = new Error('Something went wrong');
    expect(getErrorMessage(error)).toBe('Something went wrong');
  });

  it('handles "Failed to fetch" network error', () => {
    const error = new Error('Failed to fetch');
    expect(getErrorMessage(error)).toBe(
      'Unable to connect to server. Please check your internet connection.'
    );
  });

  it('returns fallback message for unknown errors', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
    expect(getErrorMessage('string error')).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('isRetryableError', () => {
  it('returns true for retryable ApiClientError', () => {
    expect(isRetryableError(new ApiClientError(500, {}))).toBe(true);
    expect(isRetryableError(new ApiClientError(0, {}))).toBe(true);
    expect(isRetryableError(new ApiClientError(429, {}))).toBe(true);
  });

  it('returns false for non-retryable ApiClientError', () => {
    expect(isRetryableError(new ApiClientError(400, {}))).toBe(false);
    expect(isRetryableError(new ApiClientError(401, {}))).toBe(false);
    expect(isRetryableError(new ApiClientError(404, {}))).toBe(false);
  });

  it('returns true for "Failed to fetch" error', () => {
    expect(isRetryableError(new Error('Failed to fetch'))).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isRetryableError(new Error('Other error'))).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });
});

describe('Status code messages', () => {
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Please log in to continue.',
    403: "You don't have permission to perform this action.",
    404: 'The requested resource was not found.',
    409: 'This action conflicts with the current state.',
    422: 'The data provided is invalid.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service is currently unavailable. Please try again later.',
    504: 'Request timed out. Please try again.',
  };

  Object.entries(statusMessages).forEach(([status, expectedMessage]) => {
    it(`returns correct message for status ${status}`, () => {
      const error = new ApiClientError(parseInt(status), {});
      expect(error.message).toBe(expectedMessage);
    });
  });

  it('returns generic message for unknown status codes', () => {
    const error = new ApiClientError(418, {}); // I'm a teapot
    expect(error.message).toBe('Request failed (418)');
  });
});
