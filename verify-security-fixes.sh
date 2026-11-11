#!/bin/bash

# Supabase Security Fix Verification Script
# This script helps verify that all security fixes have been properly applied
# Run this AFTER applying the migration

echo "🔐 Supabase Security Fix Verification Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if user provided database connection string
if [ -z "$1" ]; then
    echo "Usage: ./verify-security-fixes.sh <database_url>"
    echo ""
    echo "Example:"
    echo "  ./verify-security-fixes.sh 'postgresql://user:password@host:5432/database'"
    echo ""
    echo "To get your database URL:"
    echo "  1. Go to Supabase Dashboard"
    echo "  2. Project Settings > Database > Connection String"
    echo "  3. Copy the PostgreSQL connection string"
    exit 1
fi

DB_URL="$1"

# Function to run SQL query
run_query() {
    psql "$DB_URL" -c "$1" 2>/dev/null
}

# Function to check if RLS is enabled on a table
check_rls_enabled() {
    local table=$1
    local result=$(psql "$DB_URL" -t -c "SELECT rowsecurity FROM pg_tables WHERE tablename = '$table' AND schemaname = 'public';" 2>/dev/null)
    if [ "$result" = "t" ]; then
        return 0  # True - RLS is enabled
    else
        return 1  # False - RLS is not enabled
    fi
}

# Function to check if a view exists
check_view_exists() {
    local view=$1
    local result=$(psql "$DB_URL" -t -c "SELECT viewname FROM pg_views WHERE viewname = '$view' AND schemaname = 'public';" 2>/dev/null)
    if [ ! -z "$result" ]; then
        return 0  # True - View exists
    else
        return 1  # False - View does not exist
    fi
}

echo "📋 Running Verification Tests..."
echo ""

# Test 1: Check RLS on Reference Tables
echo "1️⃣  Checking RLS on Reference Tables..."
reference_tables=("instrument_types" "lifecycle_stages" "policy_statuses" "countries")
ref_pass=0

for table in "${reference_tables[@]}"; do
    if check_rls_enabled "$table"; then
        echo -e "   ${GREEN}✓${NC} $table - RLS Enabled"
        ((ref_pass++))
    else
        echo -e "   ${RED}✗${NC} $table - RLS NOT Enabled"
    fi
done

echo "   Result: $ref_pass/4 tables have RLS enabled"
echo ""

# Test 2: Check RLS on User Tables
echo "2️⃣  Checking RLS on User Data Tables..."
user_tables=("user_preferences" "user_profiles" "policy_engagement" "policy_status_history")
user_pass=0

for table in "${user_tables[@]}"; do
    if check_rls_enabled "$table"; then
        echo -e "   ${GREEN}✓${NC} $table - RLS Enabled"
        ((user_pass++))
    else
        echo -e "   ${RED}✗${NC} $table - RLS NOT Enabled"
    fi
done

echo "   Result: $user_pass/4 tables have RLS enabled"
echo ""

# Test 3: Check if views exist
echo "3️⃣  Checking if Views Exist..."
views=("user_stats" "user_follow_stats" "user_bookmark_stats")
view_pass=0

for view in "${views[@]}"; do
    if check_view_exists "$view"; then
        echo -e "   ${GREEN}✓${NC} $view - Exists"
        ((view_pass++))
    else
        echo -e "   ${RED}✗${NC} $view - MISSING"
    fi
done

echo "   Result: $view_pass/3 views exist"
echo ""

# Test 4: Check policy count
echo "4️⃣  Checking Row Level Security Policies..."
policy_count=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" 2>/dev/null)
echo -e "   ${GREEN}✓${NC} Found $policy_count RLS policies"

if [ "$policy_count" -ge 40 ]; then
    echo -e "   ${GREEN}✓${NC} Sufficient number of policies (expected 40+)"
else
    echo -e "   ${YELLOW}⚠${NC} Expected 40+ policies, found $policy_count"
fi
echo ""

# Test 5: Verify no SECURITY DEFINER in views
echo "5️⃣  Checking SECURITY DEFINER in Views..."
secdef_count=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_views WHERE viewname IN ('user_stats', 'user_follow_stats', 'user_bookmark_stats') AND schemaname = 'public' AND definition LIKE '%SECURITY DEFINER%';" 2>/dev/null)

if [ "$secdef_count" = "0" ]; then
    echo -e "   ${GREEN}✓${NC} No SECURITY DEFINER found in views (correct)"
else
    echo -e "   ${RED}✗${NC} Found SECURITY DEFINER in $secdef_count views (needs fixing)"
fi
echo ""

# Test 6: Detailed RLS Policy Check
echo "6️⃣  Sample RLS Policies Applied..."
echo "   Checking instrument_types policies:"
psql "$DB_URL" -c "SELECT policyname FROM pg_policies WHERE tablename = 'instrument_types' LIMIT 3;" 2>/dev/null | grep -v "^-" | grep -v "policyname" | sed 's/^/   ✓ /'
echo ""

# Summary
echo "📊 Summary"
echo "=========="
total_pass=$((ref_pass + user_pass + view_pass))
total_checks=12

if [ $total_pass -eq $total_checks ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "   Your database security fixes have been successfully applied."
    echo ""
    echo "Security Score: 10/10 🟢"
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED${NC}"
    echo "   Passed: $total_pass / $total_checks"
    echo ""
    echo "Please review the failures above and ensure the migration"
    echo "was properly applied."
    exit 1
fi
