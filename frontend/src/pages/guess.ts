import { der, sig, type Reactive } from "../../../lib/signal";
import { titleCard } from "../components/menuNav";
import { createButton, createImage, createInput } from "../components/ui";
import { apiFetch } from "../lib/fetch";
import { LIST_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

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

export const guessPage: PageRenderer = ({ page }) => {
    const promptInput = sig<string>("");
    const imgSrc = sig<string>("https://picsum.photos/200");

    const chainId = 1; // TODO

    // Wait a bit for the other guy to upload his shit
    setTimeout(async () => {
        const img = await getImage(chainId);
        imgSrc(img.s3Url)
    }, 4000);

    // Render page
    isolateContainer("page");

    return parseInto(page, createGuessPage(
        "Time to guess - take a swing!",
        promptInput,
        () => { /* visit("draw") */ },
        imgSrc
    ));
}