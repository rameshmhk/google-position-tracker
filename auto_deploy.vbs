set WshShell = WScript.CreateObject("WScript.Shell")
' Open Command Prompt
WshShell.Run "cmd.exe"
WScript.Sleep 1000

' Type the SSH command
WshShell.SendKeys "ssh root@162.243.209.73 ""cd /root/google-position-tracker && git pull origin master && npm install && npm run build && pm2 restart all""{ENTER}"
WScript.Sleep 3000

' Type the password
WshShell.SendKeys "News@12345@@#dDs{ENTER}"
WScript.Sleep 2000

' Success message
WScript.Echo "Deployment script sent to the server. Please wait for completion."
