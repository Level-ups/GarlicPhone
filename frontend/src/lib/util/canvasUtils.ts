export function drawPixel(x: number, y: number, ctx: CanvasRenderingContext2D, pixelSize: number) {
    ctx.fillRect(
      x,
      y,
      1,
      1
    );
  }
  
  export function resizeCanvasToDisplaySize(ctx: CanvasRenderingContext2D) {
    
    const dpr = window.devicePixelRatio || 1;
    const width = ctx.canvas.clientWidth;
    const height = ctx.canvas.clientHeight;
  
    ctx.canvas.width = 64;
    ctx.canvas.height = 64;
  
    if (ctx) ctx.scale(dpr, dpr);
  }
  
  export function drawLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    ctx: CanvasRenderingContext2D,
    pixelSize: number
  ) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
  
    while (true) {
      drawPixel(x0, y0, ctx, pixelSize);
  
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
  
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  currentColour: string
) {
  const fillColor = cssColorToRgba(currentColour); // [r, g, b, a]
  const { width: canvasWidth, height: canvasHeight } = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const pixelIndex = (x: number, y: number) => (y * canvasWidth + x) * 4;

  const startIdx = pixelIndex(startX, startY);
  const targetColor: [number, number, number, number] = [
    data[startIdx],
    data[startIdx + 1],
    data[startIdx + 2],
    data[startIdx + 3],
  ];

  if (targetColor.every((v, i) => v === fillColor[i])) {
    return; // No-op
  }

  const stack: [number, number][] = [[startX, startY]];

  while (stack.length) {
    const [x, y] = stack.pop()!;
    const idx = pixelIndex(x, y);

    if (
      data[idx] === targetColor[0] &&
      data[idx + 1] === targetColor[1] &&
      data[idx + 2] === targetColor[2] &&
      data[idx + 3] === targetColor[3]
    ) {
      // Fill pixel
      data[idx] = fillColor[0];
      data[idx + 1] = fillColor[1];
      data[idx + 2] = fillColor[2];
      data[idx + 3] = fillColor[3];

      // Queue neighbors
      if (x > 0) stack.push([x - 1, y]);
      if (x < canvasWidth - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < canvasHeight - 1) stack.push([x, y + 1]);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

  
  export function cssColorToRgba(currentColour: string): [number, number, number, number] {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.fillStyle = currentColour;
    tempCtx.fillRect(0, 0, 1, 1);
    const pixel = tempCtx.getImageData(0, 0, 1, 1).data;
    return [pixel[0], pixel[1], pixel[2], pixel[3]];
  }