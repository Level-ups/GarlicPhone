import { canvasConfig } from "./canvasConfig.js"


const colourButtons = document.querySelectorAll<HTMLButtonElement>(".colour-button")

function updateCanvasColour(colourButton: HTMLButtonElement){
    if(!canvasConfig.canvasContext){
        return;
    }
    canvasConfig.canvasContext.fillStyle = colourButton.style.backgroundColor
}

colourButtons.forEach((button) => {
    button.addEventListener('click', () => {
        updateCanvasColour(button)
        console.log(canvasConfig.colour);
        
        
    })
})
 