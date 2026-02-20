# Unix Timestamp Tooltip

**Unix Timestamp Tooltip** instantly converts Unix timestamps into human‑readable dates directly on any webpage. Designed for developers working with logs, APIs, dashboards, and raw text where timestamps need to be quickly interpreted.

---

## Features

- Hover to see:
  - Human‑readable date/time (UTC & local)
  - ISO‑8601 timestamp (UTC)
  - Relative time (“5 minutes ago”)
  - Raw Unix seconds and milliseconds
- Automatic detection of seconds vs milliseconds
- Confidence scoring to avoid processing non-timestamps with adjustable threshold
- Tunable raw‑text detection
- Per‑site enable/disable
- DevTools panel with timestamp list and context preview
- Copy any format with one click

---

## How It Works

1. Scans text nodes on the page for 10‑ or 13‑digit numbers
2. Parses them as Unix seconds or milliseconds
3. Uses a confidence scoring system to avoid false positives
4. Generates all display formats from a single parsed `Date`
5. Suports SPAs using a safe MutationObserver pattern

---

## Usage

- **Hover** over a timestamp to see converted formats
- **Click** to pin the tooltip
- Use the **extension popup** to adjust settings

---

## Local Development

```bash
npm install
npm run cleanbuild
```

Then load the `dist/` folder via `chrome://extensions` → **Load unpacked**.

---

## License

MIT

---

## Privacy Policy

Unix Timestamp Tooltip does not collect, store, transmit, or sell any user data.

The extension requires access to webpage content in order to detect timestamps, but all processing occurs locally within the user's browser.

No page content is transmitted externally.

User preferences (such as enable/disable state or formatting options) are stored locally using the Chrome storage API.

No analytics, tracking, or external network requests are performed by the extension.
