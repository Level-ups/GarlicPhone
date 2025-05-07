import { canvasConfig } from "./canvasConfig.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (!ctx) throw new Error("Canvas not supported");

canvasConfig.canvasContext = ctx;

let isDrawing = false;
let lastX = 0;
let lastY = 0;


canvasConfig.canvasContext.fillStyle = canvasConfig.colour;

canvas.addEventListener("mousedown", (event: MouseEvent) => {
  isDrawing = true;
  const x = Math.floor(event.offsetX / PIXEL_SIZE);
  const y = Math.floor(event.offsetY / PIXEL_SIZE);
  lastX = x;
  lastY = y;
  drawPixel(x, y, ctx);
});
const PIXEL_SIZE = 10;
canvas.addEventListener("mousemove", (event: MouseEvent) => {
  if (!isDrawing) return;
  const x = Math.floor(event.offsetX / PIXEL_SIZE);
  const y = Math.floor(event.offsetY / PIXEL_SIZE);
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

function drawPixel(x: number, y: number, ctx: CanvasRenderingContext2D) {
  ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
}

function resizeCanvasToDisplaySize(ctx: CanvasRenderingContext2D) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  if (ctx) ctx.scale(dpr, dpr);
}

// Initial call
resizeCanvasToDisplaySize(ctx);

// On resize
window.addEventListener("resize", () => {
  resizeCanvasToDisplaySize(ctx)
});

// Bresenham’s line algorithm for pixel art style
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
// const template = document.createElement('template');
// class GarlicCanvas extends HTMLElement{
//   constructor(){
//     super();
//     const shadow = this.attachShadow({mode: 'open'})
//     shadow.appendChild(template.content.cloneNode(true))
//   }
// }

// customElements.define('garlic-canvas', GarlicCanvas)
