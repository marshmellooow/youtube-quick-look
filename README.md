# YouTube Quick Look

YouTube Quick Look is a Chrome extension that opens a fast preview for YouTube links and thumbnails. Hover a supported YouTube link or thumbnail, press the configured trigger key, and the video opens in a compact preview window. Close it with Escape.

## Features

- Preview YouTube watch, short, live, embed, and youtu.be links.
- Works on every website — search results, social media, blogs, chat apps.
- Opens the video in a small, centered popup window that plays automatically.
- Press Escape inside the preview window to close it instantly.
- Plays every video, including ones whose uploader disabled embedding.
- Configurable trigger key (default: Space).
- Simple enable/disable toggle.
- No analytics, accounts, remote backend, or user data sale.

## How it works

Because YouTube blocks its embeddable player in several contexts (error 152/153 on
`youtube.com` and for embed-disabled videos), the preview does not use an in-page
iframe. Instead it opens the full `youtube.com/watch` page in a small popup window.
This plays reliably everywhere, autoplays, and supports Escape-to-close via a tiny
URL-hash marker (`#ytql-popup`) that the content script detects inside the popup.

## Local Installation

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select this project folder.

## Release Package

```bash
zip -r dist/youtube-quick-look-1.0.1.zip manifest.json content.js popup.html popup.js icons -x "*.DS_Store"
```

The ZIP file is the package to upload in the Chrome Developer Dashboard.

## Store Assets

Store listing assets are in `store-assets/`:

- `promo-small-440x280.png`
- `promo-marquee-1400x560.png`
- `screenshot-main-1280x800.png`
- `screenshot-popup-1280x800.png`
- `screenshot-annotated-1280x800.png`

Branding sources are in `branding/`.

## Privacy

The extension stores only its enabled state and trigger-key setting in `chrome.storage.sync`. It detects YouTube links in the current page locally in the browser. It does not transmit page content, browsing history, video IDs, or settings to a server.

Before publishing, host `PRIVACY.md` at a public URL and add that URL in the Chrome Web Store privacy section.
