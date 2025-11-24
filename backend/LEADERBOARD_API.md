# Leaderboard API Documentation

Comprehensive leaderboard endpoints for Critvue's tier/karma system.

## Overview

The leaderboard API provides rankings for users across multiple metrics:
- **Karma Points**: Total karma accumulated
- **Acceptance Rate**: Percentage of reviews accepted
- **Review Streak**: Current consecutive review days
- **Accepted Reviews**: Total number of accepted reviews
- **Helpfulness**: Average rating from creators

## Files Created

1. **`/home/user/Critvue/backend/app/schemas/leaderboard.py`**
   - Pydantic schemas for leaderboard responses
   - `LeaderboardEntry`: Individual user ranking entry
   - `LeaderboardResponse`: Complete leaderboard with metadata
   - `UserPositionResponse`: User's position across all categories

2. **`/home/user/Critvue/backend/app/api/v1/leaderboard.py`**
   - API endpoint implementations
   - Helper functions for ranking calculations
   - Optional authentication support

3. **Updated `/home/user/Critvue/backend/app/main.py`**
   - Registered leaderboard router

## Endpoints

### Public Leaderboards (Optional Authentication)

All leaderboard endpoints support optional authentication. If authenticated, the response includes the current user's position even if they're not in the top results.

#### 1. GET `/api/v1/leaderboard/karma`

Top users by karma points.

**Query Parameters:**
- `period`: `weekly` | `monthly` | `all_time` (default: `all_time`)
- `tier`: Filter by tier (optional) - `novice`, `contributor`, `skilled`, `trusted_advisor`, `expert`, `master`
- `limit`: Number of entries (1-100, default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "entries": [
    {
      "user_id": 123,
      "full_name": "John Doe",
      "avatar_url": "https://...",
      "user_tier": "expert",
      "rank": 1,
      "rank_change": null,
      "karma_points": 5000
    }
  ],
  "metadata": {
    "total_entries": 150,
    "limit": 50,
    "offset": 0,
    "period": "all_time",
    "tier_filter": null
  },
  "current_user_position": {
    "user_id": 456,
    "rank": 87,
    "total_users": 150,
    "percentile": 42.67,
    "stat_value": 1250.0
  }
}
```

**Caching:** 5 minutes (`Cache-Control: public, max-age=300`)

#### 2. GET `/api/v1/leaderboard/acceptance-rate`

Top users by acceptance rate (minimum 5 reviews required).

**Same query parameters and response structure as karma leaderboard.**

Key field: `acceptance_rate` (percentage)

#### 3. GET `/api/v1/leaderboard/streak`

Top users by current review streak.

**Same query parameters and response structure as karma leaderboard.**

Key field: `current_streak` (days)

#### 4. GET `/api/v1/leaderboard/reviews`

Top users by number of accepted reviews.

**Same query parameters and response structure as karma leaderboard.**

Key field: `accepted_reviews_count` (count)

#### 5. GET `/api/v1/leaderboard/helpful`

Top users by average helpfulness rating (minimum 5 reviews required).

**Same query parameters and response structure as karma leaderboard.**

Key field: `avg_rating` (1-5 scale)

### Authenticated Endpoints

#### 6. GET `/api/v1/leaderboard/me/position`

Get current user's ranking across all categories.

**Requires:** Authentication

**Response:**
```json
{
  "user_id": 123,
  "user_tier": "skilled",
  "tier_rank_in_tier": 5,
  "tier_total_in_tier": 23,
  "positions": [
    {
      "category": "karma",
      "rank": 42,
      "total_users": 150,
      "percentile": 72.0,
      "stat_value": 2500.0
    },
    {
      "category": "acceptance_rate",
      "rank": 15,
      "total_users": 120,
      "percentile": 87.5,
      "stat_value": 94.5
    },
    {
      "category": "streak",
      "rank": 8,
      "total_users": 150,
      "percentile": 94.67,
      "stat_value": 45.0
    },
    {
      "category": "reviews",
      "rank": 28,
      "total_users": 150,
      "percentile": 81.33,
      "stat_value": 67.0
    },
    {
      "category": "helpful",
      "rank": 12,
      "total_users": 120,
      "percentile": 90.0,
      "stat_value": 4.7
    }
  ]
}
```

## Implementation Details

### Period Filtering

Currently, period filters (`weekly`, `monthly`, `all_time`) use `User.created_at` as a proxy:
- `weekly`: Users created in the last 7 days
- `monthly`: Users created in the last 30 days
- `all_time`: No filter

**Future Enhancement:** Implement period-based filtering using `karma_transactions.created_at` to show true period rankings (e.g., karma earned this week).

### Rank Change Calculation

The `rank_change` field in `LeaderboardEntry` is currently set to `null`.

**Future Enhancement:** Implement by:
1. Caching leaderboard snapshots periodically (e.g., daily)
2. Comparing current rank to previous period's cached rank
3. Returning positive values for rank improvements, negative for drops

### Minimum Review Requirements

Some leaderboards require minimum reviews to qualify:
- **Acceptance Rate**: 5 reviews minimum
- **Helpfulness**: 5 reviews minimum
- **Karma, Streak, Reviews**: No minimum

This prevents users with only 1-2 reviews from dominating percentage-based rankings.

### Ranking Algorithm

Rankings are calculated using:
1. Filter active users (`is_active = True`)
2. Apply period filter (based on `created_at`)
3. Apply tier filter if specified
4. Apply minimum review requirement if applicable
5. Order by stat descending (nulls last)
6. Calculate rank by counting users with better stats

### Percentile Calculation

Percentile is calculated as: `((total - rank + 1) / total) * 100`

- Rank 1 of 100 = 100th percentile (top 1%)
- Rank 50 of 100 = 51st percentile
- Rank 100 of 100 = 1st percentile (bottom)

### Optional Authentication

Leaderboard endpoints use a custom `get_optional_current_user` dependency that:
- Returns the authenticated user if a valid access token cookie is present
- Returns `None` if no token or invalid token (doesn't throw errors)
- Allows endpoints to be accessed by both authenticated and anonymous users

When authenticated, the user's position is included in the response even if they're not in the top results.

## Error Handling

- Invalid tier names in filter: Ignored (filter not applied)
- Invalid period values: Rejected with 422 Unprocessable Entity
- Out of range limit/offset: Rejected with 422 Unprocessable Entity
- Authentication errors on `/me/position`: 401 Unauthorized

## Caching Strategy

All public leaderboard endpoints include:
```
Cache-Control: public, max-age=300
```

This allows:
- Browser caching for 5 minutes
- CDN/proxy caching for 5 minutes
- Reduces database load for frequently accessed leaderboards

## Testing

The implementation has been:
1. Syntax-checked with Python compiler
2. Import-tested successfully
3. Registered in FastAPI application

**Recommended Next Steps:**
1. Create integration tests in `/home/user/Critvue/backend/tests/integration/test_leaderboard.py`
2. Test with sample data
3. Verify performance with larger datasets
4. Add database indexes if needed (already indexed: `user_tier`, `karma_points`)

## Database Indexes

The User model already has indexes on:
- `user_tier`: Used for tier filtering
- `karma_points`: Used for karma leaderboard ranking

**Consider adding indexes for:**
- `acceptance_rate`: If acceptance rate leaderboard is heavily used
- `current_streak`: If streak leaderboard is heavily used
- `avg_rating`: If helpful leaderboard is heavily used

## API Usage Examples

### Get Top Karma Users (All Time)
```bash
curl -X GET "http://localhost:8000/api/v1/leaderboard/karma"
```

### Get Top Expert Tier Users by Acceptance Rate (This Month)
```bash
curl -X GET "http://localhost:8000/api/v1/leaderboard/acceptance-rate?period=monthly&tier=expert"
```

### Get My Position (Authenticated)
```bash
curl -X GET "http://localhost:8000/api/v1/leaderboard/me/position" \
  --cookie "access_token=YOUR_TOKEN"
```

### Get Top 10 Users by Streak with Pagination
```bash
curl -X GET "http://localhost:8000/api/v1/leaderboard/streak?limit=10&offset=0"
```

## Future Enhancements

1. **Real-time Period Rankings**: Filter based on karma transactions within the period
2. **Rank Change Tracking**: Cache periodic snapshots for rank change calculations
3. **Global vs Tier Leaderboards**: Separate leaderboards for each tier
4. **Specialized Leaderboards**:
   - Most helpful reviewer this week
   - Fastest response time
   - Most consistent streak
5. **Leaderboard Achievements**: Badges for reaching top 10, top 100, etc.
6. **Historical Rankings**: View leaderboards from previous periods
7. **Category-specific Leaderboards**: Filter by specialty tags or review types
