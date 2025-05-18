import { menuNav } from "../components/menuNav";
import { apiFetch } from "../lib/fetch";
import { forEl, parseInto, react } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { der, sig, type Signal } from "../lib/signal";
import { createButton } from "../components/ui";

type PlayerInfo = {
  id: number;
  name: string;
  avatarUrl?: string;
  isHost?: boolean;
  isReady?: boolean;
};

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
  const gameCode = sig<string>("asdf");

  const playerId = Number(localStorage.getItem("playerId"));
  localStorage.setItem("playerId", `${playerId}`);

  const isHost = sig<boolean>(false);

  const urlGameCode: string = window.location.pathname
    .split("/")
    .filter((x) => x.trim() != "")
    .at(-1)!;
    isHost(urlGameCode === "lobby");

    // Listen on state refresh
    onUpdate((alert) => {
      console.log("RECEIVED UPDATE:", alert);
      // if (gameCode != "") {
      //   refreshLobbyState(gameCode, players);
      // }
    });

  isolateContainer("page");

  function handleLeaveLobby() {
  }

  return parseInto(page, {
    ...menuNav(),
    "|section.lobby-page": {
      "|article.card.lobby-info": {
        "|section.lobby-code": {
          "|div.lobby-code-info": {
            "|p": { _: "Game Code" },
            "|h2.lobby-code-title": { _: gameCode },
          },

          ...createButton("Leave lobby", handleLeaveLobby, ["base-button--danger", "leave-lobby-btn"])
        },
      },
      "|article.card.lobby-players": {
        "|seciton.lobby-players-info": {
             "|p.lobby-players-title": { _: "Players in lobby" },
             "|p.lobby-players-count": {_ : der(() => `${players().length}/10`) },
        },
        "|ul.lobby-players-list": {
          ...react([players], () => forEl(players(), (i, p) => ({
            "|li.lobby-player": {
                "|img.lobby-player-avatar": {
                  $: { display: p.avatarUrl == null ? "none" : "block" },
                  "@": { src: p.avatarUrl ?? "", alt: "Player Avatar" }
                },
                "|p.lobby-player-name": { _: p.name }
            }
          })))
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
