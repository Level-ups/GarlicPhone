import { menuNav } from "../components/menuNav";
import { apiFetch } from "../lib/fetch";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { sig, type Signal } from "../lib/signal";
import batAvatar from "/assets/avatars/avatar-batman-comics-svgrepo-com.svg";
import presidentAvatar from "/assets/avatars/avatar-male-president-svgrepo-com.svg";
import zombieAvatar from "/assets/avatars/avatar-dead-monster-svgrepo-com.svg";
import avocadoAvatar from "/assets/avatars/avatar-avocado-food-svgrepo-com.svg";

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
  //   return parseInto(page, {
  //     ...titleNav(),
  //     ...wrapAsFlex(
  //       {
  //         ...wrapAsCard({
  //           ...createButton("Login", () => {
  //             visit("login");
  //           }),
  //           ...createInput("Lobby Code", lobbyCode),
  //           ...react([message], () => wrapAsCard({ _: `Error: ${message()}` })),
  //           $: {
  //             textAlign: "center",
  //             width: "50%",
  //           },
  //         }),
  //         ...wrapAsCard(
  //           {
  //             "|p#lobbyCode": {
  //               _: lobbyCode,
  //             },
  //           },
  //           "Lobby Code"
  //         ),
  //         ...react([players], () => createItemList(players())),
  //       },
  //       DEFAULT_FLEX_CONFIG
  //     ),
  //     "|button.base-button.base-button--accent": {
  //       "|span": { _: "Play" },

  //       "%click": () => {
  //         if (gameId != "") startGame(gameId, playerId);
  //       },
  //       $: { display: der(() => (isHost() ? "inline-block" : "none")) },
  //     },
  //   });

  return parseInto(page, {
    ...menuNav(),
    "|section.lobby-page": {
      "|article.card.lobby-info": {
        "|section.lobby-code": {
          "|div.lobby-code-info": {
            "|p": { _: "Lobby Code" },
            "|h2.lobby-code-title": { _: "123456" },
          },

          "|button.base-button.base-button--danger.leave-lobby-btn": {
            "|span": { _: "Leave lobby" },
          },
        },
      },
      "|article.card.lobby-players": {
        "|seciton.lobby-players-info": {
             "|p.lobby-players-title": { _: "Players in lobby" },
             "|p.lobby-players-count": {_ : "2/8" },
        },
        "|ul.lobby-players-list": {
            // ...createItemList(players(), (index, player) => ({
            //     "|li.lobby-player": {
            //     "|span.lobby-player-name": { _: player.name },
            //     "|span.lobby-player-status": {
            //         _: player.isReady ? "Ready" : "Not Ready",
            //     },
            //     $: {
            //         backgroundColor: der(() =>
            //         player.isReady ? "#4CAF50" : "#f44336"
            //         ),
            //     },
            //     },
            // })),
            "|li.lobby-player#1": {
                "|img.lobby-player-avatar": {
                    "@": { src: batAvatar, alt: "Player Avatar" },
                },
                "|p.lobby-player-name": { _: "Kyle" },
            },
             "|li.lobby-player#2": {
                "|img.lobby-player-avatar": {
                    "@": { src: presidentAvatar, alt: "Player Avatar" },
                },
                "|p.lobby-player-name": { _: "Kat" },
            },
             "|li.lobby-player#3": {
                "|img.lobby-player-avatar": {
                    "@": { src: zombieAvatar, alt: "Player Avatar" },
                },
                "|p.lobby-player-name": { _: "Dino" },
            },
            "|li.lobby-player#4": {
                "|img.lobby-player-avatar": {
                    "@": { src: avocadoAvatar, alt: "Player Avatar" },
                },
                "|p.lobby-player-name": { _: "Carl" },
            },
        },
       
      },
      "|article.card.lobby-start": {
        "|button.base-button.base-button--accent.start-game-btn": {
            "|span": { _: "Start Game" },
        },
      },
    },
  });
};
