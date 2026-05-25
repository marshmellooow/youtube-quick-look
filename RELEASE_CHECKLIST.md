# Chrome Web Store Release Checklist

## Prepared Locally

- `manifest.json` uses Manifest V3.
- Version set to `1.0.0`.
- Unused `activeTab` permission removed.
- Extension icons generated in PNG format at 16, 32, 48, and 128 px.
- Store graphics generated:
  - `store-assets/promo-small-440x280.png`
  - `store-assets/promo-marquee-1400x560.png`
  - `store-assets/screenshot-main-1280x800.png`
  - `store-assets/screenshot-popup-1280x800.png`
- Privacy policy draft created in `PRIVACY.md`.
- Store listing copy created in `STORE_LISTING.md`.

## Before Submission

- Host `PRIVACY.md` publicly and add its URL in the Chrome Web Store dashboard.
- Add a public support/contact URL.
- Decide whether the listing should be published immediately after review or staged for manual publishing.
- Test the unpacked extension in Chrome on:
  - A regular website with YouTube links.
  - `youtube.com`.
  - The popup toggle and trigger-key selector.

## Dashboard Fields

- Package: upload `dist/youtube-quick-look-1.0.0.zip`.
- Store Listing: use `STORE_LISTING.md`.
- Privacy: use the single purpose, permission justifications, and data disclosure from `STORE_LISTING.md`.
- Distribution: choose visibility and regions.
- Test Instructions: paste the review instructions from `STORE_LISTING.md`.

## Notes

The extension name and description should not imply an official relationship with YouTube or Google. Keep the non-affiliation sentence in the detailed description.
