@echo off
echo ===========================================
echo   RANKING ANYWHERE - PRODUCTION DEPLOY
echo ===========================================
echo.
echo Target IP: 162.243.209.73
echo User: root
echo.
echo Step 1: Pushing latest code to GitHub...
git add .
git commit -m "🚀 PRODUCTION DEPLOY: Latest SEO and Sync updates"
git push origin master

echo.
echo Step 2: Connecting to server to pull and rebuild...
ssh root@162.243.209.73 "cd /var/www/tracker && git stash && git pull origin master && cd backend && npm install && cd ../frontend && npm install && npm run build && pm2 restart tracker-api || echo 'PM2 not found, please restart manually'"

echo.
echo ===========================================
echo   DEPLOYMENT PROCESS COMPLETE!
echo ===========================================
pause

