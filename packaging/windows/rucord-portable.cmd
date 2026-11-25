@echo off
rem Runs Rucord with its data beside this file. Security software can deny an unsigned build any
rem write inside the user profile (ERROR_ACCESS_DENIED), and then the cache, saved logins and the
rem diagnostic log all stay read-only. Put this file next to rucord.exe and start Rucord with it.
setlocal
set "ROOT=%~dp0"
if not exist "%ROOT%rucord.exe" (
	echo Put this file next to rucord.exe.
	exit /b 1
)
if not exist "%ROOT%data" mkdir "%ROOT%data"
set "RUCORD_DATA_DIR=%ROOT%data"
start "" "%ROOT%rucord.exe" %*
endlocal
