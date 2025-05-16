import { der, sig } from "../lib/signal";
//import { titleCard } from "../components/menuNav";
import { createButton, createCheckboxList, createInput, createRadioboxList, createSlider, createToggleSwitch } from "../components/ui";
import { wrapAsCard } from "../lib/card";
import { DEFAULT_FLEX_CONFIG, NAV_FLEX_CONFIG, ROW_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { forEl, parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { menuNav, titleCard } from "../components/menuNav";
import * as lobbyService from "../services/lobbyService";

export const homePage: PageRenderer = ({ page }) => {
    isolateContainer("page");

    // Render page
    parseInto(page, {
        ...titleCard("Home"),
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