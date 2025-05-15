import { sig } from "../../../lib/signal";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { createGuessPage } from "./guess";

export const promptPage: PageRenderer = ({ page }) => {
    const promptInput = sig<string>("");

    const chainId = 1; // TODO

    isolateContainer("page");

    // Render page
    return parseInto(page, createGuessPage(
        "Think quick - write a prompt!",
        promptInput,
        () => { visit("draw") }
    ));
}