# =============================================================================
#  Supabase-MCP für dieses Projekt einrichten
#  Projekt-Ref: hcelthqzbefnvzjtiekf
#  =============================================================================
#
#  Ausführung: in PowerShell im Projekt-Root öffnen
#  >  cd E:\Balce-AI\NFL-DE-Fan-app\nfl-de-fan-hub
#  >  .\setup_supabase_mcp.ps1
#
#  Falls Execution-Policy meckert:
#  >  powershell -ExecutionPolicy Bypass -File .\setup_supabase_mcp.ps1
# =============================================================================

Write-Host "== Schritt 1/3: Supabase-MCP zum Projekt hinzufuegen ==" -ForegroundColor Cyan
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=hcelthqzbefnvzjtiekf"

Write-Host ""
Write-Host "== Schritt 2/3: Authentifizieren (interaktiv) ==" -ForegroundColor Cyan
Write-Host "Im naechsten Schritt oeffnet sich ein Browser-Fenster fuer Login."
Write-Host "Druecke ENTER um fortzufahren..."
Read-Host
claude /mcp

Write-Host ""
Write-Host "== Schritt 3/3: Supabase Agent Skills installieren (optional) ==" -ForegroundColor Cyan
$response = Read-Host "Skills jetzt installieren? (j/N)"
if ($response -eq "j" -or $response -eq "J") {
    npx skills add supabase/agent-skills
}

Write-Host ""
Write-Host "== Fertig! ==" -ForegroundColor Green
Write-Host "Starte Cowork neu, damit der MCP-Server aktiv wird."
