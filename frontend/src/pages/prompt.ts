import { LIST_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

export const promptPage: PageRenderer = ({ page }) => {
    isolateContainer("page");

    // Render page
    return parseInto(page, {
        "|div": wrapAsFlex({
            "|h1": { _: "Prompt" },
            "|input": {},
            "|button": {
                _: "Submit",
                "%click": () => { visit("draw"); }
            }
        }, LIST_FLEX_CONFIG)
    });
}