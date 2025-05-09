import { canvasConfig } from "./canvasConfig.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { willReadFrequently: true });


if (!ctx) throw new Error("Canvas not supported");

canvasConfig.canvasContext = ctx;

let isDrawing = false;
let lastX = 0;
let lastY = 0;


canvasConfig.canvasContext.fillStyle = canvasConfig.pencilContext.colour;


// Initial call
resizeCanvasToDisplaySize(ctx);

// Helper functions
function drawPixel(x: number, y: number, ctx: CanvasRenderingContext2D) {
  ctx.fillRect(x * canvasConfig.pencilContext.pixelSize, y * canvasConfig.pencilContext.pixelSize, canvasConfig.pencilContext.pixelSize, canvasConfig.pencilContext.pixelSize);
}

function resizeCanvasToDisplaySize(ctx: CanvasRenderingContext2D) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  if (ctx) ctx.scale(dpr, dpr);
}

function drawLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  ctx: CanvasRenderingContext2D
) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    drawPixel(x0, y0, ctx);

    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
) {
  const fillColor = cssColorToRgba(); // get current ctx.fillStyle as [r, g, b, a]
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const stack: [number, number][] = [[startX, startY]];

  const pixelIndex = (x: number, y: number) => (y * canvasWidth + x) * 4;

  const startIdx = pixelIndex(startX, startY);
  const targetColor: [number, number, number, number] = [
    data[startIdx],
    data[startIdx + 1],
    data[startIdx + 2],
    data[startIdx + 3],
  ];

  // If the target color is already the fill color, skip
  if (targetColor.every((v, i) => v === fillColor[i])) {
    return; // Nothing to fill
  }

  while (stack.length) {
    const [x, y] = stack.pop()!;
    const idx = pixelIndex(x, y);

    // Check if current pixel matches the target color
    if (
      data[idx] === targetColor[0] &&
      data[idx + 1] === targetColor[1] &&
      data[idx + 2] === targetColor[2] &&
      data[idx + 3] === targetColor[3]
    ) {
      // Set new color
      data[idx] = fillColor[0];
      data[idx + 1] = fillColor[1];
      data[idx + 2] = fillColor[2];
      data[idx + 3] = fillColor[3];

      // Add neighbors to stack
      if (x > 0) stack.push([x - 1, y]);
      if (x < canvasWidth - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < canvasHeight - 1) stack.push([x, y + 1]);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}


function cssColorToRgba(): [number, number, number, number] {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = tempCanvas.height = 1;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.fillStyle = canvasConfig.pencilContext.colour;
  tempCtx.fillRect(0, 0, 1, 1);
  const pixel = tempCtx.getImageData(0, 0, 1, 1).data;
  return [pixel[0], pixel[1], pixel[2], pixel[3]];
}

// Events
window.addEventListener("resize", () => {
  resizeCanvasToDisplaySize(ctx)
});

canvas.addEventListener("mousedown", (event: MouseEvent) => {
  const x = Math.floor(event.offsetX / canvasConfig.pencilContext.pixelSize);
  const y = Math.floor(event.offsetY / canvasConfig.pencilContext.pixelSize);

  if (canvasConfig.modes.fill) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvasX = Math.floor((event.clientX - rect.left) * dpr);
    const canvasY = Math.floor((event.clientY - rect.top) * dpr);
    floodFill(ctx, canvasX, canvasY);
  } else if(canvasConfig.modes.erase){
    isDrawing = true;
    lastX = x;
    lastY = y;
    drawPixel(x, y, ctx);
  } else if(canvasConfig.modes.draw) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    drawPixel(x, y, ctx);
  }
});
canvas.addEventListener("mousemove", (event: MouseEvent) => {
  if (!isDrawing) return;
  const x = Math.floor(event.offsetX / canvasConfig.pencilContext.pixelSize);
  const y = Math.floor(event.offsetY / canvasConfig.pencilContext.pixelSize);
  drawLine(lastX, lastY, x, y, ctx);
  lastX = x;
  lastY = y;
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

// TOUCH EVENTS
canvas.addEventListener("touchstart", (event: TouchEvent) => {
  event.preventDefault(); // prevent scrolling

  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((touch.clientX - rect.left) / canvasConfig.pencilContext.pixelSize);
  const y = Math.floor((touch.clientY - rect.top) / canvasConfig.pencilContext.pixelSize);

  if (canvasConfig.modes.fill) {
    const dpr = window.devicePixelRatio || 1;
    const canvasX = Math.floor((touch.clientX - rect.left) * dpr);
    const canvasY = Math.floor((touch.clientY - rect.top) * dpr);
    floodFill(ctx, canvasX, canvasY);
  } else if (canvasConfig.modes.erase) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    drawPixel(x, y, ctx);
  } else if (canvasConfig.modes.draw) {
    isDrawing = true;
    lastX = x;
    lastY = y;
    drawPixel(x, y, ctx);
  }
});

canvas.addEventListener("touchmove", (event: TouchEvent) => {
  event.preventDefault(); // prevent scrolling

  if (!isDrawing) return;

  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((touch.clientX - rect.left) / canvasConfig.pencilContext.pixelSize);
  const y = Math.floor((touch.clientY - rect.top) / canvasConfig.pencilContext.pixelSize);

  drawLine(lastX, lastY, x, y, ctx);
  lastX = x;
  lastY = y;
});

canvas.addEventListener("touchend", () => {
  isDrawing = false;
});

