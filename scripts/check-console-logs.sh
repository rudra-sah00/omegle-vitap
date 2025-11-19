#!/bin/bash
# Script to detect ANY console statements in production code
# All console methods should be removed from production code
# STRICT MODE: Exits with code 1 on any violation

set -e  # Exit on any error

echo "🔍 Scanning for console statements..."
echo ""

# Find all .ts, .tsx, .js, .jsx files excluding test files and node_modules
FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  ! -name "*.test.*" \
  ! -name "*.spec.*" \
  ! -path "*/node_modules/*" \
  ! -path "*/.next/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  ! -path "*/coverage/*")

if [ -z "$FILES" ]; then
  echo "⚠️  No source files found to check!"
  exit 1
fi

# Search for ANY console.* usage (log, debug, info, warn, error, table, trace, etc.)
MATCHES=$(echo "$FILES" | xargs grep -n -E "console\." 2>/dev/null | grep -v "^\s*//" | grep -v "^\s*\*" || true)

if [ -z "$MATCHES" ]; then
  echo "✅ No console statements found in production code!"
  echo "   Scanned $(echo "$FILES" | wc -l | tr -d ' ') files"
  exit 0
else
  echo "❌ STRICT MODE VIOLATION: Console statements detected!"
  echo ""
  echo "$MATCHES" | while IFS= read -r line; do
    FILE=$(echo "$line" | cut -d: -f1)
    LINE_NUM=$(echo "$line" | cut -d: -f2)
    CODE=$(echo "$line" | cut -d: -f3-)
    echo "📄 $FILE:$LINE_NUM"
    echo "   $CODE"
    echo ""
  done
  
  COUNT=$(echo "$MATCHES" | wc -l | tr -d ' ')
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ FAILURE: Found $COUNT console statement(s)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🚫 DEPLOYMENT BLOCKED"
  echo ""
  echo "💡 Action Required:"
  echo "   Remove ALL console statements from production code"
  echo "   Use proper logging libraries for production logging"
  echo ""
  exit 1
fi
