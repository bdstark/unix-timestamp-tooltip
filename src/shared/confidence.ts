import type { ContextInfo } from "./context.js"; // .js required here due to Chrome implementing ESM spec strictly
import { Settings } from "./settings.js"; // .js required here due to Chrome implementing ESM spec strictly

export type Confidence = {
    score: number; // 0–10
    percent: number;
};

export function computeConfidence(
    value: number,
    context: ContextInfo,
    settings: Settings
): Confidence {
    let score = 0;
    const len = value.toString().length;

    if (len === 10 || len === 13) {
        score += 4;
    }

    const rawBonus = Math.min(settings.rawLengthBonus, 6);
    score += context.type === "raw" ? rawBonus : 3;

    if (context.jsonPath) score += 2;

    score = Math.min(score, 10);

    return {
        score,
        percent: Math.round((score / 10) * 100),
    };
}