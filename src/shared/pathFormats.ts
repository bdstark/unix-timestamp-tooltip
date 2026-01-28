export function toJq(path: string): string {
    // $.a.b[0].c -> .a.b[0].c
    return path.replace(/^\$\./, ".");
}

export function toJs(path: string, root = "obj"): string {
    // $.a.b[0].c -> obj.a.b[0].c
    return path.replace(/^\$\./, `${root}.`);
}