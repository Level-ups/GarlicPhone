export type ColourButtonConfig = { colour: string; initiallyActive?: boolean };

type Palette = ColourButtonConfig[];

type PaletteName = "default" | "soft_spring" | "pastel_pop" | "gentle_garden" | "candy_cloud" | "dreamy_dusk";
export const PALETTES: { [key in PaletteName]: Palette } = {
    "default": [
        { colour: "rgb(255, 0, 0)" },
        { colour: "rgb(0, 0, 255)" },
        { colour: "rgb(0, 128, 0)" },
        { colour: "rgb(255, 255, 0)" },
        { colour: "rgb(255, 166, 0)" },
        { colour: "rgb(128, 0, 128)" },
        { colour: "rgb(255, 192, 203)" },
        { colour: "rgb(0, 0, 0)", initiallyActive: true },
    ],

    "soft_spring": [
        { colour: "rgb(255, 182, 193)" }, // light pink
        { colour: "rgb(173, 216, 230)" }, // light blue
        { colour: "rgb(144, 238, 144)" }, // light green
        { colour: "rgb(255, 255, 224)" }, // light yellow
        { colour: "rgb(255, 218, 185)" }, // peach
        { colour: "rgb(221, 160, 221)" }, // plum
        { colour: "rgb(255, 240, 245)" }, // lavender blush
        { colour: "rgb(105, 105, 105)", initiallyActive: true }, // dim gray
    ],

    "pastel_pop": [
        { colour: "rgb(255, 204, 204)" }, // pastel red
        { colour: "rgb(204, 229, 255)" }, // pastel blue
        { colour: "rgb(204, 255, 229)" }, // mint
        { colour: "rgb(255, 255, 204)" }, // butter
        { colour: "rgb(255, 221, 178)" }, // pastel orange
        { colour: "rgb(230, 204, 255)" }, // pastel purple
        { colour: "rgb(255, 230, 240)" }, // baby pink
        { colour: "rgb(80, 80, 80)", initiallyActive: true },   // dark pastel gray
    ],

    "gentle_garden": [
        { colour: "rgb(250, 200, 200)" },
        { colour: "rgb(190, 210, 250)" },
        { colour: "rgb(200, 240, 200)" },
        { colour: "rgb(255, 250, 200)" },
        { colour: "rgb(255, 210, 170)" },
        { colour: "rgb(220, 190, 250)" },
        { colour: "rgb(255, 220, 230)" },
        { colour: "rgb(120, 120, 120)", initiallyActive: true },
    ],

    "candy_cloud": [
        { colour: "rgb(255, 153, 153)" },
        { colour: "rgb(153, 204, 255)" },
        { colour: "rgb(153, 255, 204)" },
        { colour: "rgb(255, 255, 153)" },
        { colour: "rgb(255, 204, 153)" },
        { colour: "rgb(204, 153, 255)" },
        { colour: "rgb(255, 204, 229)" },
        { colour: "rgb(90, 90, 90)", initiallyActive: true },
    ],

    "dreamy_dusk": [
        { colour: "rgb(255, 192, 203)" },
        { colour: "rgb(176, 224, 230)" },
        { colour: "rgb(152, 251, 152)" },
        { colour: "rgb(255, 250, 205)" },
        { colour: "rgb(250, 214, 165)" },
        { colour: "rgb(216, 191, 216)" },
        { colour: "rgb(255, 228, 225)" },
        { colour: "rgb(60, 60, 60)", initiallyActive: true },
    ],
}
