#!/bin/bash
set -e

# Extract assessment name
IFS='_' read -ra parts <<< "$REPO_NAME"
export ASSESSMENT_NAME="${parts[0]}"

# Run Node.js script to download the test case using bucket name and file path
node <<'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');


const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  try {
    const Assessment_Name = process.env.ASSESSMENT_NAME;
    const bucket = 'assessment-tracker';
    const filePath = Assessment_Name.concat('.js');
   

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file from Supabase storage:', downloadError);
      process.exit(1);
    }

    const content = await fileData.text();
    fs.mkdirSync('tests', { recursive: true });
    fs.writeFileSync('tests/test-case-private.test.js', content);
    console.error('Error downloading file from Supabase storage:', downloadError);
    console.log('File downloaded successfully to tests/test-case-private.test.js');
  } catch (e) {
    console.error('Failed to download the test case:', e.message);
    process.exit(1);
  }
})();
EOF
