#!/usr/bin/env bash
# ralph.sh
# Usage: ./ralph.sh <iterations>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

# For each iteration, run Claude Code with the following prompt.
# This prompt is basic, we'll expand it later.
for ((i=1; i<=$1; i++)); do
  echo "Iteration $i"
  echo "--------------------------------"
  result=$(claude --permission-mode acceptEdits -p "@plans/PLANS.json @plans/progress.txt @plans/prd.json \
1. Decide which task to work on next. \
This should be the one YOU decide has the highest priority, \
- not necessarily the first in the list. \
2. Check PLANS.json for a plan for this prd.json's item. If there is no plan, create one.
3. Check any feedback loops, such as types and tests. \
4. Update the PRD with the work that was done.
5. Append your progress to the progress.txt file. \
Use this to leave a note for the next person working in the codebase. \
6. Make a git commit of that feature. \
ONLY WORK ON A SINGLE FEATURE. \
If, while implementing the feature, you notice that all work \
is complete, output <promise>COMPLETE</promise>. \
")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete, exiting."
    osascript -e 'display notification "CVM PRD complete after '"$i"' iterations" with title "Ralph"'
    exit 0
  fi
done
