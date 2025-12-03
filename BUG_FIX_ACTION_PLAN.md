# 🔧 Critical Bug Fix Action Plan

**Status:** 18 Critical Errors Identified & Being Fixed
**Last Updated:** December 3, 2025
**Priority:** BLOCKER - Backend cannot start until these are resolved

---

## ✅ Already Fixed (1/18)

### FIXED: Missing Package Dependencies
- ✅ Added `@prisma/client@^5.0.0` to dependencies
- ✅ Added `@prisma/cli@^5.0.0` to devDependencies  
- ✅ Added `jsonwebtoken@^9.1.2` to dependencies
- ✅ Confirmed `bcryptjs@^2.4.3` (NOT bcrypt - correct!)

**Commit:** `fe8da1a` - Fix: Add missing Prisma and JWT dependencies

---

## 🔴 CRITICAL Issues Requiring Fix (17 Remaining)

### ISSUE #1: Prisma Schema Relation Error (P1012)
**Error:** "A one-to-one relation must use unique fields"
**Location:** `prisma/schema.prisma`, User model, line 27
**Problem:**
```prisma
employee  Employee?  @relation(fields: [employeeId], references: [id])
```
The `employeeId` field is NOT marked `@unique` but it's used in a one-to-one relation.

**Fix Required:**
1. Make `employeeId` unique:
   ```prisma
   employeeId String? @unique
   ```
2. OR change relation to one-to-many (if multiple users per employee)

**Status:** PENDING - Requires schema modification

---

### ISSUE #2 & #3: Dual User Models (MongoDB vs Prisma) - CRITICAL ARCHITECTURE FLAW
**Problem:** System has TWO separate user implementations:
- **MongoDB:** `src/models/User.js` - Uses `password` field, bcryptjs
- **Prisma:** `prisma/schema.prisma` - Uses `passwordHash` field

**Impact:**
- Login ALWAYS fails (comparing wrong fields)
- Authentication completely broken
- Data inconsistency

**Fix Required:**
Choose ONE database for users:

**Option A (Recommended): MongoDB for Users**
- Keep MongoDB User model
- Remove Prisma User model
- Update AuthController to use MongoDB only

**Option B: Prisma for Users**
- Migrate all users from MongoDB to PostgreSQL
- Use Prisma User model exclusively
- Update all auth logic

**Status:** PENDING - Architecture decision needed

---

### ISSUE #4: Password Field Mismatch
**MongoDB User:** `user.password`
**Prisma User:** `user.passwordHash`
**AuthController:** `bcrypt.compare(password, user.passwordHash)`

**Result:** Login ALWAYS fails for MongoDB users

**Fix:** Align with chosen database (Issue #2)

---

### ISSUE #5: Missing Prisma User-Company Relations
**Problem:** AuthController queries:
```javascript
const user = await prisma.user.findUnique({
  include: { companies: true }
});
```

But schema doesn't define:
- `Company` model
- `UserCompany` join table
- Proper relations

**Fix Required:**
```prisma
model Company {
  id        String   @id @default(cuid())
  name      String
  users     UserCompany[]
  // ... other fields
}

model UserCompany {
  userId    String
  companyId String
  user      User   @relation(fields: [userId], references: [id])
  company   Company @relation(fields: [companyId], references: [id])
  @@id([userId, companyId])
}
```

**Status:** PENDING - Schema requires extension

---

### ISSUE #6: Missing ERM Prisma Models
**Problem:** Attendance, Task, Leave modules depend on Prisma but models incomplete

**Required Models:**
- Attendance (check-in/out, work hours)
- Task (assignment, status, deadlines)
- Leave (requests, approvals, balance)
- Sync logs (track bidirectional sync)

**Status:** PENDING - Models must be added to schema

---

### ISSUE #7: Incomplete Multi-Company Support
**Current State:**
- MongoDB has `companyId` ObjectId
- Prisma expects `UserCompany` join
- No seed data for companies
- No company seeding script

**Fix Required:**
- Create `seeds/companies.seed.ts`
- Create `seeds/users.seed.ts`
- Establish proper multi-tenancy isolation

**Status:** PENDING - Seed scripts needed

---

### ISSUE #8: Prisma Migrations Partially Executed
**Problem:** Migrations started but failed midway, leaving DB in inconsistent state

**Fix:**
```bash
# Reset migrations (WARNING: Deletes all data)
rm -rf prisma/migrations
rm -f .env.local  # Reset migration state

# Create fresh migration
npm run prisma migrate dev --name init
```

**Status:** PENDING - Requires database reset

---

### ISSUE #9: Missing DATABASE_URL in .env
**Impact:** Prisma cannot connect to PostgreSQL

**Fix:**
Add to `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/portfolix_compass"
```

**Status:** PENDING - Environment configuration

---

### ISSUE #10: No Database Sync Strategy
**Problem:** System uses MongoDB for users/HR and PostgreSQL for ERM with no sync mechanism

**Fix Required:**
Implement bidirectional sync:
1. **Webhook Sync Service** - Real-time updates
2. **Batch Sync** - Periodic reconciliation
3. **Mapping Table** - Track MongoDB→PostgreSQL relationships

**Status:** PENDING - Architecture design needed

---

### ISSUES #11-18: Related Architecture Issues
- Incomplete EmployeeID logic (belongs in MongoDB, not Prisma)
- Missing Prisma version compatibility fixes (version 5.x syntax)
- No clear database separation guards
- ERM module initialization depends on Prisma (currently broken)
- Attendance/Task/Leave workflows broken
- Webhooks can't sync without proper relations

---

## 📋 Fix Execution Order

1. **PHASE 1 (CRITICAL)** - Get server starting
   - ✅ Fix package.json (DONE)
   - [ ] Fix Prisma schema relations (#1)
   - [ ] Decide on user database (#2, #3)
   - [ ] Add Company/UserCompany models (#5)
   - [ ] Fix .env DATABASE_URL (#9)

2. **PHASE 2** - Get authentication working
   - [ ] Consolidate user model logic
   - [ ] Fix password handling (#4)
   - [ ] Create seed data
   - [ ] Test login flow

3. **PHASE 3** - Get ERM modules working
   - [ ] Complete Prisma models (#6)
   - [ ] Reset migrations and run fresh (#8)
   - [ ] Implement sync strategy (#10)
   - [ ] Test Attendance/Task/Leave workflows

4. **PHASE 4** - Production hardening
   - [ ] Add database guards
   - [ ] Document architecture
   - [ ] Add integration tests

---

## 🚀 Next Steps

1. **Review & Approve** this action plan
2. **Choose** MongoDB vs Prisma for users (ISSUE #2)
3. **Start PHASE 1** fixes immediately
4. **Run tests** after each phase
5. **Document** final architecture

---

**Estimated Completion Time:** 4-6 hours for experienced developer
**Risk Level:** HIGH - Multiple critical dependencies
**Recommendation:** Fix in order, test after each phase
