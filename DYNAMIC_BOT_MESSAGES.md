# Dynamic Bot Messages Feature
**Status:** ✅ LIVE

## Overview

Each SaaS client can now customize the welcome message their WhatsApp bot sends to customers, instead of being hardcoded to "Welcome to Medha!"

## What Changed

### Backend
1. **Bot Config Model** (`backend/features/bot_config/router.py`)
   - Added `welcome_message` field
   - Added `menu_header` field
   - Stored in Redis (user-specific)

2. **Bot Engine** (`backend/features/whatsapp/bot_engine.py`)
   - Added `_get_bot_config()` helper function
   - Updated `_send_main_menu()` to fetch and use dynamic messages
   - Falls back to defaults if not configured

### Frontend
3. **Settings UI** (`frontend/src/features/settings/SettingsView.tsx`)
   - New "Bot messages" tab in Settings
   - Edit welcome message (fallback when no catalog)
   - Edit menu header (shown at top of menu)
   - Real-time save via API

## User Flow

1. User opens Settings → "Bot messages" tab
2. User edits:
   - **Fallback welcome message** — Sent when customer messages and no catalog exists
   - **Menu header text** — Shown at top of menu (supports *bold*, emojis)
3. Changes auto-save to database
4. Next customer gets the new messages

## Example Customizations

**Default:**
```
Fallback: "Welcome to Medha! Our team will be in touch with you shortly."
Menu:     "*Welcome to Medha!* 👋"
```

**Custom (Real Estate):**
```
Fallback: "Thanks for reaching out! Our agents will contact you shortly."
Menu:     "*Find Your Dream Home* 🏡"
```

**Custom (E-commerce):**
```
Fallback: "Thanks for shopping! Browse our products below."
Menu:     "*Shop Our Collection* 🛍️"
```

**Custom (Services):**
```
Fallback: "Welcome! We're here to help. Select a service below."
Menu:     "*Our Services* ⚡"
```

## API Endpoints

### Get bot config
```bash
GET /api/bot/config
Authorization: Bearer <token>

Response:
{
  "trigger_keyword": "menu",
  "welcome_message": "Custom message here",
  "menu_header": "*Custom Header* 👋"
}
```

### Update bot config
```bash
PUT /api/bot/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "trigger_keyword": "menu",
  "welcome_message": "New message",
  "menu_header": "*New Header* 📱"
}

Response:
{
  "trigger_keyword": "menu",
  "welcome_message": "New message",
  "menu_header": "*New Header* 📱"
}
```

## Storage

- **Storage:** Redis (in-memory, fast)
- **Key format:** `bot:config`
- **Format:** JSON
- **Per-user:** Each user/org has their own config

## WhatsApp Formatting

The bot messages support WhatsApp formatting:
- `*text*` → **bold**
- `_text_` → *italic*
- `~text~` → ~~strikethrough~~
- Emojis: 👋 🏡 🛍️ ⚡ ✅ ❌ etc.

## Files Modified

1. `backend/features/bot_config/router.py` — Added fields
2. `backend/features/whatsapp/bot_engine.py` — Use dynamic messages
3. `frontend/src/features/settings/SettingsView.tsx` — New UI tab

## Testing

1. Log in to dashboard
2. Go to Settings → "Bot messages"
3. Edit the welcome message
4. Send a message to your WhatsApp number that's not in the catalog
5. See the custom message in the chat

**Or** trigger the menu:
1. Edit menu header
2. Type "menu" in WhatsApp
3. See the new header in the menu

## Next Steps (Optional)

- Add more customizable messages:
  - Error messages
  - Out-of-hours message
  - Main menu footer text
- Add message templates (variables like {{name}}, {{date}})
- Add per-catalog custom messages
- Track which messages customers see (analytics)

---

**Status:** Feature is production-ready. Deployed and live. ✅
