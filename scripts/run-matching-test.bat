@echo off

REM Print header
echo ===============================================
echo   Running Personality Quiz Update ^& Match Test
echo ===============================================
echo.

REM Copy the scripts .env file
echo Setting up environment variables...
copy .env.scripts .env /Y
echo.

REM First update the users' personality quiz data
echo Step 1: Updating users with personality quiz data...
node scripts/update-personality-quiz.js
echo.

REM Wait a moment for any database operations to complete
echo Waiting for database operations to complete...
timeout /t 3 >nul
echo.

REM Then test the matching algorithm
echo Step 2: Testing matching algorithm with updated users...
node scripts/test-matching-algorithm.js
echo.

REM Restore the original .env file if it exists
if exist .env.backup (
  echo Restoring original environment variables...
  copy .env.backup .env /Y
  del .env.backup
  echo.
)

echo ===============================================
echo   All tests completed!
echo ===============================================

pause 