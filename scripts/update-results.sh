#!/bin/bash

set -e
IFS='_' read -ra parts <<< "$REPO_NAME"
export CANDIDATE_ASSESSMENT_ID="${parts[1]}"

echo "Extracting test history from results.json..."

testHistory=$(jq '[.testResults[].assertionResults[] | {testName: .title, testStatus: .status}]' results.json)
numPassed=$(jq '.numPassedTests' results.json)
numTotal=$(jq '.numTotalTests' results.json)

testScore="${numPassed}/${numTotal}"

payload=$(jq -n \
  --argjson summary "$testHistory" \
  --arg score "$testScore" \
   '{ results: { "result-score": $score, "result-summary": $summary } }')


curl -s -o /dev/null -w "%{http_code}" -X PATCH "$SUPABASE_URL/rest/v1/candidate_assessment?id=eq.${CANDIDATE_ASSESSMENT_ID}&status=eq.Started" \
  -H "apikey: $SUPABASE_API_KEY" \
  -H "Authorization: Bearer $SUPABASE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$payload"