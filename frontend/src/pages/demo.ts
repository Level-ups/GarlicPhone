import { der, sig } from "../lib/util/signal";
//import { titleCard } from "../components/menuNav";
import { titleCard } from "../components/menuNav";
import { createButton, createCheckboxList, createInput, createRadioboxList, createSlider, createToggleSwitch } from "../components/ui";
import { wrapAsCard } from "../lib/card";
import { NAV_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

export const demoPage: PageRenderer = ({ page }) => {
    isolateContainer("page");
    const inpStr = sig<string>("");
    const inpNum = sig<number>(10);
    const inpBool = sig<boolean>(false);

    // Render page
    parseInto(page, {
        ...titleCard("Home"),
        ...wrapAsFlex({
            ...wrapAsCard({
                "|p": { _: der(() => `${inpStr()} - ${inpNum()} - ${inpBool()}`) },
                ...createButton("Login", () => { visit("login"); }),

                "0|br": {}, "1|br": {},

                ...createInput("Input here", inpStr),

                ...createRadioboxList("asdf", [
                    { label: "Hearts", value: "hearts" },
                    { label: "Diamonds", value: "diamonds" },
                    { label: "Spades", value: "spades" },
                    { label: "Clubs", value: "clubs" },
                ]),
                ...createToggleSwitch(inpBool),
                ...createCheckboxList([
                    { label: "Hearts", value: "hearts" },
                    { label: "Diamonds", value: "diamonds" },
                    { label: "Spades", value: "spades" },
                    { label: "Clubs", value: "clubs" },
                ]),
                ...createSlider(0, 20, inpNum),
                $: {
                    textAlign: "center",
                    width: "50%"
                }
            }),
        }, NAV_FLEX_CONFIG)
    });
}