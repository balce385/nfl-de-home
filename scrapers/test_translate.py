from scrapers import translate


class _Blocked:
    calls = 0

    def translate(self, text):
        self.calls += 1
        raise RuntimeError("Server Error: You made too many requests to the server.")


class _Echo:
    def translate(self, text):
        return "DE:" + text


def test_gesperrtes_backend_wird_nur_einmal_gefragt(monkeypatch):
    google = _Blocked()
    monkeypatch.setattr(translate, "_google", google)
    monkeypatch.setattr(translate, "_mymem", _Echo())
    monkeypatch.setattr(translate, "_blocked", set())
    monkeypatch.setattr(translate, "_MIN_INTERVAL", 0)
    translate.translate_to_de.cache_clear()

    assert translate.translate_to_de("first headline") == "DE:first headline"
    assert translate.translate_to_de("second headline") == "DE:second headline"
    assert google.calls == 1
