import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { sig } from "../lib/util/signal";
import { createGuessPage, submitPrompt } from "./guess";
  
export const promptPage: PageRenderer = ({ page }, { globalState, params, onSubmit }) => {
    const promptInp = sig<string>("");
    
    onSubmit((data) => {
        console.log("SUBMISSION EVENT", data); 
        submitPrompt(globalState.gameCode, promptInp()); 
    });

    isolateContainer("page");

    // Render page
    return parseInto(page, createGuessPage(
        "Think quick - write a prompt!",
        "prompt",
        promptInp,
        (params?.alert?.timeStarted ?? params?.timeStarted ?? Date.now()) + 30_000,
        () => {}
    ))
};
