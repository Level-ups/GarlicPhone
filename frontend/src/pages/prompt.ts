import { apiFetch } from "../lib/fetch";
import { LIST_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import type { Lobby, WithClient } from "../services/lobbyService";
  
async function uploadPrompt(chainId: number, index: number, text: string, userId: number) {
    console.log("UPLOADING PROMPT:", {chainId, index, text, userId});
    
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
    let promptText: string = "";
    
    sseHandler?.addEventListener("before_lobby_update", async (e) => {
        const lobby: WithClient<Lobby> = JSON.parse(e.data);
        console.log("BEFORE_LOBBY_UPDATE_DATA", lobby)
        console.log("PHASE PLAYER ASSIGNMENTS:", lobby.phasePlayerAssignments)
        const uploadedPrompt = await uploadPrompt(lobby.phasePlayerAssignments[0].chain.id, lobby.phases.index, promptText, Number(lobby.players[lobby.clientIndex].id));
        console.log("PROMPT UPLOADED:", uploadedPrompt);
    });

    // Render page
    return parseInto(page, {
        "|div": wrapAsFlex({
            "|h1": { _: "Prompt" },
            "|input": {
                "%change": (e: Event) => {
                    promptText = (e.target as HTMLInputElement).value;
                }
            },
            "|button": {
                _: "Submit",
                "%click": () => { visit("draw"); }
            }
        }, LIST_FLEX_CONFIG)
    });
}