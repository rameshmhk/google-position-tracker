set WshShell = WScript.CreateObject("WScript.Shell")
WshShell.Run "cmd.exe"
WScript.Sleep 1000
WshShell.SendKeys "ssh root@162.243.209.73 ""cd /root/google-position-tracker && git pull origin master && npm install && npm run build && pm2 restart all""{ENTER}"
WScript.Sleep 3000
' Sending the complex password exactly
WshShell.SendKeys "News@12345@@#dDs{ENTER}"
WScript.Sleep 2000
