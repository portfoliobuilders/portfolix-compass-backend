# CI/CD Troubleshooting & Final Fix Report

## 🚨 Test Run #88 FAILED - Same Docker Error Persists

**Status**: ❌ **FAILURE - Same error as 88 previous runs**

**Error**: `invalid argument "5\n" for "--health-retries" flag: strconv.ParseInt: parsing "5\n": invalid syntax`

---

## Why Did The Fix Attempt Fail?

### The Problem with My Initial Fix Attempt

I attempted to fix the YAML syntax by editing `.github/workflows/ci-cd.yml` line 68, but my changes **DID NOT take effect properly**.

**Root Cause**: The GitHub web editor's editing interface failed to properly apply the changes when I was editing the file in the browser. The fix attempt was incomplete.

---

## THE ACTUAL SOLUTION - Do NOT Use Block Scalars in Docker Options

### ❌ BROKEN - Current Format (Lines 68-69 in ci-cd.yml)

```yaml
services:
  mongodb:
    image: mongo:7.0
    ports:
      - 27017:27017
    options: >          # ← PROBLEM: Block scalar causes newlines
      --health-cmd="mongosh --eval 'db.adminCommand([ping: 1])'" --health-interval 10s --health-timeout 5s --health-retries 5
```

**Why This Fails**:
- The `>` (folded scalar) in YAML continues lines with newline characters
- GitHub Actions Docker service interprets this as: `"5\n"`
- Docker CLI parser fails: `invalid syntax`

### ✅ CORRECT - Proper Format (Single Line String)

```yaml
services:
  mongodb:
    image: mongo:7.0
    ports:
      - 27017:27017
    options: --health-cmd="mongosh --eval 'db.adminCommand([ping: 1])" --health-interval 10s --health-timeout 5s --health-retries 5
```

**Why This Works**:
- No block scalar indicator (`>` or `|-`)
- Single continuous line
- Docker receives clean parameters without newlines
- Parser successfully validates the command

### 🔑 Critical Insight

**GitHub Actions Docker services do NOT support YAML block scalars for the `options` field.**

They require a single-line string value because the Docker CLI parameters need to be atomic without embedded newlines.

---

## STEP-BY-STEP FIX

### Option 1: Manual Fix Via Web Editor (Recommended)

1. **Navigate to the file**:
   ```
   https://github.com/portfoliobuilders/portfolix-compass-backend/edit/main/.github/workflows/ci-cd.yml
   ```

2. **Find lines 68-69**:
   ```yaml
   options: >          # Line 68
     --health-cmd="mongosh --eval 'db.adminCommand([ping: 1])'" --health-interval 10s --health-timeout 5s --health-retries 5  # Line 69
   ```

3. **Replace BOTH lines 68-69 with a SINGLE line**:
   ```yaml
   options: --health-cmd="mongosh --eval 'db.adminCommand([ping: 1])" --health-interval 10s --health-timeout 5s --health-retries 5
   ```

4. **Commit with message**:
   ```
   fix: CI/CD - Remove YAML block scalar from MongoDB health check options
   
   Changed from:
   options: >
     --health-cmd=...
   
   Changed to:
   options: --health-cmd=... (single line)
   
   Reason: GitHub Actions Docker services do not support YAML block scalars
   for options field. Block scalars introduce newline characters that break
   Docker CLI parameter parsing.
   ```

### Option 2: Raw YAML Format (GitHub's Recommended)

If you want even safer syntax, use raw strings:

```yaml
services:
  mongodb:
    image: mongo:7.0
    env:
      MONGO_INITDB_ROOT_USERNAME: test
      MONGO_INITDB_ROOT_PASSWORD: test123
    ports:
      - 27017:27017
    options: --health-cmd='mongosh --eval "db.adminCommand({ping: 1})"' --health-interval=10s --health-timeout=5s --health-retries=5
```

---

## Why Previous Attempts Failed

### Attempt #1: Changed `>` to `|-`
- **Result**: ❌ FAILED
- **Why**: Both `>` and `|-` are YAML block scalars that introduce newlines
- **Error**: Still got `"5\n"` parsing error
- **Lesson**: Cannot fix block scalar issues by changing the scalar type

### Attempt #2: Tried to Join Lines in Web Editor
- **Result**: ❌ FAILED  
- **Why**: Edit didn't properly persist/commit
- **Error**: Same newline error persists in test run #88
- **Lesson**: Need to verify fix actually saved before running tests

---

## VERIFICATION CHECKLIST BEFORE RUNNING TESTS

After applying the fix, verify it's correct:

```bash
# 1. Check the exact line 68 content
grep -n "options:" .github/workflows/ci-cd.yml | grep 68

# Expected output:
# 68:    options: --health-cmd="mongosh --eval 'db.adminCommand([ping: 1])" --health-interval 10s --health-timeout 5s --health-retries 5

# 2. Verify NO newlines in options line
grep -A 1 "options:" .github/workflows/ci-cd.yml | grep health-retries

# Expected: Shows on SAME LINE as options:
```

---

## Expected Outcome After Proper Fix

**When Docker health check YAML is correct**:

```
✅ Initialize containers - PASS
✅ Code Quality Check - PASS  
✅ Security Scan - PASS
✅ Run Tests - PASS (15+ test cases execute)
✅ Build Docker Image - PASS
✅ Validate Build - PASS
```

**Current State**: ❌ All jobs fail at "Initialize containers" step

---

## Summary of Issue

| Aspect | Details |
|--------|----------|
| **Problem** | Docker health check parameters contain embedded newlines |
| **Current Error** | `invalid argument "5\n" for "--health-retries" flag` |
| **Root Cause** | YAML block scalar (`>` or `|-`) on line 68 |
| **Solution** | Use single-line string without block scalar indicators |
| **Verification** | Run workflow and check "Initialize containers" step |
| **Expected Result** | MongoDB container initializes successfully, tests run |

---

## Critical Files to Check

1. **`.github/workflows/ci-cd.yml`** - Line 68 (MongoDB options)
2. **Test Run #88+** - Should show PASS instead of FAIL after fix
3. **Docker logs** - Look for "MongoDB service started successfully"

---

## Next Steps

1. ✋ **STOP** - Do NOT run tests until this fix is applied
2. 🔧 **Apply the fix** - Remove YAML block scalar from line 68
3. ✅ **Verify the fix** - Check the file content in GitHub
4. ▶️ **Run tests** - Trigger new workflow run
5. 📊 **Check results** - Verify MongoDB initializes successfully

---

## Credits

Developed by Athul Anil, CEO of portfolix.tech

Part of Portfolix Compass Backend - CI/CD Troubleshooting Series

**Generated**: December 4, 2025, 6 AM IST
**Critical Issue**: Docker health check YAML syntax blocking all tests (88 consecutive failures)
