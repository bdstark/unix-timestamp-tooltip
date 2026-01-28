const KEY_NODE_REGEX = /"([^"]+)"\s*:/;

let highlighted: HTMLElement[] = [];

export function highlightSource(span: HTMLElement): void {
    clearHighlight();

    // Highlight key
    const parent = span.parentElement;
    if (!parent) return;

    const textNodes = Array.from(parent.childNodes).filter(
        (n) => n.nodeType === Node.TEXT_NODE
    ) as Text[];

    for (const node of textNodes) {
        const match = node.nodeValue?.match(KEY_NODE_REGEX);
        if (match) {
            const range = document.createRange();
            const start = node.nodeValue!.indexOf(`"${match[1]}"`);
            range.setStart(node, start);
            range.setEnd(node, start + match[0].length - 1);

            const mark = document.createElement("span");
            mark.className = "unix-highlight-key";
            range.surroundContents(mark);
            highlighted.push(mark);
            break;
        }
    }

    // Highlight enclosing object (best effort)
    let container: HTMLElement | null = span;
    while (container && container !== document.body) {
        if (container.textContent?.includes("{")) {
            container.classList.add("unix-highlight-container");
            highlighted.push(container);
            break;
        }
        container = container.parentElement;
    }
}

export function clearHighlight(): void {
    highlighted.forEach((el) => {
        if (el.classList.contains("unix-highlight-container")) {
            el.classList.remove("unix-highlight-container");
        } else {
            el.replaceWith(el.textContent ?? "");
        }
    });

    highlighted = [];
}