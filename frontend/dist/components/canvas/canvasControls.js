import { canvasConfig } from "./canvasConfig.js";
const colourButtons = document.querySelectorAll(".colour-button");
const toolButtons = document.querySelectorAll(".canvas-button");
function updateCanvasColour(colourButton) {
    if (!canvasConfig.canvasContext) {
        return;
    }
    if (canvasConfig.modes.erase) {
        canvasConfig.pencilContext.colour = colourButton.style.backgroundColor;
    }
    else {
        canvasConfig.canvasContext.fillStyle = canvasConfig.pencilContext.colour =
            colourButton.style.backgroundColor;
    }
}
let activeColourButton = null;
colourButtons.forEach((button) => {
    if (button.classList.contains("colour-button-active")) {
        activeColourButton = button;
    }
});
colourButtons.forEach((button) => {
    button.addEventListener("click", () => {
        toggleColourButtonActive(button);
        updateCanvasColour(button);
    });
});
let activeToolButton = null;
toolButtons.forEach((button) => {
    if (button.classList.contains("canvas-button-active")) {
        activeToolButton = button;
    }
});
toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
        toggleToolButtonActive(button);
    });
});
function toggleToolButtonActive(button) {
    if (button.id !== "clearButton") {
        activeToolButton?.classList.remove("canvas-button-active");
        button.classList.add("canvas-button-active");
        activeToolButton = button;
    }
}
function toggleColourButtonActive(button) {
    activeColourButton?.classList.remove("colour-button-active");
    button.classList.add("colour-button-active");
    activeColourButton = button;
}
const fillButton = document.getElementById("fillButton");
fillButton?.addEventListener("click", () => {
    canvasConfig.modes = {
        ...canvasConfig.modes,
        fill: true,
        erase: false,
    };
});
const eraserButton = document.getElementById("eraserButton");
eraserButton?.addEventListener("click", () => {
    canvasConfig.modes = {
        ...canvasConfig.modes,
        erase: true,
        fill: false,
        draw: false,
    };
    if (canvasConfig.canvasContext) {
        canvasConfig.canvasContext.fillStyle = "white";
    }
});
const drawButton = document.getElementById("drawButton");
drawButton?.addEventListener("click", () => {
    canvasConfig.modes = {
        ...canvasConfig.modes,
        erase: false,
        fill: false,
        draw: true,
    };
    if (canvasConfig.canvasContext) {
        canvasConfig.canvasContext.fillStyle = canvasConfig.pencilContext.colour;
    }
});
const clearButton = document.getElementById("clearButton");
clearButton?.addEventListener("click", () => {
    if (canvasConfig.canvasContext) {
        canvasConfig.canvasContext.fillStyle = "#ffffff";
        canvasConfig.canvasContext.fillRect(0, 0, canvasConfig.canvasContext.canvas.width, canvasConfig.canvasContext.canvas.height);
        canvasConfig.canvasContext.fillStyle = canvasConfig.pencilContext.colour;
    }
});
const pixelSlider = document.getElementById("pixelSliderInput");
const pixelSizeLabel = document.getElementById("pixelSliderLabel");
pixelSlider?.addEventListener('input', () => {
    const newSize = parseInt(pixelSlider.value, 10);
    canvasConfig.pencilContext = { ...canvasConfig.pencilContext, pixelSize: newSize };
    if (pixelSizeLabel)
        pixelSizeLabel.textContent = `${newSize}px`;
});
