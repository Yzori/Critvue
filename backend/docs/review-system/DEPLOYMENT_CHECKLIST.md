# Review Request System - Deployment Checklist

## Pre-Deployment Verification

### 1. Code Verification (COMPLETED ✅)

All verification checks have passed:
- ✅ All imports successful
- ✅ All enums properly defined
- ✅ All model relationships configured
- ✅ All CRUD methods present
- ✅ All API endpoints registered

Run verification anytime:
```bash
cd /home/user/Critvue/backend
./venv/bin/python scripts/validation/verify_setup.py
```

### 2. Database Migration

**IMPORTANT**: Run this before starting the application for the first time.

```bash
cd /home/user/Critvue/backend

# Activate virtual environment
source venv/bin/activate

# Check migration status
alembic current

# Review the SQL that will be executed (dry run)
alembic upgrade head --sql

# Run the migration
alembic upgrade head

# Verify migration applied
alembic current
# Should show: a3f4d7e8c1b2 (head)
```

**What the migration creates:**
- `review_requests` table with indexes
- `review_files` table with indexes
- 3 new ENUM types: `contenttype`, `reviewtype`, `reviewstatus`
- Foreign key constraints with CASCADE delete
- All necessary indexes for performance

### 3. Application Startup

```bash
cd /home/user/Critvue/backend
source venv/bin/activate

# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Health Check

Once the application is running, test the health endpoint:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "critvue-backend",
  "database": "connected",
  "version": "0.1.0",
  "timestamp": "2025-11-11T..."
}
```

### 5. API Documentation

Access the auto-generated API documentation:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

The new review endpoints should appear under the "Reviews" tag.

## Testing the Implementation

### Step 1: Authentication

First, you need to authenticate to get a cookie:

```bash
# Register a new user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "full_name": "Test User"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Step 2: Create a Review Request

```bash
curl -X POST http://localhost:8000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "My First Review Request",
    "description": "This is a test review request for my logo design",
    "content_type": "design",
    "review_type": "free",
    "status": "draft",
    "feedback_areas": "Color scheme, Typography"
  }'
```

### Step 3: List Reviews

```bash
curl -X GET http://localhost:8000/api/v1/reviews \
  -b cookies.txt
```

### Step 4: Get Single Review

```bash
# Replace {id} with the actual review ID from step 2
curl -X GET http://localhost:8000/api/v1/reviews/{id} \
  -b cookies.txt
```

### Step 5: Update Review

```bash
curl -X PATCH http://localhost:8000/api/v1/reviews/{id} \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "status": "pending"
  }'
```

### Step 6: Get Statistics

```bash
curl -X GET http://localhost:8000/api/v1/reviews/stats \
  -b cookies.txt
```

### Step 7: Delete Review

```bash
# Soft delete (default)
curl -X DELETE http://localhost:8000/api/v1/reviews/{id} \
  -b cookies.txt

# Hard delete
curl -X DELETE "http://localhost:8000/api/v1/reviews/{id}?hard_delete=true" \
  -b cookies.txt
```

## Database Verification

After running the migration, verify the tables exist:

```bash
# Connect to your PostgreSQL database
psql -U your_user -d critvue

# List tables
\dt

# You should see:
# - users (existing)
# - password_reset_tokens (existing)
# - review_requests (new)
# - review_files (new)

# Check review_requests schema
\d review_requests

# Check review_files schema
\d review_files

# Check enums
\dT+

# You should see:
# - contenttype
# - reviewtype
# - reviewstatus
# - userrole (existing)
```

## Rollback (If Needed)

If you need to rollback the migration:

```bash
cd /home/user/Critvue/backend
source venv/bin/activate

# Rollback to previous migration
alembic downgrade -1

# Or rollback to specific version
alembic downgrade 121d28234ca3
```

## Common Issues & Solutions

### Issue: Migration fails with "relation already exists"

**Solution**: The tables might already exist. Check with `\dt` in psql and drop them if needed:
```sql
DROP TABLE IF EXISTS review_files CASCADE;
DROP TABLE IF EXISTS review_requests CASCADE;
DROP TYPE IF EXISTS reviewstatus;
DROP TYPE IF EXISTS reviewtype;
DROP TYPE IF EXISTS contenttype;
```
Then run `alembic upgrade head` again.

### Issue: Import errors

**Solution**: Make sure virtual environment is activated:
```bash
source venv/bin/activate
python scripts/validation/verify_setup.py
```

### Issue: Authentication not working

**Solution**: Check that cookies are being sent. Use `-c cookies.txt` to save and `-b cookies.txt` to send cookies in curl.

### Issue: 404 on /api/v1/reviews

**Solution**: Verify the router is included in main.py and restart the application.

## Performance Considerations

### Indexes Created

The migration creates the following indexes for optimal performance:

**review_requests table:**
- `ix_review_requests_id` (primary key)
- `ix_review_requests_user_id` (for filtering by user)
- `ix_review_requests_content_type` (for filtering by content type)
- `ix_review_requests_status` (for filtering by status)
- `ix_review_requests_deleted_at` (for excluding soft-deleted records)

**review_files table:**
- `ix_review_files_id` (primary key)
- `ix_review_files_review_request_id` (for joining with review requests)

### Query Optimization

- Files are eager-loaded using `selectinload` to avoid N+1 queries
- Pagination is implemented on all list endpoints
- Soft-deleted records are filtered at the query level

## Security Checklist

- ✅ All endpoints require authentication
- ✅ Ownership verification on all operations
- ✅ Input validation via Pydantic schemas
- ✅ SQL injection prevention via SQLAlchemy ORM
- ✅ Soft deletes for audit trail
- ✅ Security logging for audit trail
- ✅ CASCADE delete to prevent orphaned records

## Monitoring

### Application Logs

The application logs all important operations:
- Review creation: `security_logger.info`
- Review updates: `security_logger.info`
- Review deletion: `security_logger.info`
- Errors: `security_logger.error`

### Database Metrics to Monitor

- Review request creation rate
- Average time in each status
- Number of files per review
- Soft-deleted vs hard-deleted reviews
- Query performance on large datasets

## Files Created

### Models
- `/home/user/Critvue/backend/app/models/review_request.py`
- `/home/user/Critvue/backend/app/models/review_file.py`

### Schemas
- `/home/user/Critvue/backend/app/schemas/review.py`

### CRUD
- `/home/user/Critvue/backend/app/crud/review.py`
- `/home/user/Critvue/backend/app/crud/__init__.py`

### API
- `/home/user/Critvue/backend/app/api/v1/reviews.py`
- `/home/user/Critvue/backend/app/api/v1/__init__.py`

### Migration
- `/home/user/Critvue/backend/alembic/versions/a3f4d7e8c1b2_add_review_request_and_file_tables.py`

### Documentation
- `/home/user/Critvue/backend/REVIEW_SYSTEM_IMPLEMENTATION.md`
- `/home/user/Critvue/backend/API_REFERENCE.md`
- `/home/user/Critvue/backend/DEPLOYMENT_CHECKLIST.md` (this file)

### Utilities
- `/home/user/Critvue/backend/scripts/validation/verify_setup.py`

## Next Steps After Deployment

1. **Test all endpoints** using the test commands above
2. **Verify in API docs** at http://localhost:8000/api/docs
3. **Check database** to ensure tables and data are correct
4. **Monitor logs** for any errors or warnings
5. **Set up monitoring** for key metrics
6. **Implement Phase 2 features** (see REVIEW_SYSTEM_IMPLEMENTATION.md)

## Phase 2 Priorities

Based on the MVP implementation, the recommended next steps are:

1. **File Upload System** (HIGH PRIORITY)
   - S3 integration
   - Pre-signed URL generation
   - File validation and virus scanning
   - Upload progress tracking

2. **Review Assignment** (HIGH PRIORITY)
   - Reviewer profiles
   - Matching algorithm
   - Notification system

3. **Feedback Collection** (MEDIUM PRIORITY)
   - Review/feedback model
   - Rating system
   - Comments and iterations

4. **Payment Integration** (MEDIUM PRIORITY)
   - Stripe integration
   - Escrow system
   - Pricing tiers

5. **AI Integration** (MEDIUM PRIORITY)
   - Claude/GPT integration
   - Automated feedback
   - Content analysis

## Support

For issues or questions:
1. Check this deployment checklist
2. Review REVIEW_SYSTEM_IMPLEMENTATION.md
3. Check API_REFERENCE.md for endpoint details
4. Run verify_setup.py to check configuration
5. Check application logs for errors

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
**Status**: Ready for deployment ✅
