import { sig } from "../lib/signal";
import { apiFetch } from "../lib/fetch";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import type { Lobby, WithClient } from "../services/lobbyService";
import { createGuessPage } from "./guess";
  
async function uploadPrompt(chainId: number, index: number, text: string, userId: number) {
    
    const res = await apiFetch("post", "/api/prompts", {
        chainId,
        index,
        text,
        userId
    });

    const data = await res.json()  
    return data;
}

export const promptPage: PageRenderer = ({ page }) => {
    const promptInput = sig<string>("");
    
    // sseHandler?.addEventListener("before_lobby_update", async (e) => {
    //     const lobby: WithClient<Lobby> = JSON.parse(e.data);
    //     console.log("Before Lobby Update (prompts/guess)", lobby);
        
    //     const uploadedPrompt = await uploadPrompt(lobby.phasePlayerAssignments[0].chain.id, lobby.phases.index, promptInput(), Number(lobby.players[lobby.clientIndex].id));
    // });

    isolateContainer("page");

    // Render page
    return parseInto(page, createGuessPage(
        "Think quick - write a prompt!",
        promptInput,
        () => { /* visit("draw") */ }
    ));
};
