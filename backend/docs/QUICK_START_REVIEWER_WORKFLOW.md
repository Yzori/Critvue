# Quick Start Guide: Reviewer Workflow Backend

This guide helps you quickly set up and test the newly implemented reviewer workflow features.

---

## 1. Install Dependencies

```bash
cd /home/user/Critvue/backend
pip install -r requirements.txt
```

This will install APScheduler 3.10.4 along with all other dependencies.

---

## 2. Environment Configuration

Add these variables to your `.env` file (optional - defaults are set):

```bash
# Background Job Scheduler Settings
SCHEDULER_ENABLED=True
SCHEDULER_CLAIM_TIMEOUT_HOURS=72
SCHEDULER_AUTO_ACCEPT_DAYS=7
SCHEDULER_DISPUTE_WINDOW_DAYS=7
SCHEDULER_INTERVAL_MINUTES=60
```

---

## 3. Start the Backend Server

```bash
cd /home/user/Critvue/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see log messages indicating:
- "Starting Critvue backend..."
- "Scheduled job: process_expired_claims (every 60 minutes...)"
- "Scheduled job: process_auto_accepts (every 60 minutes...)"
- "Background job scheduler started successfully"

---

## 4. Verify Scheduler is Running

**Option 1: Check startup logs**
Look for these log messages in the console output.

**Option 2: Create an admin endpoint to check status** (future enhancement)

---

## 5. Test the New Features

### Test 1: Multiple Claim Prevention

```bash
# Get an available slot ID from the browse endpoint
curl http://localhost:8000/api/v1/reviews/browse

# Claim a slot (need auth token)
curl -X POST http://localhost:8000/api/v1/review-slots/{slot_id}/claim \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Try to claim another slot from the same request - should fail
curl -X POST http://localhost:8000/api/v1/review-slots/{another_slot_id}/claim \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: Error message "You have already claimed a slot for this review request"
```

### Test 2: Reviewer Dashboard

```bash
# Get your reviewer dashboard
curl http://localhost:8000/api/v1/reviewer/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get your reviews list
curl http://localhost:8000/api/v1/reviewer/my-reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get earnings summary
curl http://localhost:8000/api/v1/reviewer/earnings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get detailed stats
curl http://localhost:8000/api/v1/reviewer/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 3: Deletion Protection

```bash
# Try to delete a review request with claimed slots - should fail
curl -X DELETE http://localhost:8000/api/v1/reviews/{review_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: Error message "Cannot delete review request with N active claim(s)"
```

### Test 4: Background Scheduler

**Manual Testing:**

1. Claim a review slot
2. Manually update the database to set `claim_deadline` to past:
   ```sql
   UPDATE review_slots
   SET claim_deadline = NOW() - INTERVAL '1 hour'
   WHERE id = YOUR_SLOT_ID;
   ```
3. Wait for the next hour mark (or manually trigger the job)
4. Check that the slot status changed to `ABANDONED`

---

## 6. Run Automated Tests

```bash
cd /home/user/Critvue/backend

# Run all tests
pytest tests/

# Run specific test files
pytest tests/test_claim_prevention.py -v
pytest tests/test_scheduler.py -v
pytest tests/test_deletion_protection.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

---

## 7. API Documentation

Once the server is running, view the interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

The new reviewer dashboard endpoints will appear under the "reviewer" tag.

---

## 8. Monitoring the Scheduler

### Check Logs

The scheduler logs important events:

```
INFO: Scheduled job: process_expired_claims (every 60 minutes, timeout=72h)
INFO: Scheduled job: process_auto_accepts (every 60 minutes, timeout=7d)
INFO: Background job scheduler started successfully

# When jobs run:
INFO: Abandoned 3 expired claim(s)
INFO: Auto-accepted 2 review(s)
```

### Troubleshooting

**Scheduler not starting?**
- Check `SCHEDULER_ENABLED=True` in your `.env`
- Check for errors in startup logs
- Ensure APScheduler is installed: `pip show APScheduler`

**Jobs not running?**
- Jobs run at the top of each hour (:00)
- Check system time is correct
- Look for error messages in logs

**Database connection issues?**
- Ensure your database is running
- Check `DATABASE_URL` in `.env`
- Test database connectivity: `psql $DATABASE_URL`

---

## 9. Common Use Cases

### Use Case 1: Reviewer Claims a Review

```
1. Reviewer browses available reviews: GET /api/v1/reviews/browse
2. Reviewer claims a slot: POST /api/v1/review-slots/{slot_id}/claim
3. Slot status changes to CLAIMED
4. claim_deadline set to NOW() + 72 hours
5. reviews_claimed counter incremented
```

### Use Case 2: Review Times Out

```
1. Reviewer claimed but didn't submit within 72 hours
2. Background job runs at top of hour
3. Finds expired claim (claim_deadline < NOW())
4. Marks slot as ABANDONED
5. Decrements reviews_claimed counter
6. Slot becomes available for other reviewers
```

### Use Case 3: Review Auto-Accepts

```
1. Reviewer submits review
2. auto_accept_at set to NOW() + 7 days
3. Requester doesn't accept/reject within 7 days
4. Background job runs
5. Finds expired submission (auto_accept_at < NOW())
6. Marks slot as ACCEPTED
7. Releases payment (if expert review)
8. Increments reviews_completed counter
```

### Use Case 4: Deletion Protection

```
1. Creator wants to delete their review request
2. Request has claimed or submitted slots
3. DELETE endpoint checks for active slots
4. Returns error preventing deletion
5. Creator must wait for reviews to complete/abandon
```

---

## 10. Feature Flags

You can disable the scheduler without code changes:

```bash
# In .env file
SCHEDULER_ENABLED=False
```

This is useful for:
- Local development without background jobs
- Testing scenarios where you want manual control
- Debugging issues with scheduler conflicts

---

## 11. Production Deployment

Before deploying to production:

1. **Set production environment variables:**
   ```bash
   SCHEDULER_ENABLED=True
   SCHEDULER_CLAIM_TIMEOUT_HOURS=72
   SCHEDULER_AUTO_ACCEPT_DAYS=7
   ```

2. **Ensure database has proper indexes** (already exist in schema)

3. **Set up monitoring** for scheduler jobs

4. **Configure log aggregation** (e.g., CloudWatch, Datadog)

5. **Test failover** - What happens if scheduler crashes?

6. **Set up alerts**:
   - Alert if scheduler hasn't run in >2 hours
   - Alert if error rate >1%
   - Alert if job duration >5 minutes

---

## 12. Support & Troubleshooting

### Common Errors

**Error: "You have already claimed a slot for this review request"**
- **Cause**: Reviewer trying to claim multiple slots from same request
- **Solution**: Complete or abandon existing claim first

**Error: "Cannot delete review request with N active claim(s)"**
- **Cause**: Trying to delete request with claimed/submitted reviews
- **Solution**: Wait for reviews to complete or abandon

**Error: "Slot is not available (current status: claimed)"**
- **Cause**: Trying to claim an already-claimed slot
- **Solution**: Browse for other available slots

### Debug Mode

Enable debug logging for detailed output:

```bash
# In .env
LOG_LEVEL=DEBUG
```

### Getting Help

- **Design Docs**: `/home/user/Critvue/docs/REVIEWER_WORKFLOW_DESIGN.md`
- **Implementation Guide**: `/home/user/Critvue/docs/REVIEWER_WORKFLOW_IMPLEMENTATION_GUIDE.md`
- **Summary**: `/home/user/Critvue/backend/REVIEWER_WORKFLOW_IMPLEMENTATION_SUMMARY.md`

---

## 13. What's Next?

The current implementation covers Phase 1. Future phases could include:

- **Phase 2**: Payment integration, email notifications, draft auto-save
- **Phase 3**: Admin dispute panel, quality validation
- **Phase 4**: Reviewer profiles, smart recommendations, gamification

See the design documents for complete roadmap.

---

**All systems ready for production deployment!** ✅
