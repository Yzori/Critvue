# Critvue Codebase Restructure Plan

> **Version:** 1.0.0
> **Created:** December 2024
> **Status:** Proposed

---

## Executive Summary

This document outlines a comprehensive restructuring plan for the Critvue codebase based on an analysis of the current structure against the project's CODING_STANDARDS.md. The goal is to improve consistency, maintainability, and discoverability while minimizing disruption to ongoing development.

---

## Part 1: Current State Analysis

### 1.1 Frontend Issues Identified

| Priority | Issue | Impact | Location |
|----------|-------|--------|----------|
| **High** | Empty `components/battles/` directory | Dead code, confusion | `/frontend/components/battles/` |
| **High** | Naming inconsistency (kebab-case vs PascalCase) | Unpredictable file discovery | Dashboard, reviewer folders |
| **High** | Hook location split | Inconsistent organization | `hooks/` vs `lib/hooks/` |
| **Medium** | API client ambiguity | Unclear responsibilities | `admin.ts` vs `admin-users.ts` |
| **Medium** | Missing centralized types | Types scattered in API files | `lib/types/` incomplete |
| **Medium** | Duplicate dashboard implementations | 6 dashboard files | `components/dashboard/` |
| **Low** | No admin route group | Inconsistent with auth pattern | `app/admin/` |

### 1.2 Backend Issues Identified

| Priority | Issue | Impact | Location |
|----------|-------|--------|----------|
| **High** | Inconsistent feature grouping | Unpredictable structure | `api/v1/` mixed patterns |
| **High** | Large files (>800 lines) | Hard to maintain | 7 files identified |
| **High** | Underutilized CRUD layer | Inconsistent data access | Only ~30% adoption |
| **Medium** | Mixed service import patterns | Confusing dependencies | Facade vs direct imports |
| **Medium** | Fragmented notification system | 6 scattered files | `services/` |
| **Medium** | Review system scattered | No clear ownership | Multiple locations |
| **Medium** | Password reset outside auth | Breaks feature grouping | `api/password_reset.py` |
| **Low** | Migration naming inconsistency | History hard to follow | `alembic/versions/` |

### 1.3 Large Files Requiring Decomposition

**Backend:**
| File | Lines | Suggested Split |
|------|-------|-----------------|
| `constants/review_rubrics.py` | 1694 | By content type |
| `services/badge_definitions.py` | 1056 | By badge category |
| `schemas/review_slot.py` | 1058 | Base + extensions |
| `crud/review_slot.py` | 984 | By operation type |
| `api/v1/profile.py` | 903 | By feature area |
| `services/committee_service.py` | 866 | By responsibility |
| `api/v1/dashboard.py` | 849 | By dashboard type |

---

## Part 2: Proposed Target Structure

### 2.1 Frontend Target Structure

```
frontend/
├── app/
│   ├── (auth)/                      # Public auth routes (unchanged)
│   │   ├── login/
│   │   ├── register/
│   │   └── password-reset/
│   ├── (authenticated)/             # Protected routes (unchanged)
│   │   └── settings/
│   ├── (admin)/                     # NEW: Admin route group
│   │   ├── layout.tsx               # Admin-specific layout
│   │   ├── users/
│   │   ├── applications/
│   │   ├── challenges/
│   │   └── moderation/
│   ├── dashboard/
│   ├── review/
│   ├── reviewer/
│   └── [other public routes...]
│
├── components/
│   ├── ui/                          # Base components (kebab-case)
│   ├── admin/                       # Admin components
│   │   ├── layout/
│   │   └── users/
│   ├── auth/                        # Auth components
│   ├── browse/                      # Browse feature
│   ├── challenges/                  # Challenge feature
│   ├── checkout/                    # Payment components
│   ├── dashboard/                   # REFACTORED: Unified responsive
│   │   ├── shared/
│   │   ├── panels/
│   │   ├── stats/
│   │   ├── creator-view.tsx         # Responsive creator view
│   │   ├── reviewer-view.tsx        # Responsive reviewer view
│   │   └── index.ts
│   ├── expert-application/
│   ├── how-it-works/
│   ├── karma/
│   ├── layout/
│   ├── leaderboard/
│   ├── navigation/
│   ├── nda/
│   ├── notifications/
│   ├── onboarding/
│   ├── portfolio/
│   ├── profile/
│   ├── review-detail/
│   ├── review-flow/
│   ├── reviewer/
│   │   ├── review-studio/
│   │   └── smart-review/
│   └── tier/
│   # DELETED: components/battles/ (empty)
│
├── contexts/                        # Unchanged
│   ├── AuthContext.tsx
│   ├── QueryProvider.tsx
│   ├── ThemeContext.tsx
│   └── UserPulseContext.tsx
│
├── hooks/                           # CONSOLIDATED: All hooks here
│   ├── use-async.ts                 # Renamed to kebab-case
│   ├── use-form-state.ts
│   ├── use-media-query.ts           # MOVED from lib/hooks/
│   ├── use-modal.ts
│   ├── use-reviews.ts
│   ├── use-scroll-progress.ts
│   ├── use-selection.ts
│   ├── use-toggle.ts
│   └── index.ts
│
├── lib/
│   ├── api/                         # CONSOLIDATED API clients
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── admin.ts                 # MERGED: admin + admin-users
│   │   ├── reviews.ts               # MERGED: reviews + review-slots
│   │   ├── reviewers.ts             # RENAMED: reviewer → reviewers
│   │   ├── challenges.ts
│   │   ├── payments.ts              # MERGED: payments + subscriptions
│   │   ├── profile.ts
│   │   ├── portfolio.ts
│   │   ├── notifications.ts
│   │   ├── browse.ts
│   │   ├── leaderboard.ts
│   │   ├── files.ts
│   │   └── index.ts
│   ├── types/                       # EXPANDED: Centralized types
│   │   ├── user.ts
│   │   ├── review.ts
│   │   ├── challenge.ts
│   │   ├── payment.ts
│   │   ├── notification.ts
│   │   ├── dashboard.ts
│   │   ├── api.ts                   # API response types
│   │   └── index.ts
│   ├── constants/
│   ├── utils/
│   └── utils.ts
│
├── stores/
└── [config files...]
```

### 2.2 Backend Target Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── auth/                    # CONSOLIDATED auth
│   │   │   ├── __init__.py
│   │   │   ├── registration.py
│   │   │   ├── login.py
│   │   │   ├── oauth.py
│   │   │   ├── sessions.py
│   │   │   ├── email_verification.py
│   │   │   ├── password_reset.py    # MOVED from api/
│   │   │   └── common.py
│   │   │
│   │   ├── v1/
│   │   │   ├── reviews/             # NEW: Grouped review system
│   │   │   │   ├── __init__.py
│   │   │   │   ├── requests.py      # Review request CRUD
│   │   │   │   ├── slots.py         # Slot management (from review_slots/)
│   │   │   │   ├── claims.py        # Claiming workflow
│   │   │   │   ├── submissions.py   # Submission workflow
│   │   │   │   ├── disputes.py      # Dispute handling
│   │   │   │   ├── smart_review.py  # AI features
│   │   │   │   └── common.py
│   │   │   │
│   │   │   ├── challenges/          # Unchanged (good pattern)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── public.py
│   │   │   │   ├── admin.py
│   │   │   │   ├── participation.py
│   │   │   │   ├── voting.py
│   │   │   │   └── common.py
│   │   │   │
│   │   │   ├── dashboard/           # RENAMED: dashboard_desktop → dashboard
│   │   │   │   ├── __init__.py
│   │   │   │   ├── creator.py
│   │   │   │   ├── reviewer.py
│   │   │   │   ├── overview.py
│   │   │   │   ├── batch.py
│   │   │   │   └── common.py
│   │   │   │
│   │   │   ├── profile/             # NEW: Grouped profile endpoints
│   │   │   │   ├── __init__.py
│   │   │   │   ├── public.py        # Public profile view
│   │   │   │   ├── settings.py      # Profile settings
│   │   │   │   ├── portfolio.py     # Portfolio management
│   │   │   │   └── privacy.py       # Privacy controls
│   │   │   │
│   │   │   ├── admin/               # NEW: Grouped admin endpoints
│   │   │   │   ├── __init__.py
│   │   │   │   ├── users.py         # User management
│   │   │   │   ├── applications.py  # Expert applications
│   │   │   │   ├── moderation.py    # Content moderation
│   │   │   │   └── committee.py     # Committee management
│   │   │   │
│   │   │   ├── payments/            # NEW: Grouped payment endpoints
│   │   │   │   ├── __init__.py
│   │   │   │   ├── intents.py       # Payment intents
│   │   │   │   ├── subscriptions.py # Subscription management
│   │   │   │   ├── connect.py       # Stripe Connect
│   │   │   │   └── history.py       # Transaction history
│   │   │   │
│   │   │   ├── gamification/        # NEW: Grouped sparks/badges/leaderboard
│   │   │   │   ├── __init__.py
│   │   │   │   ├── sparks.py
│   │   │   │   ├── badges.py
│   │   │   │   ├── leaderboard.py
│   │   │   │   └── tiers.py
│   │   │   │
│   │   │   ├── browse.py            # Flat (simple endpoint)
│   │   │   ├── notifications.py     # Flat (simple endpoint)
│   │   │   ├── files.py             # Flat (simple endpoint)
│   │   │   ├── nda.py               # Flat (simple endpoint)
│   │   │   └── __init__.py
│   │   │
│   │   ├── webhooks.py
│   │   └── deps.py
│   │
│   ├── services/
│   │   ├── challenges/              # Unchanged (good pattern)
│   │   │   ├── __init__.py
│   │   │   ├── facade.py
│   │   │   ├── prompt_service.py
│   │   │   ├── entry_service.py
│   │   │   ├── invitation_service.py
│   │   │   ├── lifecycle_service.py
│   │   │   └── query_service.py
│   │   │
│   │   ├── payments/                # Unchanged (good pattern)
│   │   │   ├── __init__.py
│   │   │   ├── facade.py
│   │   │   ├── calculation.py
│   │   │   ├── intent_service.py
│   │   │   ├── connect_service.py
│   │   │   ├── balance_service.py
│   │   │   ├── release_service.py
│   │   │   └── webhook_handlers.py
│   │   │
│   │   ├── notifications/           # NEW: Consolidated notifications
│   │   │   ├── __init__.py
│   │   │   ├── facade.py            # Unified interface
│   │   │   ├── email_service.py     # From email.py
│   │   │   ├── email_digest.py
│   │   │   ├── push_service.py      # Future
│   │   │   ├── triggers.py          # From notification_triggers.py
│   │   │   └── templates.py         # Template management
│   │   │
│   │   ├── reviews/                 # NEW: Review business logic
│   │   │   ├── __init__.py
│   │   │   ├── facade.py
│   │   │   ├── slot_service.py
│   │   │   ├── claim_service.py     # From claim_service.py
│   │   │   ├── submission_service.py
│   │   │   └── dispute_service.py
│   │   │
│   │   ├── gamification/            # NEW: Consolidated gamification
│   │   │   ├── __init__.py
│   │   │   ├── facade.py
│   │   │   ├── sparks_service.py
│   │   │   ├── badge_service.py
│   │   │   ├── leaderboard_service.py
│   │   │   └── tier_service.py
│   │   │
│   │   ├── ratings/                 # NEW: Consolidated ratings
│   │   │   ├── __init__.py
│   │   │   ├── requester_rating.py
│   │   │   ├── reviewer_rating.py
│   │   │   └── reviewer_dna.py
│   │   │
│   │   ├── auth/                    # NEW: Auth services grouped
│   │   │   ├── __init__.py
│   │   │   ├── email_verification.py
│   │   │   ├── password_reset.py
│   │   │   └── session_service.py
│   │   │
│   │   ├── admin/                   # NEW: Admin services grouped
│   │   │   ├── __init__.py
│   │   │   ├── users_service.py
│   │   │   ├── committee_service.py
│   │   │   └── moderation_service.py
│   │   │
│   │   ├── infrastructure/          # NEW: Infrastructure services
│   │   │   ├── __init__.py
│   │   │   ├── redis_service.py
│   │   │   ├── storage_service.py
│   │   │   ├── image_service.py
│   │   │   └── scheduler.py
│   │   │
│   │   ├── service_factory.py
│   │   └── __init__.py
│   │
│   ├── models/                      # Unchanged (flat is fine for models)
│   │   └── [all model files...]
│   │
│   ├── schemas/                     # Unchanged (flat is fine for schemas)
│   │   └── [all schema files...]
│   │
│   ├── crud/                        # DECISION: Deprecate or Expand
│   │   └── [see migration plan]
│   │
│   ├── constants/
│   │   ├── time.py
│   │   ├── pagination.py
│   │   ├── rate_limits.py
│   │   ├── sparks.py
│   │   ├── challenges.py
│   │   ├── leaderboard.py
│   │   ├── payments.py
│   │   ├── committee.py
│   │   ├── review_slots.py
│   │   └── rubrics/                 # SPLIT: Large file decomposed
│   │       ├── __init__.py
│   │       ├── design.py
│   │       ├── writing.py
│   │       ├── code.py
│   │       └── general.py
│   │
│   ├── core/                        # Unchanged
│   ├── db/                          # Unchanged
│   ├── config/                      # Unchanged
│   ├── templates/                   # Unchanged
│   ├── utils/                       # Unchanged
│   └── main.py
│
├── alembic/
│   └── versions/                    # Going forward: consistent naming
│
└── tests/
```

---

## Part 3: Migration Plan

### Phase 1: Quick Wins (Low Risk, High Value)
**Estimated Effort: 1-2 days**

#### 1.1 Delete Dead Code
```bash
# Frontend: Remove empty battles directory
rm -rf frontend/components/battles/
```

#### 1.2 Consolidate Hooks Location
```bash
# Move media query hook to main hooks folder
mv frontend/lib/hooks/use-media-query.ts frontend/hooks/use-media-query.ts
rm -rf frontend/lib/hooks/
```

#### 1.3 Move Password Reset to Auth
```bash
# Backend: Move password_reset.py under auth
mv backend/app/api/password_reset.py backend/app/api/auth/password_reset.py
# Update imports in main.py and auth/__init__.py
```

#### 1.4 Rename Dashboard Desktop
```bash
# Backend: Cleaner naming
mv backend/app/api/v1/dashboard_desktop backend/app/api/v1/dashboard
# Update imports
```

### Phase 2: Backend Service Consolidation (Medium Risk)
**Estimated Effort: 3-5 days**

#### 2.1 Create Notifications Service Directory
```bash
mkdir -p backend/app/services/notifications

# Move files
mv backend/app/services/email.py backend/app/services/notifications/email_service.py
mv backend/app/services/email_digest.py backend/app/services/notifications/
mv backend/app/services/notification_service.py backend/app/services/notifications/core.py
mv backend/app/services/notification_triggers.py backend/app/services/notifications/triggers.py
mv backend/app/services/notification_trigger_helper.py backend/app/services/notifications/trigger_helpers.py
mv backend/app/services/payment_notifications.py backend/app/services/notifications/payment_triggers.py
```

Create `backend/app/services/notifications/__init__.py`:
```python
"""Notification services module."""
from .core import NotificationService
from .email_service import EmailService
from .email_digest import EmailDigestService
from .triggers import NotificationTriggers

__all__ = [
    "NotificationService",
    "EmailService",
    "EmailDigestService",
    "NotificationTriggers",
]
```

#### 2.2 Create Gamification Service Directory
```bash
mkdir -p backend/app/services/gamification

# Move files
mv backend/app/services/sparks_service.py backend/app/services/gamification/
mv backend/app/services/badge_service.py backend/app/services/gamification/
mv backend/app/services/badge_definitions.py backend/app/services/gamification/
mv backend/app/services/leaderboard_service.py backend/app/services/gamification/
mv backend/app/services/tier_service.py backend/app/services/gamification/
```

#### 2.3 Create Ratings Service Directory
```bash
mkdir -p backend/app/services/ratings

mv backend/app/services/requester_rating_service.py backend/app/services/ratings/
mv backend/app/services/reviewer_rating_service.py backend/app/services/ratings/
mv backend/app/services/reviewer_dna_service.py backend/app/services/ratings/
```

#### 2.4 Create Auth Service Directory
```bash
mkdir -p backend/app/services/auth

mv backend/app/services/email_verification.py backend/app/services/auth/
mv backend/app/services/password_reset.py backend/app/services/auth/
mv backend/app/services/unsubscribe.py backend/app/services/auth/
```

#### 2.5 Create Infrastructure Service Directory
```bash
mkdir -p backend/app/services/infrastructure

mv backend/app/services/redis_service.py backend/app/services/infrastructure/
mv backend/app/services/storage_service.py backend/app/services/infrastructure/
mv backend/app/services/image_service.py backend/app/services/infrastructure/
mv backend/app/services/scheduler.py backend/app/services/infrastructure/
```

### Phase 3: Backend API Reorganization (Higher Risk)
**Estimated Effort: 5-7 days**

#### 3.1 Create Reviews Router Group
```bash
mkdir -p backend/app/api/v1/reviews

# Migrate review_slots/ contents
mv backend/app/api/v1/review_slots/claim.py backend/app/api/v1/reviews/claims.py
mv backend/app/api/v1/review_slots/submit.py backend/app/api/v1/reviews/submissions.py
mv backend/app/api/v1/review_slots/draft.py backend/app/api/v1/reviews/drafts.py
mv backend/app/api/v1/review_slots/smart_review.py backend/app/api/v1/reviews/smart_review.py
mv backend/app/api/v1/review_slots/dispute.py backend/app/api/v1/reviews/disputes.py
mv backend/app/api/v1/review_slots/query.py backend/app/api/v1/reviews/queries.py

# Merge reviews.py content
# (Manual: Extract content from reviews.py into reviews/requests.py)
```

Create `backend/app/api/v1/reviews/__init__.py`:
```python
"""Review system API routers."""
from fastapi import APIRouter

from .requests import router as requests_router
from .claims import router as claims_router
from .submissions import router as submissions_router
from .drafts import router as drafts_router
from .disputes import router as disputes_router
from .queries import router as queries_router
from .smart_review import router as smart_review_router

router = APIRouter(prefix="/reviews", tags=["reviews"])

router.include_router(requests_router)
router.include_router(claims_router, prefix="/slots")
router.include_router(submissions_router, prefix="/slots")
router.include_router(drafts_router, prefix="/slots")
router.include_router(disputes_router, prefix="/slots")
router.include_router(queries_router, prefix="/slots")
router.include_router(smart_review_router, prefix="/smart")

__all__ = ["router"]
```

#### 3.2 Create Admin Router Group
```bash
mkdir -p backend/app/api/v1/admin

mv backend/app/api/v1/admin_users.py backend/app/api/v1/admin/users.py
mv backend/app/api/v1/admin_applications.py backend/app/api/v1/admin/applications.py
# Extract committee endpoints from committee router
```

#### 3.3 Create Payments Router Group
```bash
mkdir -p backend/app/api/v1/payments

# Split payments.py into focused files
# (Manual: Extract intents, subscriptions, connect, history)
```

#### 3.4 Create Gamification Router Group
```bash
mkdir -p backend/app/api/v1/gamification

mv backend/app/api/v1/sparks.py backend/app/api/v1/gamification/
mv backend/app/api/v1/leaderboard.py backend/app/api/v1/gamification/
mv backend/app/api/v1/tier_system.py backend/app/api/v1/gamification/tiers.py
# Create badges.py from badge-related endpoints
```

### Phase 4: Frontend Consolidation (Medium Risk)
**Estimated Effort: 3-5 days**

#### 4.1 Standardize Naming Convention
Rename all dashboard components to kebab-case:
```bash
# In components/dashboard/
mv ReviewStudio.tsx review-studio.tsx
# Update all imports
```

#### 4.2 Consolidate API Clients
Merge related API files:
```bash
# Merge admin.ts + admin-users.ts → admin.ts
# Merge reviews.ts + review-slots.ts → reviews.ts
# Merge payments.ts + subscriptions.ts → payments.ts
```

#### 4.3 Create Centralized Types
```bash
mkdir -p frontend/lib/types

# Extract types from API files into dedicated type files
# Create: user.ts, review.ts, challenge.ts, payment.ts, notification.ts
```

#### 4.4 Create Admin Route Group
```bash
mkdir -p frontend/app/\(admin\)

# Move admin pages
mv frontend/app/admin/* frontend/app/\(admin\)/
rm -rf frontend/app/admin

# Create admin layout
# frontend/app/(admin)/layout.tsx
```

### Phase 5: Large File Decomposition (Low-Medium Risk)
**Estimated Effort: 2-3 days**

#### 5.1 Split review_rubrics.py
```bash
mkdir -p backend/app/constants/rubrics

# Create files by content type:
# - rubrics/design.py
# - rubrics/writing.py
# - rubrics/code.py
# - rubrics/general.py
# - rubrics/__init__.py (re-exports all)
```

#### 5.2 Consolidate Dashboard Components
Refactor 6 dashboard files into responsive components:
- `creator-view.tsx` - Responsive creator dashboard
- `reviewer-view.tsx` - Responsive reviewer dashboard
- Remove: `desktop-dashboard-container.tsx`, `mobile-creator-dashboard.tsx`, etc.

### Phase 6: CRUD Layer Decision (Strategic)
**Estimated Effort: 1-2 days (decision) + variable (implementation)**

**Option A: Deprecate CRUD Layer**
- Remove `crud/` directory
- Move any unique logic to services
- Update ~7 routers that use CRUD

**Option B: Expand CRUD Layer**
- Create CRUD for all models
- Standardize all routers to use CRUD
- Add complex query methods to BaseRepository

**Recommendation:** Option A (Deprecate) - The service layer pattern is already dominant and CRUD adds unnecessary indirection.

---

## Part 4: Import Update Checklist

After reorganization, update imports in:

### Backend
- [ ] `app/main.py` - Router includes
- [ ] `app/api/v1/__init__.py` - Router aggregation
- [ ] All router files - Service imports
- [ ] `app/services/__init__.py` - Service exports
- [ ] All service files - Cross-service imports
- [ ] Test files - Updated paths

### Frontend
- [ ] `app/layout.tsx` - Provider imports
- [ ] All page components - API client imports
- [ ] All components - Hook imports
- [ ] `lib/api/index.ts` - Export aggregation
- [ ] `lib/types/index.ts` - Type exports

---

## Part 5: Backward Compatibility

### API Endpoints
All endpoint URLs remain unchanged. Internal reorganization only.

### Service Aliases
Create aliases in service `__init__.py` files for backward compatibility:

```python
# backend/app/services/notifications/__init__.py
from .email_service import EmailService

# Backward compatibility alias
email_service = EmailService()
```

### Import Redirects
Add deprecation warnings for old import paths:

```python
# backend/app/services/email.py (old location)
import warnings
warnings.warn(
    "Import from app.services.notifications.email_service instead",
    DeprecationWarning,
    stacklevel=2
)
from app.services.notifications.email_service import *
```

---

## Part 6: Testing Strategy

### Before Migration
1. Ensure all existing tests pass
2. Document current test coverage
3. Create integration tests for critical paths

### During Migration
1. Run tests after each phase
2. Update test imports as needed
3. Add new tests for reorganized modules

### After Migration
1. Full regression test
2. Manual smoke testing
3. Performance comparison

---

## Part 7: Rollback Plan

Each phase can be rolled back independently using git:

```bash
# Tag before each phase
git tag pre-phase-1
git tag pre-phase-2
# etc.

# Rollback if needed
git checkout pre-phase-X
```

---

## Part 8: Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Naming consistency | ~70% | 100% |
| Feature grouping consistency | ~50% | 90%+ |
| Files >500 lines | 12 | <5 |
| Dead code directories | 1 | 0 |
| CRUD pattern consistency | 30% | 0% (deprecated) or 100% |
| Hook location consistency | 88% | 100% |
| Type centralization | 20% | 80%+ |

---

## Appendix A: File Movement Summary

### Files to Delete
- `frontend/components/battles/` (empty)
- `frontend/lib/hooks/` (after move)
- `backend/app/api/v1/review_slots/` (after migration)
- `backend/app/api/password_reset.py` (after move)

### Files to Move
| From | To |
|------|-----|
| `frontend/lib/hooks/use-media-query.ts` | `frontend/hooks/` |
| `backend/app/api/password_reset.py` | `backend/app/api/auth/` |
| `backend/app/services/email.py` | `backend/app/services/notifications/` |
| `backend/app/services/*_service.py` (notifications) | `backend/app/services/notifications/` |
| `backend/app/services/*_service.py` (gamification) | `backend/app/services/gamification/` |
| `backend/app/services/*_rating*.py` | `backend/app/services/ratings/` |
| `backend/app/services/*_service.py` (infra) | `backend/app/services/infrastructure/` |

### Files to Split
| File | Split Into |
|------|-----------|
| `backend/app/constants/review_rubrics.py` | `constants/rubrics/{design,writing,code,general}.py` |
| `frontend/components/dashboard/` (6 files) | 2 responsive view components |

### Files to Merge
| Files | Into |
|-------|------|
| `frontend/lib/api/admin.ts` + `admin-users.ts` | `admin.ts` |
| `frontend/lib/api/reviews.ts` + `review-slots.ts` | `reviews.ts` |
| `frontend/lib/api/payments.ts` + `subscriptions.ts` | `payments.ts` |

---

## Appendix B: Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Quick Wins | 1-2 days | None |
| Phase 2: Backend Services | 3-5 days | Phase 1 |
| Phase 3: Backend API | 5-7 days | Phase 2 |
| Phase 4: Frontend | 3-5 days | Phase 1 |
| Phase 5: Large Files | 2-3 days | Phases 2-4 |
| Phase 6: CRUD Decision | 1-2 days | Phase 3 |
| **Total** | **15-24 days** | |

---

*This plan should be reviewed and approved before implementation begins.*
