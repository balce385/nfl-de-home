"""
TheSportsDB Free-API → teams-Tabelle (Logos, Stadium, Website).
Quelle: https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=NFL
Lizenz: Free for non-commercial / educational; "key 3" ist der public-test-key.
"""
import httpx
from .common import upsert, USER_AGENT

URL = "https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=NFL"

# TheSportsDB-Names → unsere teams.id (3-Letter-Abk)
NAME_TO_ID = {
    "Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL",
    "Buffalo Bills":"BUF","Carolina Panthers":"CAR","Chicago Bears":"CHI",
    "Cincinnati Bengals":"CIN","Cleveland Browns":"CLE","Dallas Cowboys":"DAL",
    "Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB",
    "Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX",
    "Kansas City Chiefs":"KC","Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC",
    "Los Angeles Rams":"LAR","Miami Dolphins":"MIA","Minnesota Vikings":"MIN",
    "New England Patriots":"NE","New Orleans Saints":"NO","New York Giants":"NYG",
    "New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT",
    "San Francisco 49ers":"SF","Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB",
    "Tennessee Titans":"TEN","Washington Commanders":"WAS",
}

DIVISIONS = {
    "ARI":("NFC","West"),"LAR":("NFC","West"),"SF":("NFC","West"),"SEA":("NFC","West"),
    "DAL":("NFC","East"),"NYG":("NFC","East"),"PHI":("NFC","East"),"WAS":("NFC","East"),
    "CHI":("NFC","North"),"DET":("NFC","North"),"GB":("NFC","North"),"MIN":("NFC","North"),
    "ATL":("NFC","South"),"CAR":("NFC","South"),"NO":("NFC","South"),"TB":("NFC","South"),
    "BUF":("AFC","East"),"MIA":("AFC","East"),"NE":("AFC","East"),"NYJ":("AFC","East"),
    "BAL":("AFC","North"),"CIN":("AFC","North"),"CLE":("AFC","North"),"PIT":("AFC","North"),
    "HOU":("AFC","South"),"IND":("AFC","South"),"JAX":("AFC","South"),"TEN":("AFC","South"),
    "DEN":("AFC","West"),"KC":("AFC","West"),"LAC":("AFC","West"),"LV":("AFC","West"),
}


def run():
    print(f"TheSportsDB NFL: lade Teams …")
    with httpx.Client(timeout=30, headers={"User-Agent": USER_AGENT}) as c:
        r = c.get(URL)
        r.raise_for_status()
        data = r.json()

    teams = data.get("teams") or []
    rows = []
    for t in teams:
        name = t.get("strTeam")
        team_id = NAME_TO_ID.get(name)
        if not team_id:
            continue
        conf, div = DIVISIONS.get(team_id, ("AFC", "East"))
        rows.append({
            "id": team_id,
            "name": name,
            "conference": conf,
            "division": div,
            "logo_url": t.get("strBadge") or t.get("strTeamBadge") or t.get("strLogo"),
            "badge_url": t.get("strBadge"),
            "stadium": t.get("strStadium"),
            "stadium_capacity": int(t["intStadiumCapacity"]) if (t.get("intStadiumCapacity") or "").isdigit() else None,
            "country": t.get("strCountry") or "USA",
            "website": t.get("strWebsite"),
        })

    print(f"  → {len(rows)} Teams gefunden, upserte …")
    upsert("teams", rows, on_conflict="id")
    print("  ✓ Teams aktualisiert")


if __name__ == "__main__":
    run()
