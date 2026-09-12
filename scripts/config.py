"""
config.py — загружает все настройки из корневого .env

Использование в любом скрипте:
    from config import cfg

    print(cfg.groq_api_key)
    print(cfg.jarlyq_api_url)
"""

import os
import sys
from dataclasses import dataclass, field
from pathlib import Path

# Загружаем .env из корня проекта (на уровень выше scripts/)
_ENV_FILE = Path(__file__).parent.parent / ".env"

try:
    from dotenv import load_dotenv
    load_dotenv(_ENV_FILE)
except ImportError:
    print("WARN: python-dotenv не установлен, pip install python-dotenv")
    print("      Читаем переменные окружения напрямую")


@dataclass
class Config:
    # Jarlyq API
    jarlyq_api_url: str = field(default_factory=lambda: os.getenv("JARLYQ_API_URL", "http://localhost:8080/api/v1"))
    jarlyq_admin_token: str = field(default_factory=lambda: os.getenv("JARLYQ_ADMIN_TOKEN", ""))
    admin_email: str = field(default_factory=lambda: os.getenv("ADMIN_EMAIL", ""))
    admin_password: str = field(default_factory=lambda: os.getenv("ADMIN_PASSWORD", ""))

    # Groq AI
    groq_api_key: str = field(default_factory=lambda: os.getenv("GROQ_API_KEY", ""))

    # GitHub
    github_token: str = field(default_factory=lambda: os.getenv("GITHUB_TOKEN", ""))

    # Telegram (парсер каналов через Telethon)
    tg_api_id: int = field(default_factory=lambda: int(os.getenv("TG_API_ID", "0")))
    tg_api_hash: str = field(default_factory=lambda: os.getenv("TG_API_HASH", ""))
    tg_phone: str = field(default_factory=lambda: os.getenv("TG_PHONE", ""))

    # Пути
    scripts_dir: Path = field(default_factory=lambda: Path(__file__).parent)

    @property
    def data_raw(self) -> Path:
        p = self.scripts_dir / "data" / "raw"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def data_enriched(self) -> Path:
        p = self.scripts_dir / "data" / "enriched"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def data_merged(self) -> Path:
        p = self.scripts_dir / "data" / "merged"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def tg_channels_file(self) -> Path:
        return self.scripts_dir / "tg_channels.json"

    @property
    def tg_session_file(self) -> Path:
        return self.scripts_dir / "data" / "tg_session"

    def require(self, *keys: str):
        """Проверяет что нужные ключи заполнены, иначе завершает с подсказкой."""
        missing = []
        hints = {
            "groq_api_key":        "GROQ_API_KEY — получи на console.groq.com (бесплатно)",
            "github_token":        "GITHUB_TOKEN — создай на github.com/settings/tokens (scope: public_repo)",
            "tg_api_id":           "TG_API_ID — зайди на my.telegram.org → API development tools",
            "tg_api_hash":         "TG_API_HASH — там же",
            "tg_phone":            "TG_PHONE — твой номер телефона в формате +77001234567",
            "jarlyq_admin_token":  "JARLYQ_ADMIN_TOKEN — JWT токен из браузера после логина в /admin",
            "admin_email":         "ADMIN_EMAIL — email администратора Jarlyq",
            "admin_password":      "ADMIN_PASSWORD — пароль администратора Jarlyq",
        }
        for key in keys:
            val = getattr(self, key, None)
            if not val:
                env_key = key.upper()
                missing.append(f"  {env_key}: {hints.get(key, env_key)}")
        if missing:
            print(f"\nНе заполнено в .env:\n" + "\n".join(missing))
            print(f"\nОткрой: {_ENV_FILE}\n")
            sys.exit(1)


cfg = Config()
