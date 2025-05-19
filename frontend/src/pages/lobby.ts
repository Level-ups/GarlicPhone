import { menuNav } from "../components/menuNav";
import { createButton } from "../components/ui";
import { apiFetch } from "../lib/fetch";
import { forEl, parseInto, react } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { der, sig, type Signal } from "../lib/util/signal";

type PlayerInfo = {
  id: number;
  name: string;
  avatarUrl: string;
  isHost?: boolean;
};

async function startGame(gameCode: string, playerClickedStartGame: Signal<boolean>) {
  const res = await apiFetch("post", `/api/games/start/${gameCode}`, {});

  const data = await res.json();
  debugLog("start game", data);

  playerClickedStartGame(false);
  return data;
}

async function refreshLobbyState(
  gameCode: string,
  players: Signal<PlayerInfo[]>
) {
  try {
    debugLog(`Fetching lobby state for code: ${gameCode}`);
    const res = await apiFetch("get", `/api/games/state/${gameCode}`, undefined);
    
    if (!res.ok) {
      const errorText = await res.text();
      debugErr(`Error fetching lobby data: ${res.status} ${res.statusText}`, errorText);
      return;
    }
    
    const data = await res.json();
    debugLog("Received lobby data:", data);
    
    if (data && Array.isArray(data.players)) {
      debugLog(`Updating players list with ${data.players.length} players`);
      players(data.players);
    } else {
      debugErr("Invalid data format, players array not found:", data);
    }
  } catch (error) {
    debugErr("Error refreshing lobby state:", error);
  }
}

export const lobbyPage: PageRenderer = ({ page }, { globalState, onUpdate }) => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const players = sig<PlayerInfo[]>([]);
  const gameCode = sig<string>(globalState.gameCode);
  const playerClickedStartGame = sig<boolean>(false);

  const playerId = Number(sessionStorage.getItem("playerId"));
  sessionStorage.setItem("playerId", `${playerId}`);

  const isHost = der<boolean>(() => players().length > 0 && players()[0].id == playerId);

  const urlGameCode: string = window.location.pathname
    .split("/")
    .filter((x) => x.trim() != "")
    .at(-1)!;

  // Listen on state refresh
  onUpdate((alert) => {
    debugLog("RECEIVED UPDATE:", alert);
    if (gameCode()) {
      debugLog("Refreshing lobby state with code:", gameCode());

      players(alert.update.players.map((a: any) => ({
        id: a.playerId,
        name: a.name,
        avatarUrl: a.avatarURL,
        isHost: a.isHost
      })));

      // refreshLobbyState(gameCode(), players);
    }
  });

  isolateContainer("page");

  function handleLeaveLobby() {
    visit("gallery");
  }

  function handleStartGame() {
    playerClickedStartGame(true);
    startGame(globalState.gameCode, playerClickedStartGame);
  
  }

  return parseInto(page, {
    ...menuNav(),
    "|section.lobby-page": {
      "|article.card.lobby-info": {
        "|section.lobby-code": {
          "|div.lobby-code-info": {
            "|p": { _: "Game Code" },
            "|h2.lobby-code-title": { _: gameCode() },
          },

          ...createButton("Leave lobby", handleLeaveLobby, ["base-button--danger", "leave-lobby-btn"])
        },
      },
      "|article.card.lobby-players": {
        "|section.lobby-players-info": {
             "|p.lobby-players-title": { _: "Players in lobby" },
             "|p.lobby-players-count": {_ : der(() => `${players().length}/10`) },
        },
        "|ul.lobby-players-list": {
          ...react([players], () => forEl(players(), (i, p) => ({
            "|li.lobby-player": {
                "|img.lobby-player-avatar": {
                  $: { display: p.avatarUrl === "" ? "none" : "block" },
                  "@": { src: p.avatarUrl ?? "", alt: "Player Avatar" }
                },
                "|p.lobby-player-name": { _: p.name }
            }
          })))
        },
       
      },
      "|article.card.lobby-start": {
        ...createButton("Start Game", handleStartGame, ["base-button--accent", "start-game-btn"], playerClickedStartGame),
        $: { display: der(() => isHost() ? "block" : "none") }
      },
    },
  });
};
