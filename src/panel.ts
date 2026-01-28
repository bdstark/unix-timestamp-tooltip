import type { Settings } from "./shared/settings.js";

const exportBtn = document.getElementById("export")!;

let currentSettings: Settings | null = null;

type TimestampEntry = {
    id: number;
    value: number;
    context: string;
    jsonPath?: string;
};

const list = document.getElementById("list")!;

const contextEl = document.getElementById("context")!;

const copyContextBtn = document.getElementById("copy-context")!;

copyContextBtn.addEventListener("click", async () => {
    if (!contextEl.textContent) return;
    await navigator.clipboard.writeText(contextEl.textContent);
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TIMESTAMP_DATA") {
        render(msg.data);
    }
});

function render(data: TimestampEntry[]): void {
    list.innerHTML = "";
    list.dataset.items = JSON.stringify(data, null, 2);

    data.forEach((item) => {
        const div = document.createElement("div");
        div.style.cursor = "pointer";

        div.addEventListener("click", () => {
            chrome.tabs.query(
                { active: true, currentWindow: true },
                (tabs) => {
                    if (!tabs[0]?.id) return;

                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: "SCROLL_TO_TIMESTAMP",
                        id: item.id,
                    });
                }
            );
        });
        div.className = "item";

        div.innerHTML = `
      <div><span class="label">Value:</span>
        <span class="value">${item.value}</span></div>
      <div><span class="label">Context:</span>
        ${item.context}</div>
      ${item.jsonPath ? `<div><span class="label">Path:</span>
        <span class="value">${item.jsonPath}</span></div>` : ""}
    `;

        list.appendChild(div);
    });
}

chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {
        if (!tabs[0]?.id) return;

        chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "REQUEST_TIMESTAMP_DATA" },
            (response) => {
                if (response) {
                    render(response);
                }
            }
        );

        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs) => {
                if (!tabs[0]?.id) return;

                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { type: "REQUEST_SETTINGS" },
                    (response) => {
                        if (response) {
                            currentSettings = response;
                            renderSettingsSummary();
                        }
                    }
                );
            }
        );
    }
);

exportBtn.addEventListener("click", () => {
    const data = list.dataset.items;
    if (!data) return;

    const blob = new Blob([data], {
        type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timestamps.json";
    a.click();

    URL.revokeObjectURL(url);
});

const settingsSummary =
    document.getElementById("settings-summary")!;

function renderSettingsSummary(): void {
    if (!currentSettings) return;

    settingsSummary.innerHTML = `
    <div>Raw length boost: ${currentSettings.rawLengthBonus}</div>
    <div>Min confidence: ${currentSettings.minConfidence}%</div>
    <div>Disabled here: ${currentSettings.disabledHosts.includes(location.hostname)
            ? "Yes"
            : "No"
        }</div>
  `;
}

document
    .getElementById("toggle-site")!
    .addEventListener("click", () => {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            ([tab]) => {
                if (!tab?.id) return;
                chrome.tabs.sendMessage(tab.id, {
                    type: "TOGGLE_ENABLED",
                });
            }
        );
    });

document
    .getElementById("refresh")!
    .addEventListener("click", () => {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            ([tab]) => {
                if (!tab?.id) return;
                chrome.tabs.sendMessage(
                    tab.id,
                    { type: "REQUEST_TIMESTAMP_DATA" },
                    (response) => response && render(response)
                );
            }
        );
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (!tab?.id) return;

            chrome.tabs.sendMessage(
                tab.id,
                { type: "REQUEST_SETTINGS" },
                (response) => {
                    if (response) {
                        currentSettings = response;
                        renderSettings();
                    }
                }
            );
        });
    });

function renderSettings(): void {
    if (!currentSettings) return;

    const host = location.hostname;

    const minInput = document.getElementById(
        "dt-minConfidence"
    ) as HTMLInputElement;

    const minValue = document.getElementById(
        "dt-minConfidence-value"
    ) as HTMLElement;

    minInput.value = String(currentSettings.minConfidence);
    minValue.textContent = `${currentSettings.minConfidence}%`;


    const rawInput = document.getElementById(
        "dt-rawLengthBoost"
    ) as HTMLInputElement;

    rawInput.value = String(currentSettings.rawLengthBonus);

    document.getElementById("dt-rawLengthBoost-value")!.textContent =
        String(currentSettings.rawLengthBonus);

    (document.getElementById("dt-enableSite") as HTMLInputElement).checked =
        !currentSettings.disabledHosts.includes(host);
}

function wireSettings(): void {
    const minInput = document.getElementById("dt-minConfidence") as HTMLInputElement;

    minInput.addEventListener("input", () => {
        const value = Number(minInput.value);
        document.getElementById("dt-minConfidence-value")!.textContent =
            `${value}%`;

        updateSettings({ minConfidence: value });
    });

    const rawInput = document.getElementById("dt-rawLengthBoost") as HTMLInputElement;
    rawInput.addEventListener("input", () => {
        const value = Number(rawInput.value);
        document.getElementById("dt-rawLengthBoost-value")!.textContent =
            String(value);

        updateSettings({ rawLengthBonus: value });
    });

    (document.getElementById("dt-enableSite") as HTMLInputElement)
        .addEventListener("change", (e) => {
            const host = location.hostname;
            const enabled = (e.target as HTMLInputElement).checked;

            const disabledHosts = enabled
                ? currentSettings!.disabledHosts.filter((h) => h !== host)
                : [...new Set([...currentSettings!.disabledHosts, host])];

            updateSettings({ disabledHosts });
        });
}

function updateSettings(patch: Partial<Settings>): void {
    if (!currentSettings) return;

    currentSettings = { ...currentSettings, ...patch };

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab?.id) return;

        chrome.tabs.sendMessage(tab.id, {
            type: "UPDATE_SETTINGS",
            settings: patch,
        });
    });
}

wireSettings();