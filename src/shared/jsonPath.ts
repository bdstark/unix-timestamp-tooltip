const KEY_REGEX = /"([^"]+)"\s*:/g;

function inferArrayIndex(text: string, index: number): number | null {
  let depth = 0;
  let itemIndex = 0;

  for (let i = index; i >= 0; i--) {
    const c = text[i];

    if (c === "]") depth++;
    if (c === "[") {
      if (depth === 0) {
        return itemIndex;
      }
      depth--;
    }

    if (depth === 0 && c === ",") {
      itemIndex++;
    }
  }

  return null;
}

export function inferJsonPath(
  text: string,
  index: number
): string | null {
  const keys: string[] = [];
  const segments: string[] = [];

  let depth = 0;

  for (let i = index; i >= 0; i--) {
    const c = text[i];

    if (c === "}") depth++;
    if (c === "{") {
      if (depth === 0) break;
      depth--;
    }

    if (depth === 0) {
      KEY_REGEX.lastIndex = i;
      const match = KEY_REGEX.exec(text);
      if (match && match.index <= i) {
        keys.unshift(match[1]);
        i = match.index;
      }
    }
  }

  if (!keys.length) return null;

  segments.push(...keys);

  const arrayIndex = inferArrayIndex(text, index);
  if (arrayIndex !== null) {
    const last = segments.pop();
    segments.push(`${last}[${arrayIndex}]`);
  }

  return `$.${segments.join(".")}`;
}