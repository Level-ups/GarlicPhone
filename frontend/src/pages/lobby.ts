import { titleCard } from "../components/menuNav";
import { createInput, createItemList } from "../components/ui";
import { wrapAsCard } from "../lib/card";
import { apiFetch } from "../lib/fetch";
import { parseInto, react } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { der, sig, type Signal } from "../lib/signal";

type PlayerInfo = {
  id: number;
  name: string;
  avatarUrl?: string;
  isHost?: boolean;
  isReady?: boolean;
};

async function createLobby(playerId: number) {
  const res = await apiFetch("post", "/api/games/create", {
    hostId: playerId,
    hostName: "Host Player",
  });

  const data = await res.json();

  return data;
}

async function joinLobby(
  gameCode: string,
  playerId: number,
  players: Signal<PlayerInfo[]>
) {
  const res = await apiFetch("post", `/api/games/join/${gameCode}`, {
    playerId,
    playerName: "Joined Player",
    code: gameCode,
  });

  const data = await res.json();
  players(data.players);

  return data;
}

async function startGame(gameCode: string, playerId: number) {
  const res = await apiFetch("post", `/api/games/${gameCode}/start`, {
    playerId,
  });

  const data = await res.json();
}

async function refreshLobbyState(
  gameCode: string,
  players: Signal<PlayerInfo[]>
) {
  const res = await apiFetch("get", `/api/lobbies/code/${gameCode}`, undefined);

  const data = await res.json();
  players(data.players);
}

export const lobbyPage: PageRenderer = ({ page }, { onUpdate }) => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) localStorage.setItem("google-id-token", token);

  const players = sig<PlayerInfo[]>([]);
  const message = sig<string | null>(null);
  const lobbyCode = sig<string>("");

  const playerId = Number(localStorage.getItem("playerId"));
  localStorage.setItem("playerId", `${playerId}`);

  const isHost = sig<boolean>(false);

  const urlGameCode: string = window.location.pathname
    .split("/")
    .filter((x) => x.trim() != "")
    .at(-1)!;
  isHost(urlGameCode === "lobby");

  let gameCode = "",
    gameId = "";

  // (async () => {
  //   if (urlGameCode === "lobby") {
  //     // Create new lobby
  //     const res = await createLobby(playerId);

  //     gameCode = res.code;
  //     gameId = res.id;
  //     lobbyCode(gameCode);
  //     setAsReady(res.id, playerId, players);
  //   } else {
  //     // Join existing lobby
  //     const res = await joinLobby(urlGameCode, playerId, players);
  //     if (res?.message != null) {
  //       // There was an error
  //       message(res.message);
  //       return;
  //     }

  //     gameCode = res.code;
  //     gameId = res.id;
  //     setAsReady(res.id, playerId, players);
  //   }

  // })();

    // Listen on state refresh
    onUpdate((alert) => {
      if (gameCode != "") {
        refreshLobbyState(gameCode, players);
      }
    });

  isolateContainer("page");

  // Render page
  return parseInto(page, {
    ...titleCard("Lobby"),
    "|section.lobbyCtn": {
      ...wrapAsCard({
        ...createInput("Lobby Code", lobbyCode),
        // ...createButton("Play", () => {
        //   visit("login");
        // }),
        "|button.gradient-btn.playButton": {
          _: "Play",
          "%click": () => {
            if (gameId != "") startGame(gameId, playerId);
          },
          $: { display: der(() => (isHost() ? "inline-block" : "none")) },
        },
        ...react([message], () => message() ? wrapAsCard({ _: `Error: ${message()}` }) : {}),
        $: {
          textAlign: "center",
          width: "50%",
          alignSelf: "center",
        },
      }),
      ...wrapAsCard(
        {
          "|p#lobbyCode": {
            _: der(() => "CODE: " + lobbyCode()),
          },
        },
        "Lobby Code"
      ),
      ...react([players], () => createItemList(players())),
    }
  });
};
