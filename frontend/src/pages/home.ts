import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

export const homePage: PageRenderer = ({ page }) => {
    parseInto(page, {
        "|h1 #someid.someclass1 .someclass2": {
        _: "Home",
        $: { color: "red" },
        "|div": {
            _: "hello world",
            $: {
            color: "var(--asdf)",
            border: "1px solid blue",
            fontSize: "0.5em",
            },
            "%click": () => {
            console.log("CLICKED!")
            }
        },
        "|ui-button": { _: "asdf" }
        },
    });
}