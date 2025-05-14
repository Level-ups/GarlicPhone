import { titleCard } from "../components/menuNav";
import { wrapAsRowCards } from "../lib/card";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

export const reviewPage: PageRenderer = ({ page }) => {
    // Render page
    return parseInto(page, {
        ...titleCard("Review"),
        ...wrapAsRowCards({
            "0|div": { _: "asdf", $: { border: "1px solid red" } },
            "1|div": {
                "|h1": { _: "fdsa" },
                "|h2": { _: "fldjsalkfjdkslks" },
                $: { border: "1px solid red" }
            },
            // "2|div": { _: "hjkl", $: { border: "1px solid red" } }
        }, [3], "1em"),
    });
}