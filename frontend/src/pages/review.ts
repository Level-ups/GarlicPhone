import { der, sig } from "../lib/signal";
import { titleCard } from "../components/menuNav";
import { createChainDisplay, createItemList, type ChainInfo } from "../components/ui";
import { wrapAsRowCards } from "../lib/card";
import { apiFetch } from "../lib/fetch";
import { parseInto, react } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import type { Lobby, WithClient } from "../services/lobbyService";

async function getReviewData(gameId: number): Promise<ChainInfo[]> {
    const res = await apiFetch("get", `/api/chains/game/${gameId}`, undefined);
    const data = await res.json();
    return data;
}

// Flag to track if event listeners have been attached
let reviewPageListenersAttached = false;

// Function to clean up event listeners when page is unloaded
function cleanupReviewPageListeners() {
    if (reviewPageListenersAttached && sseHandler) {
        sseHandler.removeEventListener("after_lobby_update", afterLobbyUpdateHandler);
        reviewPageListenersAttached = false;
    }
}

// Store signals in variables that can be accessed by the handlers
let chainsSignal: ReturnType<typeof sig<ChainInfo[]>>;

// Event handler function
async function afterLobbyUpdateHandler(e: Event) {
    const lobby: WithClient<Lobby> = JSON.parse((e as any).data);
    
    const reviewData = await getReviewData(lobby.dbGameId);
    chainsSignal(reviewData);
}

export const reviewPage: PageRenderer = ({ page }) => {
    const selectedChain = sig<number>(0);
    const scStr = der<string>(() => selectedChain().toString());

    chainsSignal = sig<ChainInfo[]>([
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
    const chains = chainsSignal;

    // Attach event listeners only if they haven't been attached yet
    if (!reviewPageListenersAttached && sseHandler) {
        sseHandler.addEventListener("after_lobby_update", afterLobbyUpdateHandler);
        reviewPageListenersAttached = true;
        
        // Add cleanup when page is unloaded
        window.addEventListener("beforeunload", cleanupReviewPageListeners);
    }

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
        // ...wrapAsCard({
        // }),
    });
}