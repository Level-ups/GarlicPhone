import { der, sig } from "../lib/signal";
import { menuNav, titleCard } from "../components/menuNav";
import { createChainDisplay, createItemList, type ChainInfo } from "../components/ui";
import { wrapAsRowCards } from "../lib/card";
import { parseInto, react } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

// Store signals in variables that can be accessed by the handlers
let chainsSignal: ReturnType<typeof sig<ChainInfo[]>>;

export const reviewPage: PageRenderer = ({ page }, { params }) => {
    const selectedChain = sig<number>(0);
    const chains = sig<ChainInfo[]>(params.chains);

    isolateContainer("page");

    // Render page
    parseInto(page, {
        ...menuNav(),
        ...titleCard("Review", false),
        ...react([selectedChain, chains], () => 
            wrapAsRowCards({
            ...createItemList(chains(), (i, _) => { selectedChain(i); }),
             ...createChainDisplay(chains()[selectedChain()].links)
            }, [1, 2], "1em")),
    });
}