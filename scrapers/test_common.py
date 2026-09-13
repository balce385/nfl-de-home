"""Laeuft ohne Netz: python -m pytest scrapers/test_common.py"""
from postgrest.exceptions import APIError

from scrapers.common import _is_retryable_db


def test_load_and_timeouts_are_retried():
    assert _is_retryable_db(APIError({"message": "JSON could not be generated", "code": 504}))
    assert _is_retryable_db(APIError({"message": "canceling statement due to statement timeout", "code": "57014"}))


def test_real_errors_are_not_retried():
    # SQLSTATE 23514 ist als Zahl > 500 — genau diese Verwechslung darf nicht passieren.
    assert not _is_retryable_db(APIError({"message": "violates check constraint", "code": "23514"}))
    assert not _is_retryable_db(APIError({"message": "column not found", "code": "PGRST204"}))
    assert not _is_retryable_db(APIError({"message": "bad request", "code": 400}))
