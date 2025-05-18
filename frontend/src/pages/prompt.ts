import { sig } from "../lib/signal";
import { apiFetch } from "../lib/fetch";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { createGuessPage } from "./guess";
import type { ChainLink } from "../components/ui";
  
async function submitPrompt(gameCode: string, prompt: string) {
    const res = await apiFetch("post", `/api/games/submit/${gameCode}`, {
        link: { type: "prompt", prompt }
    } as { link: ChainLink });

    const data = await res.json();
    return data;
}

export const promptPage: PageRenderer = ({ page }, { globalState, onSubmit }) => {
    const promptInp = sig<string>("");
    
    onSubmit((alert) => { submitPrompt(globalState.gameCode, promptInp()); });

    isolateContainer("page");

    // Render page
    return parseInto(page, createGuessPage(
        "Think quick - write a prompt!",
        "prompt",
        promptInp,
        () => { /* visit("draw") */ }
    ))
};
