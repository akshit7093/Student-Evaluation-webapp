#!/bin/bash

# List of files to update
FILES=(
  "client/src/pages/students.tsx"
  "client/src/pages/staff.tsx"
  "client/src/pages/reports.tsx"
  "client/src/pages/ai-insights.tsx" 
  "client/src/pages/center-detail.tsx"
  "client/src/pages/student-detail.tsx"
)

# Make the replacement in each file
for file in "${FILES[@]}"; do
  # First check if the file contains useRouter
  if grep -q "const \[\s*,\s*navigate\s*\]\s*=\s*useRouter()" "$file"; then
    echo "Updating $file..."
    sed -i 's/const \[\s*,\s*navigate\s*\]\s*=\s*useRouter()/const [, navigate] = useLocation()/g' "$file"
  fi
done

echo "All files updated!"
