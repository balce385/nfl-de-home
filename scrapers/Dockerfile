# Build-Kontext ist das Repo-Wurzelverzeichnis: Die Scraper importieren sich
# relativ und laufen als Paket `scrapers` (python -m scrapers.run_all).
# Auf dem VPS startet sie ein Cron-Job ueber `docker compose run`, siehe
# balce385/deploy-stack (scrape.sh, crontab).
FROM python:3.12-slim
# Ausgabe geht per Cron in eine Logdatei; ungepuffert steht sie dort sofort.
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY scrapers/pyproject.toml ./scrapers/
RUN pip install --no-cache-dir ./scrapers
COPY scrapers ./scrapers
CMD ["python", "-m", "scrapers.nfl_news"]
