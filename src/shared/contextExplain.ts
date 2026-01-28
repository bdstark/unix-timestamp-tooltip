import type { ContextInfo } from "./context.js"; // .js required here due to Chrome implementing ESM spec strictly

export function explainContext(
    value: number,
    context: ContextInfo
): string {
    switch (context.type) {
        case "json":
            if (context.jsonPath) {
                const key = context.jsonPath.split(".").pop();
                return `Detected because JSON key "${key}" matches common timestamp fields`;
            }
            return "Detected because value appears in JSON context";

        case "log":
            return "Detected because value follows a log time field";

        case "sql":
            return "Detected because value appears in a SQL time column";

        case "raw":
        default: {
            const len = value.toString().length;
            if (len === 10) {
                return "Detected because value length matches Unix timestamp (seconds)";
            }
            if (len === 13) {
                return "Detected because value length matches Unix timestamp (milliseconds)";
            }
            return "Detected because value resembles a Unix timestamp";
        }
    }
}