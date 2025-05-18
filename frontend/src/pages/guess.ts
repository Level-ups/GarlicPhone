import { der, sig, type Reactive } from "../../../lib/signal";
import { titleCard, titleNav } from "../components/menuNav";
import { createImage, createInput } from "../components/ui";
import { wrapAsCard } from "../lib/card";
import { apiFetch } from "../lib/fetch";
import { LIST_FLEX_CONFIG, ROW_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { timer } from "../lib/timer";
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
    prompt: string,
    promptInput: Reactive<string>,
    callBack: () => void,
    imgSrc?: Reactive<string>,
    timeInSeconds?: number
): ElemTree {
    return {
        ...titleNav(),
        "|main#guess-page-main": wrapAsFlex({
            "|header#guess-page-header": {
                ...wrapAsFlex({
                    ...wrapAsCard({
                        "|p.guess-text": {
                            "_": prompt,
                        }
                    }, 'PromptCard', ['flex-main-item-size', 'card-with-overflow']),
                    ...(timeInSeconds? {
                        ...wrapAsCard({
                            ...timer(timeInSeconds)
                        }, 'TimerCard', ['flex-equal-size-item', 'card-with-overflow'])
                    }: {}),
                }, ROW_FLEX_CONFIG),
            },
            ...(imgSrc ? {
                ...wrapAsCard({
                    ...createImage(imgSrc, ""),
                }, 'GuessImageCard'),
            }: {}),
            ...wrapAsCard({
                ...wrapAsFlex({
                    ...createInput("Enter a prompt", promptInput),
                   "|button.base-button": {
                       "_": "Submit",
                       "%click": () => {
                           callBack();
                       }
                   }
                }, ROW_FLEX_CONFIG)
            }, 'GuessImagePromptCard')
        }, LIST_FLEX_CONFIG)
    };
}


async function afterLobbyUpdateHandler(e: Event) {
    const lobby: WithClient<Lobby> = JSON.parse((e as any).data);
    
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

let promptInputSignal: ReturnType<typeof sig<string>>;
let imgSrcSignal: ReturnType<typeof sig<string>>;

export const guessPage: PageRenderer = ({ page }) => {
    promptInputSignal = sig<string>("");
    imgSrcSignal = sig<string>("https://picsum.photos/200");
    const promptInput = promptInputSignal;
    const imgSrc = imgSrcSignal;
    isolateContainer("page");

    return parseInto(page, createGuessPage(
        "Time to guess - take a swing!",
        promptInput,
        () => { /* visit("draw") */ },
        imgSrc
    ));
}