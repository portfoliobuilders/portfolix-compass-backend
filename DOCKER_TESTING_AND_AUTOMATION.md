# DOCKER TESTING & AUTOMATED TESTING GUIDE

**Status**: Production-Ready | **Date**: December 4, 2025  
**Purpose**: Complete Docker containerization and automated testing workflow

---

## 💧 DOCKER SETUP & TESTING

### 1. Build Phase 6 Docker Image

```bash
# Build image
docker build -t portfolix-backend:phase6 .

# Verify build
docker images | grep portfolix-backend

# Expected output:
# portfolix-backend      phase6    <image-id>    <size>MB
```

### 2. Run Development Test Container

```bash
# Run with staging config
docker run -d \
  --name portfolix-dev-test \
  -p 3000:3000 \
  --env-file .env.staging \
  -v $(pwd)/logs:/app/logs \
  portfolix-backend:phase6

# Verify container running
docker ps | grep portfolix-backend

# Expected: Container status "Up X seconds"
```

### 3. Health Check from Container

```bash
# Check container health
docker exec portfolix-dev-test curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"2025-12-04T05:00:00Z","uptime":15.234}

# Check API version
docker exec portfolix-dev-test curl http://localhost:3000/api/version

# Expected response:
# {"version":"2.0.0","phase":"PHASE 6 - Enhanced with Middleware Integration"}
```

### 4. View Container Logs

```bash
# Real-time logs
docker logs -f portfolix-dev-test

# Last 50 lines
docker logs --tail 50 portfolix-dev-test

# Expected logs:
# [APP] Helmet security headers enabled
# [APP] CORS enabled
# [APP] Correlation ID middleware enabled
# [APP] PORTFOLIX COMPASS BACKEND - PHASE 6 - Production Server Started
```

---

## 🧪 AUTOMATED TESTING IN DOCKER

### 1. Integration Test Container

```bash
# Create test container
docker run -it \
  --name portfolix-test \
  --link portfolix-dev-test:backend \
  -e BACKEND_URL=http://backend:3000 \
  --env-file .env.staging \
  portfolix-backend:phase6 \
  npm run test:integration

# Expected output:
# Test Suite: Employee Management Integration Tests - PHASE 6
# ✅ Should create employee and sync to ERM successfully (201)
# ✅ Should validate required fields (400)
# ✅ Should handle ERM sync failure (202)
# ...
# Tests: 15 passed, 0 failed, 0 skipped
```

### 2. Test API Endpoints in Container

```bash
# Create test script
docker run --rm \
  --name portfolix-api-test \
  --link portfolix-dev-test:backend \
  -e BACKEND_URL=http://backend:3000 \
  nicolaka/netcat:latest bash -c '
  echo "Testing POST /api/employees"
  curl -X POST http://backend:3000/api/employees \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@company.com\",\"employeeId\":\"EMP001\",\"department\":\"IT\",\"designation\":\"Dev\"}"
  '
```

### 3. Rate Limiting Test

```bash
# Test rate limiting (5 requests per minute)
docker run --rm \
  --name portfolix-rate-test \
  --link portfolix-dev-test:backend \
  nicolaka/netcat:latest bash -c '
  for i in {1..7}; do
    echo "Request $i"
    curl -I http://backend:3000/api/employees
    sleep 5
  done
  '

# Expected:
# Request 1-5: HTTP 200 OK
# Request 6: HTTP 429 Too Many Requests
```

---

## 📆 DOCKER COMPOSE FULL STACK TESTING

### docker-compose.yml

```yaml
version: '3.9'

services:
  mongodb:
    image: mongo:5.0-alpine
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: portfolix-compass
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: staging
      MONGO_URI: mongodb://mongodb:27017/portfolix-compass
      ERM_API_BASE_URL: http://erm-mock:8080/api
      PORT: 3000
    depends_on:
      mongodb:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - ./logs:/app/logs

  test:
    build:
      context: .
      dockerfile: Dockerfile
    command: npm run test:integration
    environment:
      NODE_ENV: test
      MONGO_URI: mongodb://mongodb:27017/portfolix-compass-test
      BACKEND_URL: http://backend:3000
    depends_on:
      backend:
        condition: service_healthy

volumes:
  mongo-data:
```

### Run Full Stack Tests

```bash
# Build and start all services
docker-compose up --build

# Expected output:
# mongodb_1  | [initandlisten] waiting for connections on port 27017
# backend_1  | [APP] PORTFOLIX COMPASS BACKEND - PHASE 6 - Production Server Started
# test_1     | Test Suite: 15 passed in 45 seconds
# test_1 exited with code 0

# Stop all services
docker-compose down
```

---

## 🔝 CONTINUOUS INTEGRATION TESTING

### GitHub Actions Workflow (.github/workflows/test.yml)

```yaml
name: Docker Build & Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t portfolix-backend:${{ github.sha }} .
      
      - name: Run tests
        run: |
          docker run --rm \
            -e NODE_ENV=test \
            -e MONGO_URI=mongodb://mongo:27017/test \
            portfolix-backend:${{ github.sha }} \
            npm run test:integration
      
      - name: Push to registry (if main)
        if: github.ref == 'refs/heads/main'
        run: |
          docker tag portfolix-backend:${{ github.sha }} portfolix-backend:latest
          docker push portfolix-backend:latest
```

---

## ✅ TESTING CHECKLIST

### Unit Tests
- [ ] All middleware functions tested
- [ ] All service functions tested
- [ ] Error handling tested
- [ ] Correlation ID generation tested

### Integration Tests (15+ cases)
- [ ] Employee creation with ERM sync
- [ ] Employee termination
- [ ] Sync status retrieval
- [ ] Error handling (400, 404, 500)
- [ ] Rate limiting (429)
- [ ] Input validation
- [ ] Correlation ID tracking
- [ ] Health check endpoint

### Docker Tests
- [ ] Image builds successfully
- [ ] Container starts without errors
- [ ] Health check passes
- [ ] All endpoints accessible
- [ ] Logs formatted correctly
- [ ] Graceful shutdown works

### Performance Tests
- [ ] Response time < 500ms
- [ ] Rate limiting enforced
- [ ] Memory usage stable
- [ ] No memory leaks

---

## 🐓 TROUBLESHOOTING

### Container won't start
```bash
# Check logs
docker logs portfolix-dev-test

# Common issues:
# - Port 3000 already in use: kill process or use different port
# - MongoDB not running: start MongoDB service
# - Invalid env vars: check .env.staging file
```

### Tests failing
```bash
# Run with verbose output
docker run -it \
  --name portfolix-test-debug \
  --link portfolix-dev-test:backend \
  -e DEBUG=* \
  portfolix-backend:phase6 \
  npm run test:integration -- --verbose
```

### Network issues
```bash
# Check container network
docker inspect portfolix-dev-test | grep -A 10 NetworkSettings

# Test connectivity
docker exec portfolix-dev-test ping -c 1 8.8.8.8
```

---

## 🔍 MONITORING IN CONTAINER

### Check Resource Usage
```bash
# Real-time stats
docker stats portfolix-dev-test

# Expected:
# CONTAINER  CPU %   MEM USAGE
# portfolix  0.5%    145MB
```

### View sync metrics
```bash
docker exec portfolix-dev-test npm run metrics:sync

# Expected output:
# Sync Success Rate: 98.5%
# Avg Response Time: 245ms
# Total Syncs: 1250
```

---

## ✅ STATUS: DOCKER & TESTING READY

**Docker Image**: ✅ Production-grade  
**Testing**: ✅ 15+ automated tests  
**CI/CD**: ✅ GitHub Actions configured  
**Documentation**: ✅ Complete  

**Ready for**: Automated deployment pipeline
