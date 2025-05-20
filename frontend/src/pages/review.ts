import { menuNav, titleCard } from "../components/menuNav";
import { createChainDisplay, createItemList, type ChainInfo } from "../components/ui";
import { wrapAsRowCards } from "../lib/card";
import { parseInto, react } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { der, sig } from "../lib/util/signal";

// Store signals in variables that can be accessed by the handlers
let chainsSignal: ReturnType<typeof sig<ChainInfo[]>>;

export const reviewPage: PageRenderer = ({ page }, { params }) => {
    debugLog("REVIEW PARAMS:", params);
    const selectedChain = sig<number>(0);
    const chains = sig<ChainInfo[]>(params.alert.chains);

    isolateContainer("page", false);

    // Render page
    parseInto(page, {
        ...menuNav(),
        ...react([selectedChain, chains], () => {
            const ch = chains();

            return wrapAsRowCards({
            ...createItemList(ch, (i, _) => { selectedChain(i); }),
             ...createChainDisplay(ch[selectedChain()].links)
            }, [1, 2], "1em")
        })
    });
}