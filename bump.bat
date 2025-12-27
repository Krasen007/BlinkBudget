gemini -m gemini-2.5-flash-lite -p "bump @package.json version with +0.1.0 and also in @src/views/DashboardView.js bump title.textContent with 0.1, in @gitlog.bat bump with +0.1, do not commit or stage any files" -y
pause

gemini -m gemini-2.5-flash-lite -p "in @gitlog.bat bump with +0.1" -y