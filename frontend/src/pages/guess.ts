import { GALLERY_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

export const guessPage: PageRenderer = ({ page }) => {
    // Render page
    return parseInto(page, {
        "|div": wrapAsFlex({
            "|h1": { _: "Guess" },
            "|input": {}
        }, GALLERY_FLEX_CONFIG)
    });
}