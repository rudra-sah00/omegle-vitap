#!/bin/bash
# Script to check for basic TSDoc coverage
# This checks if exported functions/classes have documentation comments
# STRICT MODE: Can fail deployment if configured

set -e  # Exit on any error

echo "📚 Checking TSDoc comments..."
echo ""

# Find all .ts and .tsx files excluding test files
FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -name "*.test.*" \
  ! -name "*.spec.*" \
  ! -path "*/node_modules/*" \
  ! -path "*/__tests__/*" \
  ! -path "*/.next/*")

if [ -z "$FILES" ]; then
  echo "⚠️  No TypeScript files found to check!"
  exit 1
fi

MISSING_COUNT=0
ISSUE_FILES=""

for file in $FILES; do
  # Look for export statements without TSDoc comments above them
  # This is a simplified check - looks for exports not preceded by /**
  
  ISSUES=$(awk '
    /^export (function|class|interface|type|const)/ {
      if (prev !~ /\*\//) {
        print NR ": " $0
      }
    }
    { prev = $0 }
  ' "$file")
  
  if [ ! -z "$ISSUES" ]; then
    if [ -z "$ISSUE_FILES" ]; then
      ISSUE_FILES="$file"
    else
      ISSUE_FILES="$ISSUE_FILES
$file"
    fi
    
    echo "📄 $file"
    echo "$ISSUES" | while IFS= read -r line; do
      LINE_NUM=$(echo "$line" | cut -d: -f1)
      CODE=$(echo "$line" | cut -d: -f2-)
      echo "   ⚠️  Line $LINE_NUM: Missing TSDoc"
      echo "      $CODE"
      MISSING_COUNT=$((MISSING_COUNT + 1))
    done
    echo ""
  fi
done

TOTAL_FILES=$(echo "$FILES" | wc -l | tr -d ' ')

if [ -z "$ISSUE_FILES" ]; then
  echo "✅ All exported entities have TSDoc comments!"
  echo "   Scanned $TOTAL_FILES TypeScript files"
  exit 0
else
  FILE_COUNT=$(echo "$ISSUE_FILES" | wc -l | tr -d ' ')
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⚠️  WARNING: TSDoc coverage incomplete"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📊 Summary: $FILE_COUNT files need TSDoc improvements"
  echo ""
  echo "💡 Action Required:"
  echo "   Add TSDoc comments (/** ... */) above exported entities"
  echo ""
  echo "⚠️  Note: This is a basic check. Run 'npm run lint' for full validation"
  echo ""
  # WARNING ONLY - Don't fail deployment yet (set to exit 1 to make it strict)
  exit 0
fi
