gemini -m gemini-2.5-flash-lite -p "bump @package.json version with +0.1.0 and also in @src/views/DashboardView.js bump title.textContent with 0.1, in @gitlog.bat bump with +0.1, do not commit or stage any files" -y
pause

bump @package.json version with +0.1.0 (or to the next major version, e.g. 1.35 do not use 3 signs) 
bump @gitlog.bat with +0.1

run cd "c:\Users\krase\repos\BlinkBudget" && gitlog.bat

read @changelog.txt and update it for github changelog page, 
summarize it in few notes but reword it so it's more easily understood, 
update the changelog.txt file itself

Update @readme.md with the new features from the changelog.txt