import { canvasConfig } from "./canvasConfig.js";
const colourButtons = document.querySelectorAll(".colour-button");
function updateCanvasColour(colourButton) {
    if (!canvasConfig.canvasContext) {
        return;
    }
    canvasConfig.canvasContext.fillStyle = colourButton.style.backgroundColor;
}
colourButtons.forEach((button) => {
    button.addEventListener('click', () => {
        updateCanvasColour(button);
        console.log(canvasConfig.colour);
    });
});
