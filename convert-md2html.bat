@echo off
setlocal

REM Argument check
if "%~1"=="" (
    echo Usage: convert-md2html.bat ^<input file/directory path^> ^<output file/directory path^> [--nav] [--fit-tables] [--css ^<css file^>]
    echo Supported formats: Markdown, csv
    echo Options: --nav or --navigation to add navigation menu; --fit-tables to fit tables to page width
    echo          --css ^<css file^> to embed additional CSS ^(repeatable^)
    exit /b 1
)

if "%~2"=="" (
    echo Usage: convert-md2html.bat ^<input file/directory path^> ^<output file/directory path^> [--nav] [--fit-tables] [--css ^<css file^>]
    echo Supported formats: Markdown, csv 
    echo Options: --nav or --navigation to add navigation menu; --fit-tables to fit tables to page width
    echo          --css ^<css file^> to embed additional CSS ^(repeatable^)
    exit /b 1
)

REM Display debug information
echo Debug: Starting conversion...
echo Debug: Arguments: %*

REM Execute Node.js script (pass all arguments)
echo Debug: Executing Node.js script...
node "%~dp0convert-md2html.js" %*

echo Debug: Node.js script completed with exit code: %ERRORLEVEL%

endlocal
