import { sig } from "../../../lib/signal";
import { apiFetch } from "../lib/fetch";
import { GALLERY_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";

export type Image = {
  id: number;
  s3Url: string;
}

async function getImage(chainId: number): Promise<Image> {
    const res = await apiFetch("get", `/api/images/chain/${chainId}`, undefined);
    const data = await res.json() as Image;
    console.log("GET IMAGE:", data);
    return data;
}

export const guessPage: PageRenderer = ({ page }) => {
    const imgSrc = sig<string>("");

    const chainId = 1;

    // Wait a bit for the other guy to upload his shit
    setTimeout(async () => {
        const img = await getImage(chainId);
        imgSrc(img.s3Url)
    }, 4000);

    // Render page
    isolateContainer("page");

    return parseInto(page, {
        "|div": wrapAsFlex({
            "|img": { "@": { src: imgSrc } },
            "|h1": { _: "Guess" },
            "|input": {}
        }, GALLERY_FLEX_CONFIG)
    });
}