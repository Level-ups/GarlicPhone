import { der, sig } from "../../../lib/signal";
import { titleCard } from "../components/menuNav";
import { createChainDisplay, createItemList, type ChainInfo } from "../components/ui";
import { wrapAsCard, wrapAsRowCards } from "../lib/card";
import { parseInto, react } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

export const reviewPage: PageRenderer = ({ page }) => {
    const selectedChain = sig<number>(0);
    const scStr = der<string>(() => selectedChain().toString());

    const chains: ChainInfo[] = [
        { name: "Chain 1", links: [
            { type: "prompt", prompt: "Rudolph eating a vegetarian burger" },
            { type: "image", url: "https://picsum.photos/250" },
            { type: "prompt", prompt: "A chicken crossing a road" },
            { type: "image", url: "https://picsum.photos/50" },
            { type: "prompt", prompt: "Probably something fished out of the Bermuda triangle" },
        ] },
        { name: "lasdjfklasjdfklsafkldsajf", links: [] },
        { name: "Chain 3", links: [
            { type: "prompt", prompt: "Rudolph eating a vegetarian burger" },
            { type: "image", url: "https://picsum.photos/250" },
            { type: "prompt", prompt: "A chicken crossing a road" },
            { type: "image", url: "https://picsum.photos/300" },
            { type: "prompt", prompt: "Probably something fished out of the Bermuda triangle" },
        ] },
    ]

    isolateContainer("page");

    // Render page
    parseInto(page, {
        ...titleCard("Review"),
        ...wrapAsRowCards({
            ...createItemList(chains, (i, _) => { selectedChain(i); }),
            ...react([selectedChain], () => createChainDisplay(chains[selectedChain()].links))
        }, [1, 2], "1em"),
        "|br": {},
        // ...wrapAsCard({
        // }),
    });
}