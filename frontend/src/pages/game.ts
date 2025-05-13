import { wrapAsCard } from "../lib/card";
import { GALLERY_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto, forEl, type StyleDict } from "../lib/parse";
import { bind, der, eff, sig } from "../../../lib/signal";
import type { PageRenderer } from "../lib/router";

export const gamePage: PageRenderer = ({ app }) => {
    // Render page
    return parseInto(app, wrapAsFlex(
        {
            "|button": {
                _: "tmp",
                $: { width: "100%" }
            }
        },
        GALLERY_FLEX_CONFIG,
    ));
}