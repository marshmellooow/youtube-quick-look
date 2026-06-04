# Chrome Web Store Listing Draft

## Product Name

YouTube Quick Look

## Short Description

Preview YouTube links and thumbnails with a fast keyboard-triggered quick look.

## Detailed Description

YouTube Quick Look helps you inspect YouTube links without losing your place on the page.

Hover over a YouTube link or thumbnail, press your trigger key (Space by default), and the video opens immediately in a compact preview window that plays on its own. Press Escape inside the window to close it and get straight back to what you were doing.

Features:

- Works with YouTube watch links, shorts, live links, embed links, and youtu.be URLs.
- Works on every website: search results, social media, blogs, forums, and chat apps.
- Opens the video in a small, centered popup window that autoplays.
- Plays every video — including ones whose uploader disabled embedding.
- Close instantly with Escape.
- Lets you enable or disable previews from the extension popup.
- Lets you choose a custom trigger key.
- Stores settings locally through Chrome sync storage.
- No account, analytics, or remote backend.

This extension is not affiliated with, endorsed by, or sponsored by YouTube or Google.

## Category

Productivity

## Language

English

## Support URL

Add your public support/contact page before submitting.

## Privacy Policy URL

Host `PRIVACY.md` on a public URL and paste that URL into the Chrome Web Store privacy section.

## Single Purpose Statement

YouTube Quick Look provides a keyboard-triggered preview for YouTube links and thumbnails so users can inspect videos without navigating away from the current page.

## Permission Justifications

### storage

Used to save the user's enabled/disabled state and selected trigger key in Chrome sync storage.

### Host access for HTTP and HTTPS pages

Required so the content script can locally detect hovered YouTube links and thumbnails on web pages and open the preview only after the user presses the configured trigger key. YouTube links appear on virtually every website, so the content script must run on all http(s) pages to detect them on hover. The narrower `activeTab` permission is unsuitable because it requires an explicit toolbar click per tab, which would break the hover-and-press-key interaction. The extension does not transmit page content or browsing data to a server.

## Data Use Disclosure

Recommended selection: The extension does not collect user data.

The extension processes hovered page elements locally to identify supported YouTube URLs. It stores only user preferences in Chrome sync storage and does not send those preferences, page content, browsing history, or video IDs to the developer.

## Review Instructions

1. Load the extension.
2. Visit any HTTPS page containing a YouTube watch, short, live, embed, or youtu.be link (for example a Google search results page).
3. Hover the link or thumbnail.
4. Press Space to open the preview window.
5. Press Escape inside the preview window to close it.
6. Open the extension popup to verify the enable toggle and trigger-key picker.
