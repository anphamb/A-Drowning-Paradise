@echo off
setlocal EnableDelayedExpansion
title COMM2754 Assignment Renamer
color 0A

:: ======= PREFIX =======
set "PREFIX=COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-"

cls
echo ==========================================================
echo               COMM2754 FILE RENAMER
echo ==========================================================
echo.

call :RenameFiles html
call :RenameFiles css
call :RenameFiles js
call :RenameFiles md
call :RenameFiles txt
call :RenameFiles pdf
call :RenameFiles wav
call :RenameFiles png
call :RenameFiles jpg
call :RenameFiles jpeg
call :RenameFiles zip

echo.
echo ==========================================================
echo              ALL FILES HAVE BEEN RENAMED!
echo ==========================================================
pause
exit

:: ==========================================================
:: FUNCTION
:: ==========================================================

:RenameFiles

set EXT=%1

set COUNT=0
for %%F in (*.%EXT%) do (
    set /a COUNT+=1
)

if !COUNT! EQU 0 goto :eof

echo.
echo ------------------------------------------
echo Found !COUNT! .%EXT% file(s)
echo ------------------------------------------

for %%F in (*.%EXT%) do (

    echo.
    echo Current file:
    echo    %%F

    set /p DESC=Enter Descriptor:

    ren "%%F" "%PREFIX%!DESC!.%EXT%"

    echo    Renamed to:
    echo    %PREFIX%!DESC!.%EXT%
)

goto :eof