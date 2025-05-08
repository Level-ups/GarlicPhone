type CanvasModes =  {
    fill: boolean,
    erase: boolean,
    draw: boolean
}

type PencilContext = {
    pixelSize: number,
    colour: string
}

type CanvasConfig = {
    pencilContext : PencilContext
    canvasContext ?: CanvasRenderingContext2D,
    modes: CanvasModes
}

export const canvasConfig : CanvasConfig = {
    pencilContext: {
        pixelSize: 10,
        colour: "black"
    },
    canvasContext: undefined,
    modes: {
        fill: false,
        erase: false,
        draw: true
    }
} 


console.log('canvasConfig loaded');