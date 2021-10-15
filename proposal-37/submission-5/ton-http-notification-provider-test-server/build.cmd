@echo off
set "PLATFORM=%1"
if "%PLATFORM%"=="" set /p "PLATFORM=Enter Value (darwin/amd64,windows/amd64,linux/amd64,linux/arm): " || set "PLATFORM=local"
echo %PLATFORM%
docker build . --target bin --output build --platform  %PLATFORM%