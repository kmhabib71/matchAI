#!/bin/bash

# Print header
echo "==============================================="
echo "  Running Personality Quiz Update & Match Test"
echo "==============================================="
echo ""

# First update the users' personality quiz data
echo "Step 1: Updating users with personality quiz data..."
node scripts/update-personality-quiz.js
echo ""

# Wait a moment for any database operations to complete
echo "Waiting for database operations to complete..."
sleep 3
echo ""

# Then test the matching algorithm
echo "Step 2: Testing matching algorithm with updated users..."
node scripts/test-matching-algorithm.js
echo ""

echo "==============================================="
echo "  All tests completed!"
echo "===============================================" 