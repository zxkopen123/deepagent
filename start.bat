@echo off
cd /d "%~dp0"
echo Starting DeepAgent...
start /B npx electron .
exit
