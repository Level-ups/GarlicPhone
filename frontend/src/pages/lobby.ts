import { GALLERY_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { forEl, parseInto, react } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { titleCard } from "../components/menuNav";
import { updateSSEHandler } from "../lib/sse";
import { der, sig, type Signal } from "../../../lib/signal";
import { wrapAsCard } from "../lib/card";
import type { Lobby, WithClient } from "../services/lobbyService";
import { apiFetch } from "../lib/fetch";

type PlayerInfo = {
    id: number;
    name: string;
    avatarUrl?: string;
    isHost?: boolean;
    isReady?: boolean
};

function randId() {
    return Math.floor(100000000 * Math.random());
}

async function createLobby(playerId: number) {
    const res = await apiFetch("post", "/api/lobbies", {
        hostId: playerId,
        hostName: "Host Player"
    });

    const data = await res.json()
    console.log("CREATE LOBBY:", data);

    return data;
}

async function joinLobby(gameCode: string, playerId: number, players: Signal<PlayerInfo[]>) {
    const res = await apiFetch("post", "/api/lobbies/join", {
        playerId,
        playerName: "Joined Player",
        code: gameCode
    });

    const data = await res.json();
    console.log("JOIN LOBBY:", data);
    players(data.players);

    return data;
}

// Set the current player as ready
async function setAsReady(lobbyId: string, playerId: number, players: Signal<PlayerInfo[]>) {
    const res = await apiFetch("post", `/api/lobbies/${lobbyId}/ready`, { playerId, isReady: true });
    const data = await res.json();
    console.log("SET AS READY:", res);

    players(data.players);
}

async function startGame(gameId: string, playerId: number) {
    const res = await apiFetch("post", `/api/lobbies/${gameId}/start`, { playerId });

    const data = await res.json();
    console.log("START GAME:", data);
}

async function refreshLobbyState(gameCode: string, players: Signal<PlayerInfo[]>) {
    const res = await apiFetch("get", `/api/lobbies/code/${gameCode}`, undefined);

    const data = await res.json();
    console.log("REFRESH LOBBY STATE:", data);
    players(data.players);
}

export const lobbyPage: PageRenderer = ({ page }) => {

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    localStorage.setItem("google-id-token", token ?? "");

    const players = sig<PlayerInfo[]>([
        { id: 1, name: "Player 1" },
        { id: 2, name: "Player 2" }
    ]);
    const message = sig<string | null>(null);

    const playerId = Number(localStorage.getItem("playerId") ?? randId());
    localStorage.setItem("playerId", `${playerId}`);

    const isHost = sig<boolean>(false);

    const urlGameCode: string = window.location.pathname.split("/").filter(x => x.trim() != "").at(-1)!;
    isHost(urlGameCode === "lobby");

    let gameCode = "", gameId = "";

    (async () => {

        if (urlGameCode === "lobby") { // Create new lobby
            const res = await createLobby(playerId);

            gameCode = res.code; gameId = res.id;
            updateSSEHandler(`/api/lobbies/${res.id}/events`);
            setAsReady(res.id, playerId, players);
        }
        else { // Join existing lobby
            const res = await joinLobby(urlGameCode, playerId, players);
            if (res?.message != null) { // There was an error
                message(res.message);
                return;
            }

            gameCode = res.code; gameId = res.id;
            updateSSEHandler(`/api/lobbies/${res.id}/events`);
            setAsReady(res.id, playerId, players);
        }
        console.log(gameCode);

        // Listen on state refresh
        sseHandler?.addEventListener("lobby_update", (e) => {
            const data: WithClient<Lobby> = JSON.parse(e.data);
            if (gameCode != "") { refreshLobbyState(gameCode, players); }
        });

    })();


    isolateContainer("page");

    // Render page
    return parseInto(page, {
        ...titleCard("Lobby"),
        "|div": wrapAsFlex({
            ...react([message, players], () => (
                message() == null ? {
                    "|ul#playerList": forEl(players(), (_, p) => ({
                        "|li": { _: `[${p.id}] ${p.name}` }
                    }))
                } : wrapAsCard({ _: `Error: ${message()}` })
            )),
        "|button": {
            _: "Play",
            "%click": () => { if (gameId != "") startGame(gameId, playerId); },
            $: { display: der(() => isHost() ? "inline-block" : "none") }
        }
        }, GALLERY_FLEX_CONFIG)
    });
}