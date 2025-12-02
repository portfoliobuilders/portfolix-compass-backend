#!/bin/bash

# ============================================================================
# Portfolix Compass - Gemini AI/ML Setup Script
# ============================================================================
# This script automates the setup of Gemini AI/ML integration
# Run this script BEFORE starting the application for the first time
# ============================================================================

set -e

echo ""
echo "==================== PORTFOLIX COMPASS AI/ML SETUP ==================="
echo "Starting Gemini AI/ML Integration Setup..."
echo "Version: 1.0.0"
echo "Date: $(date)"
echo ""

# ============================================================================
# STEP 1: Check Node.js and npm
# ============================================================================
echo "[1/7] Checking Node.js and npm installation..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "✅ Node.js: $NODE_VERSION"
echo "✅ npm: $NPM_VERSION"
echo ""

# ============================================================================
# STEP 2: Check project structure
# ============================================================================
echo "[2/7] Verifying project structure..."

REQUIRED_DIRS=("src" "src/services" "src/routes" "src/middleware")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Directory $dir not found!"
        exit 1
    fi
done
echo "✅ Project structure verified"
echo ""

# ============================================================================
# STEP 3: Create .env file
# ============================================================================
echo "[3/7] Configuring environment variables..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example.gemini" ]; then
        cp ".env.example.gemini" ".env"
        echo "✅ Created .env file from .env.example.gemini"
    else
        echo "⚠️  .env.example.gemini not found, creating minimal .env"
        cat > .env << 'EOF'
GEMINI_API_KEY=YOUR_API_KEY_HERE
GEMINI_MODEL=gemini-pro
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/portfolix-compass
CACHE_ENABLED=true
CACHE_TTL=900
EOF
        echo "✅ Created minimal .env file"
    fi
else
    echo "⚠️  .env file already exists, skipping creation"
fi
echo ""

# ============================================================================
# STEP 4: Check for required files
# ============================================================================
echo "[4/7] Verifying AI/ML service files..."

REQUIRED_FILES=(
    "src/services/aiml.service.js"
    "src/routes/aiml.routes.js"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "❌ Missing required files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo "Please ensure all AI/ML service files are in place."
    exit 1
else
    echo "✅ All required AI/ML service files found"
fi
echo ""

# ============================================================================
# STEP 5: Install dependencies
# ============================================================================
echo "[5/7] Installing npm dependencies..."

echo "Installing @google/generative-ai..."
npm install @google/generative-ai --save

echo "Installing node-cache..."
npm install node-cache --save

echo "✅ Dependencies installed successfully"
echo ""

# ============================================================================
# STEP 6: Verify server.js configuration
# ============================================================================
echo "[6/7] Checking server.js configuration..."

if grep -q "aiml.routes" src/server.js; then
    echo "✅ AI/ML routes already registered in server.js"
else
    echo "⚠️  AI/ML routes not found in server.js"
    echo "Please add this line to src/server.js:"
    echo "   app.use('/api/aiml', require('./routes/aiml.routes'));"
fi
echo ""

# ============================================================================
# STEP 7: Validate environment setup
# ============================================================================
echo "[7/7] Validating environment setup..."

if grep -q "YOUR_API_KEY_HERE" .env; then
    echo "⚠️  GEMINI_API_KEY not configured!"
    echo ""
    echo "To get your API key:"
    echo "1. Visit: https://aistudio.google.com/api-keys"
    echo "2. Create a new project or use existing one"
    echo "3. Generate API key"
    echo "4. Update GEMINI_API_KEY in .env file"
    echo ""
else
    echo "✅ GEMINI_API_KEY is configured"
fi

echo ""
echo "==================== SETUP COMPLETE ==================="
echo ""
echo "✅ Gemini AI/ML integration setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your actual GEMINI_API_KEY"
echo "2. Ensure MongoDB is running (if not using cloud)"
echo "3. Start the server: npm run dev"
echo "4. Test health endpoint: curl http://localhost:5000/api/aiml/health"
echo ""
echo "Documentation: Read GEMINI_AI_ML_SETUP.md for complete guide"
echo ""
echo "================================================="
