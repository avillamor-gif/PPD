#!/bin/bash

# Test script to debug form data persistence

echo "🧪 Testing form data persistence..."
echo ""

# Prepare test data
TEST_DATA='{
  "title": "Law on Environmental Protection and Natural Resource Management (1996)",
  "summary": "Key environmental regulation",
  "commencementDate": "1996-01-01",
  "country": "KH",
  "level": "National",
  "category": "Waste Management",
  "keywords": "test keywords for persistence check",
  "status": "In Force",
  "authority": "Ministry of Environment",
  "link": "https://example.com/policy.pdf",
  "otherLinks": "https://example.com/ref1, https://example.com/ref2",
  "language": "Khmer/English",
  "lifecycle_stage": "Upstream, Downstream"
}'

echo "📤 Sending test data:"
echo "$TEST_DATA" | jq '.{otherLinks, keywords, lifecycle_stage, category}'
echo ""

# Call the local API endpoint
echo "📡 Calling PUT /api/policies/kh-1996-01..."
RESPONSE=$(curl -s -X PUT http://localhost:3000/api/policies/kh-1996-01 \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo ""
echo "✅ API Response:"
echo "$RESPONSE" | jq '.{success, message, data: {other_links: .data.other_links, keywords: .data.keywords, lifecycle_stage: .data.lifecycle_stage, category: .data.category}}'

echo ""
echo "⏳ Waiting for Supabase to process..."
sleep 2

echo ""
echo "📊 Check the server console logs for the detailed conversion and Supabase logs"
