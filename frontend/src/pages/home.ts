import { createButton, } from "../components/ui";
import { wrapAsCard } from "../lib/card";
import { NAV_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { forEl, parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { titleCard } from "../components/menuNav";

export const homePage: PageRenderer = ({ page }) => {
    isolateContainer("page");

    // Render page
    parseInto(page, {
        ...titleCard("Home"),
        "|h1": { _: "", $: { textAlign: "center", color: "var(--black)" } },
        ...forEl(4, { "|br": {} }),
        ...wrapAsFlex({
            ...wrapAsCard({
                ...createButton("Login", () => { visit("login"); }),
                $: {
                    width: "40%",
                    minWidth: "12em"
                }
            }),
        }, NAV_FLEX_CONFIG)
    });
}