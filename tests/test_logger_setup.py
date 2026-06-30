import json
import logging
import sys
from datetime import datetime


from logger_setup import CustomJsonFormatter, JsonFormatter


def test_json_formatter_basic_fields():
    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="test.py",
        lineno=10,
        msg="test message",
        args=(),
        exc_info=None,
    )

    formatted = formatter.format(record)
    data = json.loads(formatted)

    assert "ts" in data
    assert data["level"] == "INFO"
    assert data["logger"] == "test_logger"
    assert data["msg"] == "test message"


def test_json_formatter_extra_fields():
    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.WARNING,
        pathname="test.py",
        lineno=20,
        msg="test warning",
        args=(),
        exc_info=None,
    )

    # Simulate adding extra fields like logging.Logger.warning("...", extra={"user_id": 123})
    record.user_id = 123
    record.action = "login"

    formatted = formatter.format(record)
    data = json.loads(formatted)

    assert data["level"] == "WARNING"
    assert data["msg"] == "test warning"
    assert data["user_id"] == 123
    assert data["action"] == "login"


def test_json_formatter_exc_info():
    formatter = JsonFormatter()

    try:
        1 / 0
    except ZeroDivisionError:
        exc_info = sys.exc_info()

    record = logging.LogRecord(
        name="test_logger",
        level=logging.ERROR,
        pathname="test.py",
        lineno=30,
        msg="an error occurred",
        args=(),
        exc_info=exc_info,
    )

    formatted = formatter.format(record)
    data = json.loads(formatted)

    assert data["level"] == "ERROR"
    assert data["msg"] == "an error occurred"
    assert "traceback" in data
    assert any("ZeroDivisionError" in line for line in data["traceback"])


def test_custom_json_formatter_adds_timestamp():
    """Verify that CustomJsonFormatter correctly adds a timestamp if it's missing."""
    formatter = CustomJsonFormatter("%(timestamp)s %(level)s %(message)s")
    record = logging.LogRecord(
        name="test_custom",
        level=logging.INFO,
        pathname="test.py",
        lineno=42,
        msg="test custom message",
        args=(),
        exc_info=None,
    )

    # Ensure no timestamp is present before formatting
    assert not hasattr(record, "timestamp")

    formatted = formatter.format(record)
    data = json.loads(formatted)

    assert "timestamp" in data
    assert data["message"] == "test custom message"

    # Try parsing the timestamp to ensure it's valid
    try:
        datetime.strptime(data["timestamp"], "%Y-%m-%d %H:%M:%S,%f")
        is_valid_ts = True
    except ValueError:
        is_valid_ts = False

    assert is_valid_ts, "The added timestamp is not in the expected format"


def test_custom_json_formatter_preserves_existing_timestamp():
    """Verify that CustomJsonFormatter doesn't overwrite an existing timestamp."""
    formatter = CustomJsonFormatter("%(timestamp)s %(message)s")
    record = logging.LogRecord(
        name="test_custom",
        level=logging.INFO,
        pathname="test.py",
        lineno=42,
        msg="test custom message",
        args=(),
        exc_info=None,
    )

    record.timestamp = "2023-01-01 12:00:00,000"

    formatted = formatter.format(record)
    data = json.loads(formatted)

    assert "timestamp" in data
    assert data["timestamp"] == "2023-01-01 12:00:00,000"
