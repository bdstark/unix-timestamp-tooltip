import { TooltipRow } from "./timestamp.js"; // .js required here due to Chrome implementing ESM spec strictly
import { highlightSource, clearHighlight } from "./highlight.js"; // .js required here due to Chrome implementing ESM spec strictly

let dragOffsetX = 0;
let dragOffsetY = 0;
let dragging = false;

let tooltip: HTMLDivElement | null = null;
let pinned = false;
let selectedIndex = 0;
let rowsCache: TooltipRow[] = [];
let relativeTimer: number | null = null;

export function showTooltip(
    rows: TooltipRow[],
    x: number,
    y: number,
    pin = false
): void {
    rowsCache = rows;
    pinned = pin;

    if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.addEventListener("mousedown", (e) => {
            if (!pinned) return;

            dragging = true;
            const rect = tooltip!.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            e.preventDefault();
        });
        tooltip.className = "unix-tooltip";
        tooltip.tabIndex = 0;
        document.body.appendChild(tooltip);
    }


    render();
    const active = document.querySelector(".unix-ts:hover") as HTMLElement;
    if (active) {
        highlightSource(active);
    }
    positionTooltip(x, y);

    tooltip.style.opacity = "1";

    if (pinned) {
        tooltip.focus();
    }

    startRelativeUpdates();
}

function render(): void {
    if (!tooltip) return;

    tooltip.innerHTML = "";

    const contextRow = rowsCache.find(r => r.label === "Context");
    if (contextRow) {
        const ctx = document.createElement("div");
        ctx.className = "unix-context";
        ctx.textContent = contextRow.value;
        tooltip.appendChild(ctx);
    }

    rowsCache.forEach((row, index) => {
        const el = document.createElement("div");
        el.className = "unix-row";
        if (index === selectedIndex) {
            el.classList.add("unix-selected");
        }

        el.innerHTML = `
      <span class="unix-label">${row.label}</span>
      <span>${row.value}</span>
    `;

        el.addEventListener("click", async () => {
            await navigator.clipboard.writeText(row.copy);
            showCopied();
        });

        tooltip!.appendChild(el);
    });

    if (pinned) {
        const hint = document.createElement("div");
        hint.className = "unix-hint";
        hint.textContent = "↑ ↓ navigate • Enter copy • Esc close";
        tooltip.appendChild(hint);
    }
}

function showCopied(): void {
    if (!tooltip) return;

    let el = tooltip.querySelector(".unix-copied");
    if (!el) {
        el = document.createElement("div");
        el.className = "unix-copied";
        el.textContent = "Copied";
        tooltip.appendChild(el);
    }

    setTimeout(() => el?.remove(), 900);
}

export function hideTooltip(force = false): void {
    if (pinned && !force) return;

    clearHighlight();
    stopRelativeUpdates();
    tooltip?.remove();
    tooltip = null;
    pinned = false;
    selectedIndex = 0;
}

/* ---------------- Keyboard ---------------- */

document.addEventListener("keydown", async (e) => {
    if (!tooltip || !pinned) return;

    if (e.key === "Escape") {
        hideTooltip(true);
    }

    if (e.key === "ArrowDown") {
        selectedIndex = (selectedIndex + 1) % rowsCache.length;
        render();
        e.preventDefault();
    }

    if (e.key === "ArrowUp") {
        selectedIndex =
            (selectedIndex - 1 + rowsCache.length) % rowsCache.length;
        render();
        e.preventDefault();
    }

    if (e.key === "Enter") {
        await navigator.clipboard.writeText(
            rowsCache[selectedIndex].copy
        );
        showCopied();
    }
});

/* ---------------- Outside Click ---------------- */

document.addEventListener("mousedown", (e) => {
    if (tooltip && !tooltip.contains(e.target as Node)) {
        hideTooltip(true);
    }
});

function startRelativeUpdates(): void {
    stopRelativeUpdates();

    const hasRelative = rowsCache.some(
        (r) => r.label === "Relative"
    );

    if (!hasRelative) return;

    relativeTimer = window.setInterval(() => {
        render();
    }, 60_000);
}

function stopRelativeUpdates(): void {
    if (relativeTimer) {
        clearInterval(relativeTimer);
        relativeTimer = null;
    }
}

function positionTooltip(x: number, y: number): void {
    if (!tooltip) return;

    const padding = 12;
    const rect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x + padding;
    let top = y + padding;

    if (left + rect.width > vw) {
        left = x - rect.width - padding;
    }

    if (top + rect.height > vh) {
        top = y - rect.height - padding;
    }

    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
}

document.addEventListener("mousemove", (e) => {
    if (!dragging || !tooltip) return;

    const padding = 8;
    let left = e.clientX - dragOffsetX;
    let top = e.clientY - dragOffsetY;

    const maxLeft = window.innerWidth - tooltip.offsetWidth - padding;
    const maxTop = window.innerHeight - tooltip.offsetHeight - padding;

    tooltip.style.left = `${Math.max(padding, Math.min(left, maxLeft))}px`;
    tooltip.style.top = `${Math.max(padding, Math.min(top, maxTop))}px`;
});

document.addEventListener("mouseup", () => {
    if (!dragging || !tooltip) return;
    dragging = false;

    const rect = tooltip.getBoundingClientRect();
    const snap = 20;

    if (rect.left < snap) tooltip.style.left = "8px";
    if (rect.top < snap) tooltip.style.top = "8px";
    if (window.innerWidth - rect.right < snap) {
        tooltip.style.left =
            `${window.innerWidth - rect.width - 8}px`;
    }
    if (window.innerHeight - rect.bottom < snap) {
        tooltip.style.top =
            `${window.innerHeight - rect.height - 8}px`;
    }
});