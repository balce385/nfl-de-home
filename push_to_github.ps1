# =============================================================================
#  Initial Push zu GitHub - nfl-de-home
#  Robust: behandelt git-stderr als info (nicht Error), Auth-Pop-up moeglich
# =============================================================================
#  Ausfuehrung:
#    powershell -ExecutionPolicy Bypass -File .\push_to_github.ps1
# =============================================================================

$REPO_URL = "https://github.com/balce385/nfl-de-home.git"
$BRANCH   = "main"

# WICHTIG: ErrorActionPreference auf Continue, sonst killen normale git-Status
# Meldungen das Skript (PowerShell behandelt stderr als Error)
$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

function Run-Git {
    param([string]$Args, [switch]$IgnoreError)
    $output = & cmd /c "git $Args 2>&1"
    $code = $LASTEXITCODE
    Write-Host $output
    if ($code -ne 0 -and -not $IgnoreError) {
        Write-Host "  [FEHLER] git $Args (exit=$code)" -ForegroundColor Red
        return $false
    }
    return $true
}

Write-Host ""
Write-Host "== 1/7: git installiert? ==" -ForegroundColor Cyan
$gitVer = & cmd /c "git --version 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FEHLER] Git nicht gefunden" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] $gitVer" -ForegroundColor Green

Write-Host ""
Write-Host "== 2/7: .gitignore vorhanden ==" -ForegroundColor Cyan
if (-not (Test-Path .gitignore)) {
    Write-Host "  [FEHLER] keine .gitignore!" -ForegroundColor Red
    exit 1
}
$gi = Get-Content .gitignore -Raw
if (-not ($gi -match "\.env")) {
    Write-Host "  [WARN] .env nicht in .gitignore!" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] .env*.local geblockt" -ForegroundColor Green

Write-Host ""
Write-Host "== 3/7: git init ==" -ForegroundColor Cyan
if (-not (Test-Path .git)) {
    & cmd /c "git init 2>&1"
    & cmd /c "git branch -M $BRANCH 2>&1"
    Write-Host "  [OK] frisch initialisiert" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] .git bereits da" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "== 4/7: Remote setzen ==" -ForegroundColor Cyan
$remotes = & cmd /c "git remote 2>&1"
if ($remotes -match "origin") {
    & cmd /c "git remote set-url origin $REPO_URL 2>&1"
} else {
    & cmd /c "git remote add origin $REPO_URL 2>&1"
}
Write-Host "  [OK] origin = $REPO_URL" -ForegroundColor Green

Write-Host ""
Write-Host "== 5/7: Pull mit unrelated-histories ==" -ForegroundColor Cyan
& cmd /c "git fetch origin 2>&1" | Out-Null
$remoteHasMain = & cmd /c "git ls-remote --heads origin $BRANCH 2>&1"
if ($remoteHasMain -and $remoteHasMain -match "refs/heads/$BRANCH") {
    Write-Host "  Remote-Branch existiert - merge unrelated-histories" -ForegroundColor Yellow
    $pullOut = & cmd /c "git pull origin $BRANCH --allow-unrelated-histories --no-edit 2>&1"
    Write-Host $pullOut
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] Pull-Konflikt - Force-Push als Fallback?" -ForegroundColor Yellow
        Write-Host "  Manueller Fix:" -ForegroundColor Yellow
        Write-Host "    git status   (Konflikte sehen)" -ForegroundColor Yellow
        Write-Host "    git checkout --theirs <file>   (deren Version)" -ForegroundColor Yellow
        Write-Host "    git checkout --ours <file>     (deine Version)" -ForegroundColor Yellow
        Write-Host "    git add . ; git commit -m 'merge'" -ForegroundColor Yellow
        Write-Host "    git push -u origin $BRANCH" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  ODER alles ueberschreiben (LOESCHT die .gitignore vom Remote-Repo):" -ForegroundColor Yellow
        Write-Host "    git push -u origin $BRANCH --force" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "  [OK] Remote ist leer" -ForegroundColor Green
}

Write-Host ""
Write-Host "== 6/7: Add + Commit + Secret-Scan ==" -ForegroundColor Cyan
& cmd /c "git add . 2>&1" | Out-Null
$tracked = & cmd /c "git ls-files 2>&1"
$bad = $tracked | Where-Object { $_ -match "\.env\.local$|\.env\.production$|^\.env$" }
if ($bad) {
    Write-Host "  [STOP] Secret-Files getrackt:" -ForegroundColor Red
    $bad | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    Write-Host "  Loese: git rm --cached .env.local" -ForegroundColor Yellow
    exit 1
}
$staged = & cmd /c "git diff --cached --name-only 2>&1"
$stagedCount = ($staged | Measure-Object).Count
if ($stagedCount -eq 0) {
    Write-Host "  [SKIP] Nichts zu committen" -ForegroundColor Yellow
} else {
    Write-Host "  $stagedCount Files staged" -ForegroundColor Green
    & cmd /c "git commit -m `"feat: initial NFL-DE-Home`" 2>&1"
}

Write-Host ""
Write-Host "== 7/7: Push (Auth-Pop-up moeglich) ==" -ForegroundColor Cyan
$pushOut = & cmd /c "git push -u origin $BRANCH 2>&1"
Write-Host $pushOut
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  [PUSH FEHLGESCHLAGEN]" -ForegroundColor Red
    Write-Host "  Wahrscheinliche Ursache: Auth fehlt" -ForegroundColor Yellow
    Write-Host "  Loesung 1: Personal Access Token (empfohlen)" -ForegroundColor Yellow
    Write-Host "    https://github.com/settings/tokens/new" -ForegroundColor Yellow
    Write-Host "    Scope: 'repo'  -> Token kopieren" -ForegroundColor Yellow
    Write-Host "    git push -u origin main   (Username = balce385, Password = TOKEN)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Loesung 2: GitHub CLI" -ForegroundColor Yellow
    Write-Host "    winget install GitHub.cli" -ForegroundColor Yellow
    Write-Host "    gh auth login   -> Browser Flow" -ForegroundColor Yellow
    Write-Host "    git push -u origin main" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "== Fertig! ==" -ForegroundColor Green
Write-Host "Repo: $REPO_URL"
