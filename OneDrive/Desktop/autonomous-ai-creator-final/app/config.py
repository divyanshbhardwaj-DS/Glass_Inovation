"""Environment-based configuration. Loads .env without adding a dependency."""
from __future__ import annotations
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"


def _load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv(ENV_FILE)


class Settings:
    """Runtime configuration, all overridable via environment variables / .env."""

    cycle_interval_seconds: int = int(os.environ.get("CYCLE_INTERVAL_SECONDS", "10"))
    max_candidates_per_cycle: int = int(os.environ.get("MAX_CANDIDATES_PER_CYCLE", "12"))
    duplicate_similarity_threshold: float = float(
        os.environ.get("DUPLICATE_SIMILARITY_THRESHOLD", "0.80")
    )
    # Optional: if set, generation could call an external LLM. Left unused by
    # default so the demo always works without any key (deterministic
    # local fallback generation in app/agent/writer.py).
    anthropic_api_key: str | None = os.environ.get("ANTHROPIC_API_KEY") or None
    cors_origins: list[str] = [
        o.strip()
        for o in os.environ.get(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if o.strip()
    ]


settings = Settings()
