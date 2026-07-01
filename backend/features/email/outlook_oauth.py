"""Microsoft OAuth2 for Outlook/Exchange. Uses Microsoft Graph API to fetch mail."""
import base64
import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

AUTHORIZE_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
SCOPES = ["offline_access", "User.Read", "Mail.Read", "Mail.Send", "openid", "email"]


def get_authorize_url(client_id: str, redirect_uri: str, state: str) -> str:
    params = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": " ".join(SCOPES),
        "state": state,
        "response_mode": "query",
        "prompt": "select_account",
    }
    return f"{AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"


def _token_request(data: dict) -> dict[str, Any]:
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(
        TOKEN_URL,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode() if e.fp else ""
        desc = err_body or str(e)
        try:
            err = json.loads(err_body)
            if isinstance(err, dict):
                err_code = (err.get("error") or "").strip()
                desc = err.get("error_description") or err.get("error") or desc
                if err_code == "invalid_client":
                    desc = "Wrong Application (client) ID or Client secret. Check Settings → Email → Outlook credentials."
                elif err_code == "invalid_grant":
                    desc = "Authorization code expired. Click 'Connect with Microsoft' again."
        except Exception:
            pass
        raise ValueError(desc) from e


def exchange_code(code: str, client_id: str, client_secret: str, redirect_uri: str) -> dict[str, Any]:
    return _token_request({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    })


def refresh_access_token(refresh_token: str, client_id: str, client_secret: str) -> dict[str, Any]:
    return _token_request({
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    })


def get_email_from_token_response(token_response: dict[str, Any]) -> str | None:
    id_token = token_response.get("id_token")
    if not id_token:
        return None
    try:
        parts = id_token.split(".")
        if len(parts) < 2:
            return None
        payload_b64 = parts[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return payload.get("email") or payload.get("preferred_username")
    except Exception:
        return None
