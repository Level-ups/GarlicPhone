import { der, sig, type Reactive } from "../../../lib/signal";
import { titleCard } from "../components/menuNav";
import { createImage, createInput } from "../components/ui";
import { apiFetch } from "../lib/fetch";
import { LIST_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import type { Lobby, WithClient } from "../services/lobbyService";

export type Image = {
  id: number;
  s3Url: string;
}

async function getImage(chainId: number): Promise<Image> {
    const res = await apiFetch("get", `/api/images/chain/${chainId}`, undefined);
    const data = await res.json() as Image;
    return data;
}

export function createGuessPage(
    title: string,
    promptInput: Reactive<string>,
    callBack: () => void,
    imgSrc?: Reactive<string>
): ElemTree {
    return {
        "|div": wrapAsFlex({
            ...titleCard(title),
            ...(imgSrc == null ? {} : createImage(imgSrc, "")),
            ...createInput("Enter a prompt", promptInput),
            // ...createButton("Submit", () => { /* visit("draw"); */ }),
            "|p": { _: der(() => `PROMPT: ${promptInput()}`) }
        }, LIST_FLEX_CONFIG)
    };
}

// Flag to track if event listeners have been attached
let guessPageListenersAttached = false;

// Function to clean up event listeners when page is unloaded
function cleanupGuessPageListeners() {
    if (guessPageListenersAttached && sseHandler) {
        sseHandler.removeEventListener("after_lobby_update", afterLobbyUpdateHandler);
        guessPageListenersAttached = false;
    }
}

// Event handler function
async function afterLobbyUpdateHandler(e: Event) {
    const lobby: WithClient<Lobby> = JSON.parse((e as any).data);
    
    // Find the assignment for the current player
    const playerAssignment = lobby.phasePlayerAssignments.find(
        assignment => assignment.player.id === Number(lobby.players[lobby.clientIndex].id)
    );
    
    if (playerAssignment) {
        const image = await getImage(playerAssignment.chain.id);
        imgSrcSignal(image.s3Url);
    }
}

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

async function beforeLobbyUpdateHandler(e: Event) {
    const lobby: WithClient<Lobby> = JSON.parse((e as any).data);
    console.log("Before Lobby Update (prompts/guess)", lobby);
    
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

// Store signals in variables that can be accessed by the handlers
let promptInputSignal: ReturnType<typeof sig<string>>;
let imgSrcSignal: ReturnType<typeof sig<string>>;

export const guessPage: PageRenderer = ({ page }) => {
    promptInputSignal = sig<string>("");
    imgSrcSignal = sig<string>("https://picsum.photos/200");
    const promptInput = promptInputSignal;
    const imgSrc = imgSrcSignal;

    // Attach event listeners only if they haven't been attached yet
    if (!guessPageListenersAttached && sseHandler) {
        sseHandler.addEventListener("after_lobby_update", afterLobbyUpdateHandler);
        sseHandler.addEventListener("before_lobby_update", beforeLobbyUpdateHandler);
        guessPageListenersAttached = true;
        
        // Add cleanup when page is unloaded
        window.addEventListener("beforeunload", cleanupGuessPageListeners);
    }

    // Render page
    isolateContainer("page");

    return parseInto(page, createGuessPage(
        "Time to guess - take a swing!",
        promptInput,
        () => { /* visit("draw") */ },
        imgSrc
    ));
}