import { sig } from "../../../lib/signal";
import { apiFetch, apiFetchRawBody } from "../lib/fetch";
import { forEl, parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { timer } from "../lib/timer";
import { drawLine, paint, floodFill } from "../lib/util/canvasUtils";
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

type ToolButtonConfig = {
  imagePath: string;
  altText: string;
  initiallyActive?: boolean;
  clickFunc: Function;
};
type ColourButtonConfig = { colour: string; initiallyActive?: boolean };

const canvasConfig: CanvasConfig = {
  pencilContext: {
    pixelSize: 1,
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

function generateCanvasColourButton(
  colourButton: ColourButtonConfig
): ElemTree {
  return {
    [`|button.colour-button${
      colourButton.initiallyActive ? ".colour-button-active" : ""
    }`]: {
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
    [`|button.canvas-button${
      button.initiallyActive ? ".canvas-button-active" : ""
    }`]: {
      "|img.inner-button-img": {
        "@": {
          src: button.imagePath,
          alt: button.altText,
        },
      },
      "%click": (event: Event) => {
        button.clickFunc(event);
      },
    },
  };
}

function getXYS(event: MouseEvent): [number, number, number] {
  const { clientWidth: cw, clientHeight: ch } = canvasConfig.canvasContext?.canvas!;
  const { width: pw, height: ph } = canvasConfig.canvasContext?.canvas!;

  const x = Math.floor(pw * event.offsetX / cw);
  const y = Math.floor(ph * event.offsetY / ch);
  const size = Math.floor(canvasConfig.pencilContext.pixelSize);

  return [x, y, size];
}

function mousedownEvent(event: MouseEvent, ctx: CanvasRenderingContext2D) {
  const [x, y, size] = getXYS(event);

  if (canvasConfig.modes.fill) {
    const rect = getCanvasContext().canvas.getBoundingClientRect();
    const scaleX = getCanvasContext().canvas.width / rect.width;
    const scaleY = getCanvasContext().canvas.height / rect.height;

    const canvasX = Math.floor((event.clientX - rect.left) * scaleX);
    const canvasY = Math.floor((event.clientY - rect.top) * scaleY);

    floodFill(ctx, x, y, canvasConfig.pencilContext.colour);
  } else if (canvasConfig.modes.erase) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    paint(x, y, size, ctx);
  } else if (canvasConfig.modes.draw) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    paint(x, y, size, ctx);
  }
}

function mousemoveEvent(event: MouseEvent, ctx: CanvasRenderingContext2D) {
  if (!isDrawing) return;
  const [x, y, size] = getXYS(event);

  drawLine(lastX, lastY, x, y, ctx, size);
  lastX = x;
  lastY = y;
}

function touchstartEvent(event: TouchEvent, ctx: CanvasRenderingContext2D) {
  event.preventDefault();

  const touch = event.touches[0];
  const rect = ctx.canvas.getBoundingClientRect();
  const x = Math.floor(
    (touch.clientX - rect.left) / canvasConfig.pencilContext.pixelSize
  );
  const y = Math.floor(
    (touch.clientY - rect.top) / canvasConfig.pencilContext.pixelSize
  );

  if (canvasConfig.modes.fill) {
    const dpr = window.devicePixelRatio || 1;
    const canvasX = Math.floor((touch.clientX - rect.left) * dpr);
    const canvasY = Math.floor((touch.clientY - rect.top) * dpr);
    floodFill(ctx, canvasX, canvasY, canvasConfig.pencilContext.colour);
  } else if (canvasConfig.modes.erase) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    paint(x, y, canvasConfig.pencilContext.pixelSize, ctx);
  } else if (canvasConfig.modes.draw) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    paint(x, y, canvasConfig.pencilContext.pixelSize, ctx);
  }
}

function touchmoveEvent(event: TouchEvent, ctx: CanvasRenderingContext2D) {
  event.preventDefault();

  if (!isDrawing) return;

  const touch = event.touches[0];
  const rect = ctx.canvas.getBoundingClientRect();
  const x = Math.floor(
    (touch.clientX - rect.left) / canvasConfig.pencilContext.pixelSize
  );
  const y = Math.floor(
    (touch.clientY - rect.top) / canvasConfig.pencilContext.pixelSize
  );

  drawLine(lastX, lastY, x, y, ctx, canvasConfig.pencilContext.pixelSize);
  lastX = x;
  lastY = y;
}

function getCanvasContext() {
  if (!canvasConfig.canvasContext) throw new Error("Canvas not supported");
  return canvasConfig.canvasContext;
}

export const drawPage: PageRenderer = ({ app }) => {
  const prompt = sig<string>("Loading...");

  const colourButtons: ColourButtonConfig[] = [
    { colour: "rgb(255, 0, 0)" },
    { colour: "rgb(0, 0, 255)" },
    { colour: "rgb(0, 128, 0)" },
    { colour: "rgb(255, 255, 0)" },
    { colour: "rgb(255, 166, 0)" },
    { colour: "rgb(128, 0, 128)" },
    { colour: "rgb(255, 192, 203)" },
    { colour: "rgb(0, 0, 0)", initiallyActive: true },
  ];

  const toolButtons: ToolButtonConfig[] = [
    {
      imagePath: fillToolIcon,
      altText: "fill tool",
      clickFunc: (event: Event) => {
        toggleToolButtonActive(event.target as HTMLButtonElement);
        canvasConfig.modes = {
          ...canvasConfig.modes,
          fill: true,
          erase: false,
        };
      },
    },
    {
      imagePath: eraserToolIcon,
      altText: "eraser tool",
      clickFunc: (event: Event) => {
        toggleToolButtonActive(event.target as HTMLButtonElement);
        canvasConfig.modes = {
          ...canvasConfig.modes,
          erase: true,
          fill: false,
          draw: false,
        };
        getCanvasContext().fillStyle = "white";
      },
    },
    {
      imagePath: pecilToolIcon,
      altText: "draw tool",
      initiallyActive: true,
      clickFunc: (event: Event) => {
        toggleToolButtonActive(event.target as HTMLButtonElement);
        canvasConfig.modes = {
          ...canvasConfig.modes,
          erase: false,
          fill: false,
          draw: true,
        };
        getCanvasContext().fillStyle = canvasConfig.pencilContext.colour;
      },
    },
    {
      imagePath: trashIcon,
      altText: "clear tool",
      clickFunc: () => {
        const canvasCtx = getCanvasContext();
        canvasCtx.fillStyle = "#ffffff";
        canvasCtx.fillRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
 
        if (!canvasConfig.modes.erase)
          canvasCtx.fillStyle = canvasConfig.pencilContext.colour;
      },
    },
  ];

  sseHandler?.addEventListener("before_lobby_update", async (e) => {
    const lobby: WithClient<Lobby> = JSON.parse(e.data);
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;  
    const uploadedImage = await uploadCanvasImage(canvas, lobby.phasePlayerAssignments[0].chain.id, lobby.players[lobby.clientIndex].id);
  });

  sseHandler?.addEventListener("after_lobby_update", async (e) => {
    const lobby: WithClient<Lobby> = JSON.parse(e.data);
    const promptForPlayer = await getPromptForPLayer(lobby.phasePlayerAssignments[0].chain.id);
    prompt(promptForPlayer.text);
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
          "@": { src: garlicPhoneLogo, alt: "Garlic Phone Logo" },
        },
      },
      "|div.draw-page-prompt-ctn": {
        "|p": { _: "Draw:" },
        "|h3.medium-heading": { _: prompt },
      },
      "|div.draw-page-controls": {
        ...forEl(colourButtons, (_, v) => generateCanvasColourButton(v)),
      },
      "|div.canvas-container": {
        "|div.canvas-wrapper": {
          "|canvas.canvas#canvas": {
            "%mousedown": (event) => {
              mousedownEvent(event as MouseEvent, getCanvasContext());
            },
            "%mousemove": (event) => {
              mousemoveEvent(event as MouseEvent, getCanvasContext());
            },
            "%mouseup": () => {
              isDrawing = false;
            },
            "%mouseleave": () => {
              isDrawing = false;
            },
            "%touchstart": (event) => {
              touchstartEvent(event as TouchEvent, getCanvasContext());
            },
            "%touchmove": (event) => {
              touchmoveEvent(event as TouchEvent, getCanvasContext());
            },
            "%touchend": () => {
              isDrawing = false;
            },
            "@": { width: "64", height: "64" }
          },
        },
      },
      "|div.draw-page-controls#toolControls": {
        ...forEl(toolButtons, (_, v) => generateCanvasToolButton(v)),
        "|div.pixel-slider-ctn": {
          "|input.pixel-slider": {
            "@": {
              name: "pixel slider",
              type: "range",
              min: "1",
              max: "5",
              value: "1",
            },
          },
          "%input": (event: Event) => {
            const inputEvent = event.target as HTMLInputElement;
            const newSize = parseInt(inputEvent.value, 10);

            canvasConfig.pencilContext = {
              ...canvasConfig.pencilContext,
              pixelSize: newSize,
            };

            const pixelSizeLabel = document.getElementById("pixelSliderLabel");
            if (pixelSizeLabel) pixelSizeLabel.textContent = `${newSize}px`;
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

async function getPromptForPLayer(chainId: number) {
  const latestPromptForChain = await apiFetch("GET", `/api/prompts/chain/${chainId}/latest`, undefined);
  const data = await latestPromptForChain.json();
  return data;
}

function dataURLtoBlob(dataURL: any) {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

async function uploadCanvasImage(canvas: HTMLCanvasElement, chainId: number, userId: string) {

  const imageData = canvas.toDataURL('image/png');
  const blob = dataURLtoBlob(imageData);

  if (!blob) {
    throw new Error("Failed to convert canvas to PNG blob");
  }

  const response = await apiFetchRawBody(
    "post",
    `/api/chain/${chainId}/latest-image?userId=${userId}`,
    blob,
    { "Content-Type": "image/png" }
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
  const colourButtons =
    document.querySelectorAll<HTMLButtonElement>(".colour-button");
  const toolButtons =
    document.querySelectorAll<HTMLButtonElement>(".canvas-button");
  const element = document.getElementById("canvas") as HTMLCanvasElement;
  if (element && colourButtons.length > 0 && toolButtons.length > 0) {
    //setting canvas context
    canvasConfig.canvasContext = element.getContext("2d", {
      willReadFrequently: true,
    });

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
  subtree: true,
});
