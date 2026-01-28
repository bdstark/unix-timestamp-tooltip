# Unix Timestamp Tooltip

**Unix Timestamp Tooltip** is a Chrome extension that detects Unix timestamps on web pages and shows UTC/local time, ISO‑8601, and relative time formats on hover. It’s designed for developers and users working with logs, APIs, dashboards, and raw text that contains timestamps that need to be read by a human.

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
2. Automatically parses them as Unix seconds or milliseconds
3. Assigns a confidence score based on structure and context
4. Displays tooltip formats derived from a single parsed `Date`
5. Updates dynamically for SPAs using a safe MutationObserver pattern

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