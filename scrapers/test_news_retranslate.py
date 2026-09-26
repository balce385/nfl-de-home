from scrapers import nfl_news


class _Query:
    def __init__(self, sb):
        self.sb = sb

    def __getattr__(self, name):  # select/eq/gte/order/limit: Kette weiterreichen
        return lambda *a, **k: self

    def update(self, values):
        self.sb.updates.append(values)
        return self

    def execute(self):
        return type("R", (), {"data": self.sb.rows})()


class _Sb:
    def __init__(self, rows):
        self.rows, self.updates = rows, []

    def table(self, name):
        return _Query(self)


def test_nur_vollstaendig_uebersetzte_artikel_werden_gespeichert(monkeypatch):
    sb = _Sb([
        {"id": 1, "slug": "good", "title": "Good title", "body_md": "Good body"},
        {"id": 2, "slug": "b", "title": "Blocked title", "body_md": "x"},  # Titel bleibt englisch
        {"id": 3, "slug": "h", "title": "Half title", "body_md": "Blocked body"},  # Text bleibt englisch
    ])
    monkeypatch.setattr(nfl_news, "supabase_admin", lambda: sb)
    monkeypatch.setattr(
        nfl_news, "translate_to_de", lambda t: t if "Blocked" in t else "DE " + t
    )

    assert nfl_news._retranslate() == ["https://nfl-fan-app.de/magazin/good"]

    assert sb.updates == [{
        "title": "DE Good title",
        "excerpt": "DE Good body",
        "body_md": "DE Good body",
        "language": "de",
        "original_title": "Good title",
        "translated": True,
    }]
