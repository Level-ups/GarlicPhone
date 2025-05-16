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

// Flag to track if event listeners have been attached
let promptPageListenersAttached = false;

// Function to clean up event listeners when page is unloaded
function cleanupPromptPageListeners() {
    if (promptPageListenersAttached && sseHandler) {
        sseHandler.removeEventListener("before_lobby_update", beforeLobbyUpdateHandler);
        promptPageListenersAttached = false;
    }
}

// Store prompt signal in a variable that can be accessed by the handler
let promptInputSignal: ReturnType<typeof sig<string>>;

// Event handler function
async function beforeLobbyUpdateHandler(e: Event) {
    const lobby: WithClient<Lobby> = JSON.parse((e as any).data);
    log("Before Lobby Update (prompts/guess)", lobby);
    
    // Find the assignment for the current player
    const playerAssignment = lobby.phasePlayerAssignments.find(
        assignment => assignment.player.id === Number(lobby.players[lobby.clientIndex].id)
    );
    
    if (playerAssignment) {
        const uploadedPrompt = await uploadPrompt(
            playerAssignment.chain.id, 
            lobby.phases.index, 
            promptInputSignal(), 
            Number(lobby.players[lobby.clientIndex].id)
        );
    }
}

export const promptPage: PageRenderer = ({ page }) => {
    promptInputSignal = sig<string>("");
    const promptInput = promptInputSignal;

    // Attach event listeners only if they haven't been attached yet
    if (!promptPageListenersAttached && sseHandler) {
        sseHandler.addEventListener("before_lobby_update", beforeLobbyUpdateHandler);
        promptPageListenersAttached = true;
        
        // Add cleanup when page is unloaded
        window.addEventListener("beforeunload", cleanupPromptPageListeners);
    }
    
    isolateContainer("page");

    // Render page
    return parseInto(page, createGuessPage(
        "Think quick - write a prompt!",
        promptInput,
        () => { /* visit("draw") */ }
    ))
};
