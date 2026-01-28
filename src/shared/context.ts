import { inferJsonPath } from "./jsonPath.js"; // .js required here due to Chrome implementing ESM spec strictly

export type Context =
    | "json"
    | "log"
    | "sql"
    | "raw";

export type ContextInfo = {
    type: Context;
    jsonPath?: string;
};

const CAMEL_TIME_KEY =
    /"(?:\w+(At|Time|Timestamp)|ts)"\s*:\s*/i;

const SNAKE_TIME_KEY =
    /"\w+_(at|time|timestamp|ts)"\s*:\s*/i;

function isTimeKey(text: string): boolean {
    return CAMEL_TIME_KEY.test(text) || SNAKE_TIME_KEY.test(text);
}

const LOG_REGEX =
    /\b(ts|timestamp|time)=?$/i;

const SQL_REGEX =
    /\b(created_at|updated_at|timestamp|time)\b$/i;

export function detectContext(
    text: string,
    index: number
): ContextInfo {
    if (isTimeKey(text.slice(Math.max(0, index - 50), index))) {
        return {
            type: "json",
            jsonPath: inferJsonPath(text, index) ?? undefined,
        };
    }

    if (SQL_REGEX.test(text.slice(Math.max(0, index - 40), index))) {
        return { type: "sql" };
    }

    if (LOG_REGEX.test(text.slice(Math.max(0, index - 40), index))) {
        return { type: "log" };
    }

    return { type: "raw" };
}