# logger_setup.py
"""
Structured JSON logger for the DDIA grader.
Import configure_logging() once in server.py at startup.
"""
import logging
import json
import traceback
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone
import os

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
GRADER_LOG  = os.path.join(LOG_DIR, "grader.log")
ERROR_LOG   = os.path.join(LOG_DIR, "grader_errors.log")
MAX_BYTES   = 5 * 1024 * 1024   # 5 MB
BACKUP_COUNT = 3


class JsonFormatter(logging.Formatter):
    """Emit each log record as a single-line JSON object (NDJSON)."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts":       datetime.now(timezone.utc).isoformat(),
            "level":    record.levelname,
            "logger":   record.name,
            "msg":      record.getMessage(),
        }
        # Merge any extra= dict fields passed at the call site
        for key, val in record.__dict__.items():
            if key not in logging.LogRecord.__init__.__code__.co_varnames and \
               key not in ("msg", "args", "levelname", "name", "pathname",
                           "filename", "module", "exc_info", "exc_text",
                           "stack_info", "lineno", "funcName", "created",
                           "msecs", "relativeCreated", "thread",
                           "threadName", "processName", "process", "message"):
                payload[key] = val
        if record.exc_info:
            payload["traceback"] = traceback.format_exception(*record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging() -> logging.Logger:
    os.makedirs(LOG_DIR, exist_ok=True)

    logger = logging.getLogger("ddia.grader")
    logger.setLevel(logging.DEBUG)

    # Main rotating handler (INFO+)
    main_handler = RotatingFileHandler(
        GRADER_LOG, maxBytes=MAX_BYTES, backupCount=BACKUP_COUNT
    )
    main_handler.setLevel(logging.INFO)
    main_handler.setFormatter(JsonFormatter())

    # Error-only handler
    error_handler = RotatingFileHandler(
        ERROR_LOG, maxBytes=MAX_BYTES, backupCount=BACKUP_COUNT
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JsonFormatter())

    # Console handler (DEBUG during development)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    )

    logger.addHandler(main_handler)
    logger.addHandler(error_handler)
    logger.addHandler(console_handler)
    return logger
