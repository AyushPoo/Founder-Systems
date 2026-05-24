from functools import lru_cache
from typing import Optional

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="FS_",
        extra="ignore",
    )

    app_name: str = "Founder Systems API"
    env: str = "development"
    database_url: str = "sqlite:///./founder_systems_api.db"

    session_cookie_name: str = "fs_session"
    session_secret: str = "change-me-in-production"
    session_cookie_domain: Optional[str] = None
    session_cookie_secure: bool = False
    session_max_age_seconds: int = 60 * 60 * 24 * 30
    session_short_max_age_seconds: int = 60 * 60 * 24 * 7

    magic_link_ttl_minutes: int = 20
    account_app_url: str = "http://localhost:5174"
    site_app_url: str = "http://localhost:5173"
    promptdeck_app_url: str = "http://localhost:5173"
    public_api_url: str = "http://localhost:8000"

    resend_api_key: Optional[str] = None
    resend_from_email: Optional[str] = None

    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    integration_token_secret: Optional[str] = None

    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    hubspot_client_id: Optional[str] = None
    hubspot_client_secret: Optional[str] = None
    mailchimp_client_id: Optional[str] = None
    mailchimp_client_secret: Optional[str] = None
    meta_client_id: Optional[str] = None
    meta_client_secret: Optional[str] = None
    meta_graph_version: str = "v23.0"
    linkedin_client_id: Optional[str] = None
    linkedin_client_secret: Optional[str] = None

    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    razorpay_webhook_secret: Optional[str] = None
    allow_mock_payments: bool = True

    api_key_internal: Optional[str] = None
    admin_emails: str = ""
    cors_origin_regex: str = r"https?://([a-z0-9-]+\.)?foundersystems\.in(:\d+)?$|https?://localhost(:\d+)?$|https?://127\.0\.0\.1(:\d+)?$"

    promptdeck_price_inr_minor: int = Field(default=50000)
    promptdeck_price_usd_minor: int = Field(default=700)
    promptdeck_credit_grant: int = Field(default=3)

    ai_guard_user_daily_limit: int = Field(default=20)
    ai_guard_heavy_daily_limit: int = Field(default=3)
    ai_guard_global_daily_limit: int = Field(default=1000)
    ai_guard_default_credit_cost: int = Field(default=1)
    wallet_usage_units_per_credit: int = Field(default=100)
    ai_guard_deepseek_enabled: bool = Field(default=False)
    gmail_send_credit_cost: int = Field(default=1)

    @property
    def session_issuer(self) -> str:
        return "foundersystems"

    @property
    def admin_email_set(self) -> set[str]:
        return {
            email.strip().lower()
            for email in self.admin_emails.split(",")
            if email.strip()
        }

    def validate_production_settings(self) -> None:
        if self.env != "production":
            return
        if not self.session_secret or self.session_secret == "change-me-in-production":
            raise RuntimeError("FS_SESSION_SECRET must be set to a long random secret in production")
        if not self.session_cookie_secure:
            raise RuntimeError("FS_SESSION_COOKIE_SECURE must be true in production")
        if self.allow_mock_payments:
            raise RuntimeError("FS_ALLOW_MOCK_PAYMENTS must be false in production")
        if not self.api_key_internal:
            raise RuntimeError("FS_API_KEY_INTERNAL must be configured in production")
        if not self.integration_token_secret:
            raise RuntimeError("FS_INTEGRATION_TOKEN_SECRET must be configured in production")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
