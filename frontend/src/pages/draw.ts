import { sig } from "../../../lib/signal";
import { apiFetch } from "../lib/fetch";
import { forEl, parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { timer } from "../lib/timer";
import { drawLine, drawPixel, floodFill, resizeCanvasToDisplaySize } from "../lib/util/canvasUtils";
import type { Lobby, WithClient } from "../services/lobbyService";
import eraserToolIcon from "/assets/canvas/eraser-tool.svg";
import fillToolIcon from "/assets/canvas/fill-tool.svg";
import pecilToolIcon from "/assets/canvas/pencil-tool.svg";
import tickIcon from "/assets/canvas/tick.svg";
import trashIcon from "/assets/canvas/trash.svg";
import garlicPhoneLogo from "/assets/logo.svg";

type CanvasModes = {
  fill: boolean;
  erase: boolean;
  draw: boolean;
};

type PencilContext = {
  pixelSize: number;
  colour: string;
};

type CanvasConfig = {
  pencilContext: PencilContext;
  canvasContext: CanvasRenderingContext2D | undefined | null;
  modes: CanvasModes;
};

type ToolButtonConfig = { imagePath: string; altText: string, initiallyActive?: boolean, clickFunc: Function };
type ColourButtonConfig = {colour: string, initiallyActive?: boolean}

const canvasConfig: CanvasConfig = {
  pencilContext: {
    pixelSize: 10,
    colour: "black",
  },
  canvasContext: undefined,
  modes: {
    fill: false,
    erase: false,
    draw: true,
  },
};

let isDrawing = false;
let lastX = 0;
let lastY = 0;

let activeColourButton: HTMLButtonElement | null | undefined = null;
let activeToolButton: HTMLButtonElement | null | undefined = null;

function updateCanvasColour(colourButton: HTMLButtonElement) {
  
  if (!canvasConfig.canvasContext) {
    return;
  }
  console.log(colourButton.style.backgroundColor);
  if (canvasConfig.modes.erase) {
    canvasConfig.pencilContext.colour = colourButton.style.backgroundColor;
  } else {
    canvasConfig.canvasContext.fillStyle = canvasConfig.pencilContext.colour =
      colourButton.style.backgroundColor;
  }
}

function toggleColourButtonActive(button: HTMLButtonElement) {
  activeColourButton?.classList.remove("colour-button-active");
  button.classList.add("colour-button-active");
  activeColourButton = button;
}

function toggleToolButtonActive(button: HTMLButtonElement) {
  if (button.id !== "clearButton") {
    activeToolButton?.classList.remove("canvas-button-active");
    button.classList.add("canvas-button-active");
    activeToolButton = button;
  }
}

function generateCanvasColourButton(colourButton: ColourButtonConfig): ElemTree {
  return {
    [`|button.colour-button${colourButton.initiallyActive ? '.colour-button-active' : ''}`]: {
      "%click": (event: Event) => {
        toggleColourButtonActive(event.target as HTMLButtonElement);
        updateCanvasColour(event.target as HTMLButtonElement);
      },
      $: {
        backgroundColor: colourButton.colour,
      },
      "|img.inner-button-img": {
        "@": {
          src: tickIcon,
          alt: "Colour button",
        },
      },
    },
  };
}

function generateCanvasToolButton(button: ToolButtonConfig) {
  return {
    [`|button.canvas-button${button.initiallyActive ? '.canvas-button-active': ''}`]: {
      "|img.inner-button-img": {
        "@": {
          src: button.imagePath,
          alt: button.altText,
        },
      },
      "%click": (event: Event) => {
        button.clickFunc(event)
      }
    },
  };
}

function mousedownEvent(event: MouseEvent, ctx: CanvasRenderingContext2D) {
  const x = Math.floor(event.offsetX / canvasConfig.pencilContext.pixelSize);
  const y = Math.floor(event.offsetY / canvasConfig.pencilContext.pixelSize);

  if (canvasConfig.modes.fill) {
    const rect = getCanvasContext().canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvasX = Math.floor((event.clientX - rect.left) * dpr);
    const canvasY = Math.floor((event.clientY - rect.top) * dpr);
    
    floodFill(ctx, canvasX, canvasY, canvasConfig.pencilContext.colour);
  } else if (canvasConfig.modes.erase) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    drawPixel(x, y, ctx, canvasConfig.pencilContext.pixelSize);
  } else if (canvasConfig.modes.draw) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    drawPixel(x, y, ctx, canvasConfig.pencilContext.pixelSize);
  }
}

function mousemoveEvent(event: MouseEvent, ctx: CanvasRenderingContext2D){
  if (!isDrawing) return;
  const x = Math.floor(event.offsetX / canvasConfig.pencilContext.pixelSize);
  const y = Math.floor(event.offsetY / canvasConfig.pencilContext.pixelSize);
  drawLine(lastX, lastY, x, y, ctx, canvasConfig.pencilContext.pixelSize);
  lastX = x;
  lastY = y;
}

function touchstartEvent(event: TouchEvent, ctx: CanvasRenderingContext2D){
  event.preventDefault();

  const touch = event.touches[0];
  const rect = ctx.canvas.getBoundingClientRect();
  const x = Math.floor((touch.clientX - rect.left) / canvasConfig.pencilContext.pixelSize);
  const y = Math.floor((touch.clientY - rect.top) / canvasConfig.pencilContext.pixelSize);

  if (canvasConfig.modes.fill) {
    const dpr = window.devicePixelRatio || 1;
    const canvasX = Math.floor((touch.clientX - rect.left) * dpr);
    const canvasY = Math.floor((touch.clientY - rect.top) * dpr);
    floodFill(ctx, canvasX, canvasY, canvasConfig.pencilContext.colour);
  } else if (canvasConfig.modes.erase) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    drawPixel(x, y, ctx, canvasConfig.pencilContext.pixelSize);
  } else if (canvasConfig.modes.draw) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    drawPixel(x, y, ctx, canvasConfig.pencilContext.pixelSize);
  }
}

function touchmoveEvent(event: TouchEvent, ctx: CanvasRenderingContext2D){
  event.preventDefault();

  if (!isDrawing) return;

  const touch = event.touches[0];
  const rect = ctx.canvas.getBoundingClientRect();
  const x = Math.floor((touch.clientX - rect.left) / canvasConfig.pencilContext.pixelSize);
  const y = Math.floor((touch.clientY - rect.top) / canvasConfig.pencilContext.pixelSize);

  drawLine(lastX, lastY, x, y, ctx, canvasConfig.pencilContext.pixelSize);
  lastX = x;
  lastY = y;
};


function getCanvasContext() {
  if (!canvasConfig.canvasContext) throw new Error("Canvas not supported");
  return canvasConfig.canvasContext;
}
export const drawPage: PageRenderer = ({ app }) => {
  const prompt = sig<string>("Loading...");

  const colourButtons: ColourButtonConfig[] = [
    {colour: "rgb(255, 0, 0)"},
    {colour: "rgb(0, 0, 255)"},
    {colour: "rgb(0, 128, 0)"},
    {colour: "rgb(255, 255, 0)"},
    {colour: "rgb(255, 166, 0)"},
    {colour: "rgb(128, 0, 128)"},
    {colour: "rgb(255, 192, 203)"},
    {colour: "rgb(0, 0, 0)", initiallyActive: true},
  ];

  const toolButtons: ToolButtonConfig[] = [
    {
      imagePath: fillToolIcon,
      altText: "fill tool",
      clickFunc: (event: Event) => {
        toggleToolButtonActive(event.target as HTMLButtonElement)
        canvasConfig.modes = {
          ...canvasConfig.modes,
          fill: true,
          erase: false,
        };
      }
    },
    {
      imagePath: eraserToolIcon,
      altText: "eraser tool",
      clickFunc : (event: Event) => {
        toggleToolButtonActive(event.target as HTMLButtonElement)
        canvasConfig.modes = {
          ...canvasConfig.modes,
          erase: true,
          fill: false,
          draw: false,
        };
          getCanvasContext().fillStyle = "white";
      }
    },
    {
      imagePath: pecilToolIcon,
      altText: "draw tool",
      initiallyActive: true,
      clickFunc: (event: Event) => {
        toggleToolButtonActive(event.target as HTMLButtonElement)
        canvasConfig.modes = {
          ...canvasConfig.modes,
          erase: false,
          fill: false,
          draw: true,
        };
          getCanvasContext().fillStyle = canvasConfig.pencilContext.colour;
      }
    },
    {
      imagePath: trashIcon,
      altText: "clear tool",
      clickFunc: () => {
        const canvasCtx = getCanvasContext()
          canvasCtx.fillStyle = "#ffffff";
          canvasCtx.fillRect(
            0,
            0,
            canvasCtx.canvas.width,
            canvasCtx.canvas.height
          );

          if(!canvasConfig.modes.erase) canvasCtx.fillStyle = canvasConfig.pencilContext.colour
      }
    },
  ];

  sseHandler?.addEventListener("before_lobby_update", async (e) => {
    const lobby: WithClient<Lobby> = JSON.parse(e.data);
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;  
    console.log("BEFORE_LOBBY_UPDATE_DATA", lobby)
    console.log("PHASE PLAYER ASSIGNMENTS:", lobby.phasePlayerAssignments)
    const uploadedImage = await uploadCanvasImage(canvas, lobby.phasePlayerAssignments[0].chain.id, lobby.players[lobby.clientIndex].id);
    console.log("PROMPT IMAGE:", uploadedImage);
  });

  sseHandler?.addEventListener("after_lobby_update", async (e) => {
    console.log("RAW PROMPT THING", e.data)
    const lobby: WithClient<Lobby> = JSON.parse(e.data);
    const promptForPlayer = await getPromptForPLayer(lobby.phasePlayerAssignments[0].chain.id);
    
    prompt(promptForPlayer.text);
    
    console.log("PROMPT FOR PLAYER:", promptForPlayer.text);
  });

  isolateContainer("app");

  return parseInto(app, {
    "|section.draw-page": {
      "|div.draw-page-header-ctn": {
        "|div.draw-page-title-timer-ctn": {
          "|h2.large-heading.draw-page-title": { _: "Garlic Phone", },
          ...timer(30)
        },
        "|img.draw-page-logo": {
          "@": { src: garlicPhoneLogo, alt: "Garlic Phone Logo", },
        },
      },
      "|div.draw-page-prompt-ctn": {
        "|p": { _: "Draw:" },
        "|h3.medium-heading": { _: prompt },
      },
      "|div.draw-page-controls": {
        ...forEl(colourButtons, (_, v) => generateCanvasColourButton(v)),
      },
      "|div": {
        "|canvas.canvas#canvas": {
          "%mousedown": (event) => {
            mousedownEvent(event as MouseEvent, getCanvasContext());
          },
          "%mousemove": (event) => {
            mousemoveEvent(event as MouseEvent, getCanvasContext())
          },
          "%mouseup": () => {isDrawing = false},
          "%mouseleave": () => {isDrawing = false},
          "%touchstart": (event) => {touchstartEvent(event as TouchEvent, getCanvasContext())},
          "%touchmove": (event) => {touchmoveEvent(event as TouchEvent, getCanvasContext())},
          "%touchend": () => {isDrawing = false}
        },
      },
      "|div.draw-page-controls#toolControls": {
        ...forEl(toolButtons, (_, v) => generateCanvasToolButton(v)),
        "|div.pixel-slider-ctn": {
          "|input.pixel-slider": {
            "@": {
              name: "pixel slider",
              type: "range",
              min: "3",
              max: "100",
              value: "10",
            },
          },
          "%input": (event: Event) => {
            const inputEvent = event.target as HTMLInputElement
            const newSize = parseInt(inputEvent.value, 10)
            canvasConfig.pencilContext = {...canvasConfig.pencilContext, pixelSize: newSize}

            const pixelSizeLabel = document.getElementById("pixelSliderLabel");
              if(pixelSizeLabel) pixelSizeLabel.textContent = `${newSize}px`
          },
          "|label.pixel-slider-value#pixelSliderLabel": {
            _: `${canvasConfig.pencilContext.pixelSize}px`,
            "@": {
              for: "pixel slider",
            },
          },
        },
      },
    },
  });
};

window.addEventListener("resize", () => {
  resizeCanvasToDisplaySize(getCanvasContext())
});

async function getPromptForPLayer(chainId: number) {
  const latestPromptForChain = await apiFetch("GET", `/api/prompts/chain/${chainId}/latest`, undefined);
  const data = await latestPromptForChain.json();
  return data;
}

async function uploadCanvasImage(canvas: HTMLCanvasElement, chainId: number, userId: string) {
  // Convert canvas to Blob (PNG format)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

  if (!blob) {
    throw new Error('Failed to convert canvas to PNG blob');
  }

  const response = await apiFetch(
    "post",
    `/api/chain/${chainId}/latest-image?userId=${userId}`,
    blob,
    { 'Content-Type': 'image/png' }
);

  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(`Upload failed: ${JSON.stringify(errorDetails)}`);
  }

  const result = await response.json();
  return result; // image object returned from your API
}

// sseHandler?.addEventListener("lobby_update", async (e) => {
//   // const x = canvasConfig.canvasContext
//   (document.getElementById("canvas") as HTMLCanvasElement).toBlob(() => {
//   });
//   // const data: WithClient<Lobby> = JSON.parse(e.data);
//   // if (gameCode != "") { refreshLobbyState(gameCode, players); }
// });

// Initial calls

const observer = new MutationObserver((mutations, obs) => {
  const colourButtons = document.querySelectorAll<HTMLButtonElement>(".colour-button")
  const toolButtons = document.querySelectorAll<HTMLButtonElement>(".canvas-button")
  const element = document.getElementById("canvas") as HTMLCanvasElement;
  if (element && colourButtons.length > 0 && toolButtons.length > 0) {
    //setting canvas context
    canvasConfig.canvasContext = element.getContext('2d', { willReadFrequently: true })
    resizeCanvasToDisplaySize(getCanvasContext())

    //setting active colour button
    colourButtons.forEach((button) => {
      if (button.classList.contains("colour-button-active")) {
        activeColourButton = button;
      }
    });

    //setting active tool button
    toolButtons.forEach((button) => {
      if (button.classList.contains("canvas-button-active")) {
        activeToolButton = button;
      }
    });

    obs.disconnect();
  }
});
observer.observe(document.body, {
  childList: true,
  subtree: true
});
