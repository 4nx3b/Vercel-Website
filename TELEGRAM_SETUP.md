# Telegram notifications and reply-to-answer setup

Your website now uses these API files:

- `api/telegram.js` sends new website questions to your Telegram bot.
- `api/telegram-webhook.js` receives your Telegram replies and saves them as answers in Firestore.

## Required Vercel environment variables

Keep all of these as Sensitive.

```env
TELEGRAM_BOT_TOKEN=your BotFather token
TELEGRAM_CHAT_ID=7652360832
FIREBASE_SERVICE_ACCOUNT_KEY={...service account JSON...}
FIREBASE_PROJECT_ID=therealreze-2a3bf
TELEGRAM_WEBHOOK_SECRET=make-a-random-secret-text
```

`FIREBASE_PROJECT_ID` is optional if your service account JSON already contains the correct `project_id`, but adding it is fine.

## Get `FIREBASE_SERVICE_ACCOUNT_KEY`

1. Open Firebase Console.
2. Select your project: `therealreze-2a3bf`.
3. Go to Project settings.
4. Open the Service accounts tab.
5. Click Generate new private key.
6. Download the JSON file.
7. Copy the full JSON content and paste it as the Vercel value for:

```env
FIREBASE_SERVICE_ACCOUNT_KEY
```

It should look like one long JSON value starting with:

```json
{"type":"service_account","project_id":"therealreze-2a3bf", ...}
```

If Vercel allows multi-line values, pasting the full JSON is okay. If not, paste it as one line.

## Set the Telegram webhook

After deploying the updated files to Vercel, open this URL in your browser after replacing the values:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://therealreze.vercel.app/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Example shape only:

```text
https://api.telegram.org/bot123456:ABC/setWebhook?url=https://therealreze.vercel.app/api/telegram-webhook&secret_token=my-secret
```

Telegram should return:

```json
{"ok":true,"result":true,...}
```

## How to answer questions from Telegram

1. A website question arrives in Telegram like:

```text
From: Reze
Question: Test
ID: 3cca5877-29c0-4cd6-b952-f79431ed284b
Time: 2026-06-30T15:52:45.364Z
```

2. Reply to that bot message in Telegram.
3. Type your answer.
4. The webhook updates the matching Firestore question as answered.
5. Refresh the website question box to see the answer.

## Important

Do not put your bot token or service account JSON inside frontend files like `script.js`, `index.html`, or `style.css`.
