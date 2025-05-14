import { NAV_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { forEl, type ElemTree } from "../lib/parse";

type Link = {
    name: string,
    url: string
}

function createLink({ name, url }: Link): ElemTree {
    return {
        "|a": {
            _: name,
            "@": { href: url},
            $: {
                border: "1px solid pink",
                padding: "0.4em 1em",
                borderRadius: "100em"
            }
        }
    };
}

export function menuNav(): ElemTree {
    const links: Link[] = [
        { name: "Play", url: "/play" },
        { name: "Gallery", url: "/gallery" }
    ];

    return {
        "|nav.nav.card": {
            ...wrapAsFlex(forEl(links, (_, l) => createLink(l)), NAV_FLEX_CONFIG),
            $: { marginBottom: "2em" },
        }
    };
}

export function titleCard(title: string): ElemTree {
    return {
        "|nav.nav.card": {
            "|h1": { _: title },
            $: {
                marginBottom: "2em",
                textAlign: "center"
            },
        }
    };
}

