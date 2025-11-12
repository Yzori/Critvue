# Profile API Integration Guide

This guide shows how to integrate the new Profile and Portfolio backend APIs with the frontend.

## Quick Start

### 1. Create API Client Files

#### `/frontend/lib/api/profile.ts`

```typescript
import { apiClient } from './client';

export interface ProfileData {
  id: number;
  email: string;
  full_name: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  specialty_tags: string[];
  badges: string[];
  total_reviews_given: number;
  total_reviews_received: number;
  avg_rating: number | null;
  avg_response_time_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileStats {
  total_reviews_given: number;
  total_reviews_received: number;
  avg_rating: number | null;
  avg_response_time_hours: number | null;
  member_since: string;
}

export interface ProfileUpdateData {
  title?: string;
  bio?: string;
  specialty_tags?: string[];
}

export const profileApi = {
  /**
   * Get authenticated user's own profile
   */
  getMyProfile: async (): Promise<ProfileData> => {
    const response = await apiClient.get('/profile/me');
    return response.data;
  },

  /**
   * Get any user's public profile
   */
  getUserProfile: async (userId: number): Promise<ProfileData> => {
    const response = await apiClient.get(`/profile/${userId}`);
    return response.data;
  },

  /**
   * Update authenticated user's profile
   */
  updateProfile: async (data: ProfileUpdateData): Promise<ProfileData> => {
    const response = await apiClient.put('/profile/me', data);
    return response.data;
  },

  /**
   * Upload avatar image
   */
  uploadAvatar: async (file: File): Promise<{ avatar_url: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/profile/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Get detailed stats for a user
   */
  getUserStats: async (userId: number): Promise<ProfileStats> => {
    const response = await apiClient.get(`/profile/${userId}/stats`);
    return response.data;
  },

  /**
   * Recalculate and refresh authenticated user's stats
   */
  refreshMyStats: async (): Promise<ProfileStats> => {
    const response = await apiClient.post('/profile/me/stats/refresh');
    return response.data;
  },

  /**
   * Get user's achievement badges
   */
  getUserBadges: async (userId: number): Promise<{ badges: string[]; total: number }> => {
    const response = await apiClient.get(`/profile/${userId}/badges`);
    return response.data;
  },
};
```

#### `/frontend/lib/api/portfolio.ts`

```typescript
import { apiClient } from './client';

export interface PortfolioItem {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  content_type: 'design' | 'code' | 'video' | 'audio' | 'writing' | 'art';
  image_url: string | null;
  project_url: string | null;
  rating: number | null;
  views_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioList {
  items: PortfolioItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CreatePortfolioData {
  title: string;
  description?: string;
  content_type: 'design' | 'code' | 'video' | 'audio' | 'writing' | 'art';
  image_url?: string;
  project_url?: string;
  is_featured?: boolean;
}

export interface UpdatePortfolioData {
  title?: string;
  description?: string;
  content_type?: 'design' | 'code' | 'video' | 'audio' | 'writing' | 'art';
  image_url?: string;
  project_url?: string;
  is_featured?: boolean;
}

export interface PortfolioQueryParams {
  content_type?: string;
  page?: number;
  page_size?: number;
}

export const portfolioApi = {
  /**
   * Create a new portfolio item
   */
  createItem: async (data: CreatePortfolioData): Promise<PortfolioItem> => {
    const response = await apiClient.post('/portfolio', data);
    return response.data;
  },

  /**
   * Get a single portfolio item by ID
   */
  getItem: async (portfolioId: number): Promise<PortfolioItem> => {
    const response = await apiClient.get(`/portfolio/${portfolioId}`);
    return response.data;
  },

  /**
   * Get all portfolio items for a user
   */
  getUserPortfolio: async (
    userId: number,
    params?: PortfolioQueryParams
  ): Promise<PortfolioList> => {
    const response = await apiClient.get(`/portfolio/user/${userId}`, { params });
    return response.data;
  },

  /**
   * Get authenticated user's portfolio items
   */
  getMyPortfolio: async (params?: PortfolioQueryParams): Promise<PortfolioList> => {
    const response = await apiClient.get('/portfolio/me/items', { params });
    return response.data;
  },

  /**
   * Update a portfolio item
   */
  updateItem: async (
    portfolioId: number,
    data: UpdatePortfolioData
  ): Promise<PortfolioItem> => {
    const response = await apiClient.put(`/portfolio/${portfolioId}`, data);
    return response.data;
  },

  /**
   * Delete a portfolio item
   */
  deleteItem: async (portfolioId: number): Promise<void> => {
    await apiClient.delete(`/portfolio/${portfolioId}`);
  },

  /**
   * Get featured portfolio items across all users
   */
  getFeatured: async (limit: number = 10): Promise<PortfolioItem[]> => {
    const response = await apiClient.get('/portfolio/featured/all', {
      params: { limit },
    });
    return response.data;
  },
};
```

### 2. Update Profile Page Component

Replace mock data in `/frontend/app/profile/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { profileApi, ProfileData } from "@/lib/api/profile";
import { portfolioApi, PortfolioItem } from "@/lib/api/portfolio";

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load profile data
      const profile = await profileApi.getMyProfile();
      setProfileData(profile);

      // Load portfolio items
      const portfolio = await portfolioApi.getMyPortfolio({ page_size: 20 });
      setPortfolioItems(portfolio.items);

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading profile...</div>
    </div>;
  }

  if (error || !profileData) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-600">Error: {error}</div>
    </div>;
  }

  // Map backend data to frontend format
  const mappedProfile = {
    id: profileData.id.toString(),
    username: profileData.email.split('@')[0],
    full_name: profileData.full_name || 'Anonymous User',
    title: profileData.title || 'New Member',
    bio: profileData.bio || '',
    avatar_url: profileData.avatar_url,
    rating: profileData.avg_rating ? Number(profileData.avg_rating) : 0,
    total_reviews_given: profileData.total_reviews_given,
    total_reviews_received: profileData.total_reviews_received,
    avg_response_time_hours: profileData.avg_response_time_hours || 0,
    member_since: profileData.created_at,
    verified: profileData.is_verified,
    badges: profileData.badges,
    specialty_tags: profileData.specialty_tags,
  };

  // Rest of your existing JSX with mappedProfile...
}
```

### 3. Create Profile Edit Modal

```typescript
// /frontend/components/profile/edit-profile-modal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { profileApi } from "@/lib/api/profile";

interface EditProfileModalProps {
  currentProfile: {
    title: string | null;
    bio: string | null;
    specialty_tags: string[];
  };
  onSave: () => void;
  onClose: () => void;
}

export function EditProfileModal({ currentProfile, onSave, onClose }: EditProfileModalProps) {
  const [title, setTitle] = useState(currentProfile.title || '');
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [tags, setTags] = useState(currentProfile.specialty_tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      await profileApi.updateProfile({
        title,
        bio,
        specialty_tags: tagArray,
      });

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Full Stack Developer"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Specialty Tags (comma-separated)
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="React, TypeScript, Python, UI/UX"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4. Add Avatar Upload

```typescript
// /frontend/components/profile/avatar-upload.tsx
"use client";

import { useState } from "react";
import { profileApi } from "@/lib/api/profile";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onUploadSuccess: (newAvatarUrl: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, onUploadSuccess }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const result = await profileApi.uploadAvatar(file);
      onUploadSuccess(result.avatar_url);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="avatar-upload"
        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        {uploading ? 'Uploading...' : 'Change Avatar'}
      </label>
      <input
        id="avatar-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

## API Endpoint Reference

### Profile Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/profile/me` | GET | ✅ | Get own profile |
| `/api/v1/profile/{user_id}` | GET | ❌ | Get public profile |
| `/api/v1/profile/me` | PUT | ✅ | Update profile |
| `/api/v1/profile/me/avatar` | POST | ✅ | Upload avatar |
| `/api/v1/profile/{user_id}/stats` | GET | ❌ | Get user stats |
| `/api/v1/profile/me/stats/refresh` | POST | ✅ | Refresh stats |
| `/api/v1/profile/{user_id}/badges` | GET | ❌ | Get badges |

### Portfolio Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/portfolio` | POST | ✅ | Create item |
| `/api/v1/portfolio/{id}` | GET | ❌ | Get item |
| `/api/v1/portfolio/user/{user_id}` | GET | ❌ | Get user portfolio |
| `/api/v1/portfolio/me/items` | GET | ✅ | Get own items |
| `/api/v1/portfolio/{id}` | PUT | ✅ | Update item |
| `/api/v1/portfolio/{id}` | DELETE | ✅ | Delete item |
| `/api/v1/portfolio/featured/all` | GET | ❌ | Get featured |

## Error Handling

```typescript
import { AxiosError } from 'axios';

try {
  await profileApi.updateProfile(data);
} catch (error) {
  if (error instanceof AxiosError) {
    // Handle API errors
    if (error.response?.status === 401) {
      // Redirect to login
      router.push('/login');
    } else if (error.response?.status === 429) {
      // Rate limited
      alert('Too many requests. Please try again later.');
    } else {
      // Show error message
      const message = error.response?.data?.detail || 'An error occurred';
      setError(message);
    }
  } else {
    // Network or other error
    setError('Network error. Please check your connection.');
  }
}
```

## Testing

```typescript
// Test API calls in browser console
import { profileApi, portfolioApi } from '@/lib/api';

// Get profile
const profile = await profileApi.getMyProfile();
console.log(profile);

// Update profile
await profileApi.updateProfile({
  title: 'Senior Developer',
  bio: 'Love coding!',
  specialty_tags: ['React', 'TypeScript']
});

// Create portfolio item
const item = await portfolioApi.createItem({
  title: 'My Project',
  content_type: 'code',
  description: 'A great project',
  project_url: 'https://github.com/user/project'
});
```

## Next Steps

1. Replace mock data in profile page with API calls
2. Implement profile editing modal
3. Add avatar upload functionality
4. Create portfolio management interface
5. Add loading states and error handling
6. Implement optimistic updates for better UX

For complete implementation details, see `/home/user/Critvue/PROFILE_SYSTEM_IMPLEMENTATION.md`.
