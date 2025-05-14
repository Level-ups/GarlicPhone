import { GALLERY_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { forEl, parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { menuNav, titleCard } from "../components/menuNav";

type PlayerInfo = { name: string; };

export const lobbyPage: PageRenderer = ({ page }) => {
    const players: PlayerInfo[] = [
        { name: "Player 1" },
        { name: "Player 2" },
        { name: "Player 3" },
        { name: "Player 4" },
    ];

    // Render page
    return parseInto(page, {
        ...titleCard("Lobby"),
        "|div": wrapAsFlex({
            "|ul#playerList": forEl(players, (_, p) => ({
                "|li": { _: ` > ${p.name}` }
            })),
        "|button": {
            _: "Play",
            "%click": () => { visit("prompt") }
        }
        }, GALLERY_FLEX_CONFIG)
    });
}