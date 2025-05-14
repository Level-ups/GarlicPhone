import { titleCard } from "../components/menuNav";
import { wrapAsCard, wrapAsRowCards } from "../lib/card";
import { DEFAULT_FLEX_CONFIG, ROW_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

export const homePage: PageRenderer = ({ page }) => {
    // Render page
    parseInto(page, {
        ...titleCard("Home"),
        ...wrapAsFlex({
            ...wrapAsCard({
                "|button": {
                    _: "Login",
                    "%click": () => { visit("login"); }
                },
                $: {
                    textAlign: "center",
                    width: "50%"
                }
            })
        }, DEFAULT_FLEX_CONFIG)
    });
}