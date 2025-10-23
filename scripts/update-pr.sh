#!/bin/bash

set -e

if [ "$GITHUB_EVENT_NAME" == "pull_request" ]; then
  PR_TITLE=$(jq -r .pull_request.title "$GITHUB_EVENT_PATH")
  echo "PR_TITLE=$PR_TITLE" >> "$GITHUB_ENV"
fi

SUPABASE_URL=${SUPABASE_URL}
SUPABASE_KEY=${SUPABASE_KEY}
PR_TITLE=${PR_TITLE}
COMMIT_ID=${GITHUB_SHA}
REPO_NAME=$(jq -r .repository.name "$GITHUB_EVENT_PATH")

IFS='_' read -ra parts <<< "$REPO_NAME"
CANDIDATE_ASSESSMENT_ID="${parts[1]}"

if [ "$GITHUB_EVENT_NAME" == "pull_request" ]; then
  curl -X PATCH "$SUPABASE_URL/rest/v1/candidate_assessment?id=eq.${CANDIDATE_ASSESSMENT_ID}&status=eq.Started" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg pr_name "$PR_TITLE" '{pr_name: $pr_name}')"
else
  curl -X PATCH "$SUPABASE_URL/rest/v1/candidate_assessment?id=eq.${CANDIDATE_ASSESSMENT_ID}&status=eq.Started" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg sha "$COMMIT_ID" '{sha: $sha}')"
fi