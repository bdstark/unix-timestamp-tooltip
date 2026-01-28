import { describe, it, expect } from "vitest";
import { detectContext } from "../src/shared/context";
import type { ContextInfo } from "../src/shared/context";

describe("detectContext – time key detection", () => {
    function ctx(text: string): ContextInfo {
        // simulate a number appearing after the key
        const index = text.indexOf("1704067200");
        return detectContext(text, index);
    }

    it("detects camelCase time keys ending with At", () => {
        const c = ctx('"createdAt": 1704067200');
        expect(c.type).toBe("json");
    });

    it("detects camelCase Timestamp keys", () => {
        const c = ctx('"eventTimestamp": 1704067200');
        expect(c.type).toBe("json");
    });

    it("detects snake_case _at keys", () => {
        const c = ctx('"updated_at": 1704067200');
        expect(c.type).toBe("json");
    });

    it("detects snake_case _time keys", () => {
        const c = ctx('"request_time": 1704067200');
        expect(c.type).toBe("json");
    });

    it("detects short ts key", () => {
        const c = ctx('"ts": 1704067200');
        expect(c.type).toBe("json");
    });

    it("does not match words that merely end with 'at'", () => {
        const c = ctx('"format": 1704067200');
        expect(c.type).toBe("raw");
    });

    it("does not match unrelated words", () => {
        const c = ctx('"metadata": 1704067200');
        expect(c.type).toBe("raw");
    });

    it("does not match plain text without key syntax", () => {
        const c = ctx('createdAt 1704067200');
        expect(c.type).toBe("raw");
    });
});