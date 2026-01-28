import { showTooltip, hideTooltip } from "./shared/tooltip.js";
import { highlightSource } from "./shared/highlight.js";
import { tooltipFor } from "./shared/timestamp.js";
import { detectContext } from "./shared/context.js";
import { computeConfidence } from "./shared/confidence.js";
import type { Settings } from "./shared/settings.js";

const TIMESTAMP_REGEX = /\b\d{9,13}\b/g;
const PROCESSED_ATTR = "data-unix-ts-processed";

/* ---------------- Settings ---------------- */

let settings: Settings = {
    showHumanReadable: true,
    showISO8601: true,
    showRelative: true,
    minConfidence: 60,
    rawLengthBonus: 3,
    disabledHosts: [],
};

chrome.storage.sync.get(settings, (s: Partial<Settings>) => {
    settings = { ...settings, ...s };
    initialScan(document.body);
    startObserver();
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SETTINGS_UPDATED") {
        settings = msg.settings;
        removeExistingTooltips();
        initialScan(document.body);
    }
});

const currentHost = location.hostname;

function isDisabledHere(): boolean {
    return settings.disabledHosts.includes(currentHost);
}

/* ---------------- DevTools Data ---------------- */

type TimestampEntry = {
    id: number;
    value: number;
    context: string;
    jsonPath?: string;
};

const collected: TimestampEntry[] = [];
let nextId = 1;

/* ---------------- Core Processing ---------------- */

function processTextNode(node: Text): void {
    const text = node.nodeValue;
    if (!text) return;

    const parent = node.parentElement;
    if (!parent) return;

    if (
        parent.hasAttribute(PROCESSED_ATTR) ||
        ["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"].includes(parent.tagName)
    ) {
        return;
    }

    const matches = [...text.matchAll(TIMESTAMP_REGEX)];
    if (matches.length === 0) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of matches) {
        const raw = match[0];
        const index = match.index ?? 0;
        const value = Number(raw);

        const context = detectContext(text, index);
        const confidence = computeConfidence(value, context, settings);

        fragment.append(text.slice(lastIndex, index));

        if (confidence.percent >= settings.minConfidence) {
            const tooltip = tooltipFor(value, settings, context);
            if (tooltip) {
                const id = nextId++;

                const span = document.createElement("span");
                span.className = "unix-ts";
                span.textContent = raw;
                span.dataset.tsId = String(id);
                span.dataset.tooltip = JSON.stringify(tooltip);

                fragment.append(span);

                collected.push({
                    id,
                    value,
                    context: context.type,
                    jsonPath: context.jsonPath,
                });
            } else {
                fragment.append(raw);
            }
        } else {
            fragment.append(raw);
        }

        lastIndex = index + raw.length;
    }

    fragment.append(text.slice(lastIndex));

    parent.setAttribute(PROCESSED_ATTR, "true");
    node.replaceWith(fragment);
}

/* ---------------- Initial Scan ---------------- */

function initialScan(root: Node): void {
    if (isDisabledHere()) return;

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT
    );

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
        processTextNode(node);
    }
}

/* ---------------- Mutation Observer ---------------- */

let observer: MutationObserver | null = null;

function startObserver(): void {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
        observer!.disconnect();

        for (const mutation of mutations) {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    processTextNode(node as Text);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    initialScan(node);
                }
            });
        }

        observer!.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

/* ---------------- Tooltip Events ---------------- */

document.addEventListener("mousemove", (e) => {
    const target = e.target as HTMLElement;
    if (!target?.classList?.contains("unix-ts")) return;

    const rows = target.dataset.tooltip
        ? JSON.parse(target.dataset.tooltip)
        : null;

    if (rows) {
        showTooltip(rows, e.clientX, e.clientY);
        highlightSource(target);
    }
});

document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target?.classList?.contains("unix-ts")) return;

    const rows = target.dataset.tooltip
        ? JSON.parse(target.dataset.tooltip)
        : null;

    if (rows) {
        showTooltip(rows, e.clientX, e.clientY, true);
        highlightSource(target);
        e.stopPropagation();
    }
});

document.addEventListener("mouseout", () => {
    hideTooltip();
});

/* ---------------- Cleanup ---------------- */

function removeExistingTooltips(): void {
    document
        .querySelectorAll(`[${PROCESSED_ATTR}]`)
        .forEach((el) => {
            el.removeAttribute(PROCESSED_ATTR);
        });

    document
        .querySelectorAll(".unix-ts")
        .forEach((el) => {
            el.replaceWith(el.textContent ?? "");
        });

    collected.length = 0;
    nextId = 1;
}

/* ---------------- DevTools Bridge ---------------- */

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.type === "REQUEST_TIMESTAMP_DATA") {
        sendResponse(collected);
        return;
    }

    if (msg.type === "REQUEST_SETTINGS") {
        sendResponse(settings);
        return;
    }

    if (msg.type === "UPDATE_SETTINGS") {
        settings = { ...settings, ...msg.settings };

        chrome.storage.sync.set(settings);

        removeExistingTooltips();
        if (!isDisabledHere()) {
            initialScan(document.body);
        }

        sendResponse({ ok: true });
        return;
    }

    if (msg.type === "SCROLL_TO_TIMESTAMP") {
        const el = document.querySelector(
            `[data-ts-id="${msg.id}"]`
        ) as HTMLElement | null;

        if (!el) return;

        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("unix-selected-source");

        setTimeout(() => {
            el.classList.remove("unix-selected-source");
        }, 1500);

        return;
    }

    if (msg.type === "GET_TIMESTAMP_CONTEXT") {
        const el = document.querySelector(
            `[data-ts-id="${msg.id}"]`
        ) as HTMLElement | null;

        if (!el) return;

        sendResponse({
            snippet: el.textContent ?? "",
        });
        return;
    }
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TOGGLE_ENABLED") {
        if (isDisabledHere()) {
            settings.disabledHosts =
                settings.disabledHosts.filter(h => h !== currentHost);
        } else {
            settings.disabledHosts.push(currentHost);
        }

        removeExistingTooltips();
        if (!isDisabledHere()) {
            initialScan(document.body);
        }
    }
});