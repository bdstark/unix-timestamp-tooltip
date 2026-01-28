import type { Settings } from "./shared/settings.js";

const DEFAULT_SETTINGS: Settings = {
    showHumanReadable: true,
    showISO8601: true,
    showRelative: true,
    minConfidence: 60,
    rawLengthBonus: 3,
    disabledHosts: [],
};

let currentSettings: Settings = { ...DEFAULT_SETTINGS };

/* ---------------- Load ---------------- */

function restore(): void {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (stored: Settings) => {
        currentSettings = { ...DEFAULT_SETTINGS, ...stored };
        syncUI();
    });
}

/* ---------------- UI Sync ---------------- */

function syncUI(): void {
    (document.getElementById("showHumanReadable") as HTMLInputElement).checked =
        currentSettings.showHumanReadable;

    (document.getElementById("showISO8601") as HTMLInputElement).checked =
        currentSettings.showISO8601;

    (document.getElementById("showRelative") as HTMLInputElement).checked =
        currentSettings.showRelative;

    (document.getElementById("minConfidence") as HTMLInputElement).value =
        String(currentSettings.minConfidence);

    (document.getElementById("rawLengthBoost") as HTMLInputElement).value =
        String(currentSettings.rawLengthBonus);

    document.getElementById("rawLengthBoostValue")!.textContent =
        String(currentSettings.rawLengthBonus);

    const host = location.hostname;
    const enabledHere = !currentSettings.disabledHosts.includes(host);

    (document.getElementById("enableSite") as HTMLInputElement).checked =
        enabledHere;
}

/* ---------------- Save ---------------- */

function saveAndNotify(): void {
    chrome.storage.sync.set(currentSettings);

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
                type: "SETTINGS_UPDATED",
                settings: currentSettings,
            });
        }
    });
}

/* ---------------- Wiring ---------------- */

function wire(): void {
    document
        .querySelectorAll("input, select")
        .forEach((el) => {
            if (el.id === "rawLengthBoost") return;
            el.addEventListener("change", () => {
                const host = location.hostname;

                currentSettings.showHumanReadable =
                    (document.getElementById("showHumanReadable") as HTMLInputElement).checked;

                currentSettings.showISO8601 =
                    (document.getElementById("showISO8601") as HTMLInputElement).checked;

                currentSettings.showRelative =
                    (document.getElementById("showRelative") as HTMLInputElement).checked;

                currentSettings.minConfidence = Number(
                    (document.getElementById("minConfidence") as HTMLInputElement).value
                );

                const enabledHere =
                    (document.getElementById("enableSite") as HTMLInputElement).checked;

                currentSettings.disabledHosts = enabledHere
                    ? currentSettings.disabledHosts.filter((h) => h !== host)
                    : Array.from(new Set([...currentSettings.disabledHosts, host]));

                saveAndNotify();
            });
        });

    const rawBoostInput = document.getElementById("rawLengthBoost") as HTMLInputElement;

    rawBoostInput.addEventListener("input", () => {
        const value = Number(rawBoostInput.value);
        document.getElementById("rawLengthBoostValue")!.textContent = String(value);
        currentSettings.rawLengthBonus = value;
        saveAndNotify();
    });
}

/* ---------------- Init ---------------- */

restore();
wire();