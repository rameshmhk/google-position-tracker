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
echo Step 2: Connecting to server to pull changes...
echo Please enter the password 'digital' when prompted:
ssh root@162.243.209.73 "cd /root/google-position-tracker && git pull origin master && npm install && cd frontend && npm install && npm run build && pm2 restart all || echo 'PM2 not found, please restart manually'"

echo.
echo ===========================================
echo   DEPLOYMENT PROCESS COMPLETE!
echo ===========================================
pause
