import logging
import sys
from pathlib import Path
from datetime import datetime
from config import settings


class CustomFormatter(logging.Formatter):
    grey = "\x1b[38;20m"
    blue = "\x1b[34;20m"
    yellow = "\x1b[33;20m"
    red = "\x1b[31;20m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"

    FORMATS = {
        logging.DEBUG: grey,
        logging.INFO: blue,
        logging.WARNING: yellow,
        logging.ERROR: red,
        logging.CRITICAL: bold_red,
    }

    def format(self, record):
        color = self.FORMATS.get(record.levelno, self.grey)
        formatter = logging.Formatter(
            f"{color}%(asctime)s | %(levelname)-8s | %(message)s{self.reset}",
            datefmt="%H:%M:%S",
        )
        return formatter.format(record)


def setup_logger(name: str = "story-video-creator") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(CustomFormatter())
    logger.addHandler(console_handler)

    log_file = Path(settings.logs_folder) / f"app_{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    return logger


logger = setup_logger()
