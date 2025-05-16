import { der, sig } from "../../../lib/signal";
import { titleCard } from "../components/menuNav";
import { createChainDisplay, createItemList, type ChainInfo } from "../components/ui";
import { wrapAsCard, wrapAsRowCards } from "../lib/card";
import { apiFetch } from "../lib/fetch";
import { parseInto, react } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import type { WithClient, Lobby } from "../services/lobbyService";

async function getReviewData(gameId: number): Promise<ChainInfo[]> {
    const res = await apiFetch("get", `/api/chains/game/${gameId}`, undefined);
    const data = await res.json();
    return data;
}

export const reviewPage: PageRenderer = ({ page }) => {
    const selectedChain = sig<number>(0);
    const scStr = der<string>(() => selectedChain().toString());

    const chains = sig<ChainInfo[]>([
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
    ])

    sseHandler?.addEventListener("after_lobby_update", async (e) => {
        const lobby: WithClient<Lobby> = JSON.parse(e.data);
        
        const reviewData = await getReviewData(lobby.dbGameId);

        chains(reviewData);
    });

    isolateContainer("page");

    // Render page
    parseInto(page, {
        ...titleCard("Review"),
        ...react([selectedChain, chains], () => 
            wrapAsRowCards({
            ...createItemList(chains(), (i, _) => { selectedChain(i); }),
             ...createChainDisplay(chains()[selectedChain()].links)
            }, [1, 2], "1em")),
        "|br": {},
        ...wrapAsCard({
        }),
    });
}