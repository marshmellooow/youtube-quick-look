# YouTube Quick Look

YouTube Quick Look is a Chrome extension that opens a fast preview for YouTube links and thumbnails. Hover a supported YouTube link or thumbnail, press the configured trigger key, and close the preview with the same key or Escape.

## Features

- Preview YouTube watch, short, live, embed, and youtu.be links.
- Works on regular web pages through an in-page quick-look overlay.
- Uses an extension player popup on YouTube pages where in-page embeds can be blocked.
- Configurable trigger key.
- Simple enable/disable toggle.
- No analytics, accounts, remote backend, or user data sale.

## Local Installation

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select this project folder.

## Release Package

Run:

```bash
python3 scripts/generate_store_assets.py
zip -r dist/youtube-quick-look-1.0.0.zip manifest.json content.js popup.html popup.js preview.css player.html player.js icons
```

The ZIP file is the package to upload in the Chrome Developer Dashboard.

## Store Assets

Store listing assets are in `store-assets/`:

- `promo-small-440x280.png`
- `promo-marquee-1400x560.png`
- `screenshot-main-1280x800.png`
- `screenshot-popup-1280x800.png`

Branding sources are in `branding/`.

## Privacy

The extension stores only its enabled state and trigger-key setting in `chrome.storage.sync`. It detects YouTube links in the current page locally in the browser. It does not transmit page content, browsing history, video IDs, or settings to a server.

Before publishing, host `PRIVACY.md` at a public URL and add that URL in the Chrome Web Store privacy section.
