#!/bin/bash

# Script to add GitHub secrets from .env file
# Usage: bash scripts/add-github-secrets.sh

set -e

echo "🔐 Adding GitHub Secrets from .env file..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed!"
    echo "Install it: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI!"
    echo "Run: gh auth login"
    exit 1
fi

echo "📝 Reading secrets from .env file..."
echo ""

# Read and add secrets (only NEXT_PUBLIC_ variables for production build)
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^#.*$ ]] && continue
    
    # Only process NEXT_PUBLIC_ variables
    if [[ "$key" =~ ^NEXT_PUBLIC_ ]]; then
        # Trim whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Skip if value is placeholder
        if [[ "$value" == "your_"* ]]; then
            echo "⚠️  Skipping $key (placeholder value)"
            continue
        fi
        
        echo "✅ Adding secret: $key"
        echo "$value" | gh secret set "$key" --repo rudra-sah00/omeagle-vitap
    fi
done < .env

echo ""
echo "🎉 Done! All secrets have been added to GitHub."
echo ""
echo "⚠️  Important: Also add these secrets manually in GitHub:"
echo "   - FIREBASE_SERVICE_ACCOUNT (Firebase service account JSON)"
echo ""
echo "📋 To view all secrets, run:"
echo "   gh secret list --repo rudra-sah00/omeagle-vitap"
