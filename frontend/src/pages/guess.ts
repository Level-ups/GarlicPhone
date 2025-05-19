import { titleNav } from "../components/menuNav";
import { createImage, createInput, type ChainLink } from "../components/ui";
import { wrapAsCard } from "../lib/card";
import { apiFetch } from "../lib/fetch";
import { LIST_FLEX_CONFIG, ROW_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { timer } from "../lib/timer";
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
    callback: () => void,
    imgSrc?: Reactive<string>,
    timeInSeconds?: number
): ElemTree {
    return {
        ...titleNav(),
        "|main#guess-page-main": wrapAsFlex({
            "|header#guess-page-header": {
                ...wrapAsFlex({
                    ...wrapAsCard({
                        "|p.guess-text": { "_": prompt, }
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
                    ...createInput(`Enter a ${type}`, promptInput),
                   "|button.base-button.base-button--accent": {
                          "|span": { _: "Submit" },
                       "%click": callback
                   }
                }, ROW_FLEX_CONFIG)
            }, 'GuessImagePromptCard')
        }, LIST_FLEX_CONFIG)
    };
}

async function uploadPrompt() {
    const res = await apiFetch("post", "/api/prompts", {
        link: { type: "image", url: "" }
    } as { link: ChainLink });

    const data = await res.json();
    return data;
}

export const guessPage: PageRenderer = ({ page }, { onSubmit }) => {
    const promptInput = sig<string>("asdf");
    const imgSrc = sig<string>("https://picsum.photos/200");

    onSubmit(() => { uploadPrompt(); });

    isolateContainer("page");

    return parseInto(page, createGuessPage(
        "Time to guess - take a swing!",
        "guess",
        promptInput,
        () => { /* visit("draw") */ },
        imgSrc,
        30
    ));
}