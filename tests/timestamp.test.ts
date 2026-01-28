import { describe, it, expect } from "vitest";
import { tooltipFor, relativeTimeFrom } from "../src/shared/timestamp";
import type { ContextInfo } from "../src/shared/context";
import type { Settings } from "../src/shared/settings";

const baseSettings: Settings = {
    showHumanReadable: true,
    showISO8601: true,
    showRelative: true,
    minConfidence: 0,
    rawLengthBonus: 3,
    disabledHosts: [],
};

const rawContext: ContextInfo = {
    type: "raw",
};

describe("tooltipFor (auto unix parsing)", () => {
    it("parses 10-digit unix seconds and exposes derived rows", () => {
        const rows = tooltipFor(1704067200, baseSettings, rawContext);
        expect(rows).not.toBeNull();

        expect(rows?.some((r) => r.label === "Unix (s)")).toBe(true);
        expect(rows?.some((r) => r.label === "Unix (ms)")).toBe(true);
        expect(rows?.some((r) => r.label === "DateTime (UTC)")).toBe(true);
        expect(rows?.some((r) => r.label === "ISO8601")).toBe(true);
    });

    it("parses 13-digit unix millis and exposes derived rows", () => {
        const rows = tooltipFor(1704067200000, baseSettings, rawContext);
        expect(rows).not.toBeNull();

        expect(rows?.some((r) => r.label === "Unix (s)")).toBe(true);
        expect(rows?.some((r) => r.label === "Unix (ms)")).toBe(true);
        expect(rows?.some((r) => r.label === "ISO8601")).toBe(true);
    });

    it("respects showHumanReadable=false", () => {
        const rows = tooltipFor(
            1704067200,
            { ...baseSettings, showHumanReadable: false },
            rawContext
        );

        expect(rows?.some((r) => r.label === "DateTime (UTC)")).toBe(false);
        expect(rows?.some((r) => r.label === "DateTime (Local)")).toBe(false);
    });

    it("respects showISO8601=false", () => {
        const rows = tooltipFor(
            1704067200,
            { ...baseSettings, showISO8601: false },
            rawContext
        );

        expect(rows?.some((r) => r.label === "ISO8601")).toBe(false);
    });

    it("includes relative time when enabled", () => {
        const rows = tooltipFor(1704067200, baseSettings, rawContext);
        expect(rows?.some((r) => r.label === "Relative")).toBe(true);
    });

    it("excludes relative time when disabled", () => {
        const rows = tooltipFor(
            1704067200,
            { ...baseSettings, showRelative: false },
            rawContext
        );

        expect(rows?.some((r) => r.label === "Relative")).toBe(false);
    });

    it("returns null for invalid timestamp lengths", () => {
        const rows = tooltipFor(12345, baseSettings, rawContext);
        expect(rows).toBeNull();
    });

    it("includes context and path rows for JSON context", () => {
        const jsonContext: ContextInfo = {
            type: "json",
            jsonPath: "$.createdAt",
        };

        const rows = tooltipFor(1704067200, baseSettings, jsonContext);
        expect(rows).not.toBeNull();

        expect(rows?.some((r) => r.label === "Context")).toBe(true);
        expect(rows?.some((r) => r.label === "JSON Path")).toBe(true);
        expect(rows?.some((r) => r.label === "jq")).toBe(true);
        expect(rows?.some((r) => r.label === "JS")).toBe(true);
    });
});

describe("relativeTimeFrom", () => {
    it("formats past seconds correctly", () => {
        const now = Date.now();
        const past = new Date(now - 45_000);
        expect(relativeTimeFrom(now, past)).toBe("45s ago");
    });

    it("formats past minutes correctly", () => {
        const now = Date.now();
        const past = new Date(now - 3 * 60_000);
        expect(relativeTimeFrom(now, past)).toBe("3m ago");
    });

    it("formats future time correctly", () => {
        const now = Date.now();
        const future = new Date(now + 60_000);
        expect(relativeTimeFrom(now, future)).toBe("in 1m");
    });
});