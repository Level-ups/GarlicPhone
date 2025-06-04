import { titleNav } from "../components/menuNav";
import { createImage, createInput, type ChainLink } from "../components/ui";
import { wrapAsCard } from "../lib/card";
import { apiFetch } from "../lib/fetch";
import { LIST_FLEX_CONFIG, ROW_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { timerTill } from "../lib/timer";
import { sig, type Reactive } from "../lib/util/signal";

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
    type: "guess" | "prompt",
    promptInput: Reactive<string>,
    timeEnding: number,
    callback: () => void,
    imgSrc?: Reactive<string>,
): ElemTree {
    const inputDisabled = sig<boolean>(false);

    return {
        ...titleNav(),
        "|main#guess-page-main": wrapAsFlex({
            "|header#guess-page-header": {
                ...wrapAsFlex({
                    ...wrapAsCard({
                        "|p.guess-text": { "_": prompt, }
                    }, 'PromptCard', ['flex-main-item-size', 'card-with-overflow']),
                }, ROW_FLEX_CONFIG),
            },
            ...(imgSrc ? {
               "|section.guess-image": {
                 ...createImage(imgSrc, ""),
               },
            }: {}),
            ...wrapAsCard({
                ...wrapAsFlex({
                    ...createInput(`Enter a ${type}`, promptInput, inputDisabled),
                    ...timerTill(timeEnding, () => { inputDisabled(true); })
                //    "|button.base-button.base-button--accent": {
                //           "|span": { _: "Submit" },
                //        "%click": callback
                //    }
                }, ROW_FLEX_CONFIG)
            }, 'GuessImagePromptCard')
        }, LIST_FLEX_CONFIG)
    };
}

export const guessPage: PageRenderer = ({ page }, { onSubmit, params, globalState }) => {
    const promptInput = sig<string>("asdf");
    const imgSrc = sig<string>(params?.alert?.imgSrc ?? "");

    onSubmit((data) => {
        debugLog("SUBMISSION EVENT", data); 
        submitPrompt(globalState.gameCode, promptInput()); 
    });

    isolateContainer("page", false);

    return parseInto(page, createGuessPage(
        "Time to guess - take a swing!",
        "guess",
        promptInput,
        (params?.alert?.timeStarted ?? params?.timeStarted ?? Date.now()) + 40_000,
        () => {},
        imgSrc
    ));
}
export async function submitPrompt(gameCode: string, prompt: string) {
    debugLog("Submitting prompt:", prompt, gameCode);
    const res = await apiFetch("post", `/api/games/submit/${gameCode}`, {
        link: { type: "prompt", prompt }
    } as { link: ChainLink; });

    const data = await res.json();
    return data;
}
