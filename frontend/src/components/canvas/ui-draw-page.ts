import { parse, parseInto } from "../../lib/parse";

export const drawPage = (par: HTMLElement) => {
  function generateCanvasColourButton(colour: string) {
    return {
      "|button.colour-button": {
        $: {
          backgroundColor: "colour",
        },
        "|img.inner-button-img": {
          "@": {
            src: "./public/assets/canvas/tick-svgrepo-com.svg",
            alt: "Colour button",
          },
        },
      },
    };
  }

  return parseInto(par, {
    "|section.draw-page": {
      "|div.draw-page-header-ctn": {
        "|div.draw-page-title-timer-ctn": {
          "|h2.large-heading.draw-page-title": {
            _: "Garlic Phone",
          },
          "|p.draw-page-timer": {
            _: "00:00",
          },
        },
        "|img.draw-page-logo": {
          "@": {
            src: "./public/assets/logo.svg",
            alt: "Garlic Phone Logo",
          },
        },
        "|div.draw-page-prompt-ctn": {
          "|p": {
            _: "Draw:",
          },
          "|h3.medium-heading": {
            _: "Clown with pie on his face",
          },
        },
        "|div.draw-page-controls": {
          "|button.colour-button": {
            $: {
              backgroundColor: "rgb(255, 0, 0)",
            },
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/tick-svgrepo-com.svg",
                alt: "Colour button",
              },
            },
          },
          "|button.colour-button": {
            $: {
              backgroundColor: "rgb(0, 0, 255)",
            },
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/tick-svgrepo-com.svg",
                alt: "Colour button",
              },
            },
          },
          "|button.colour-button": {
            $: {
              backgroundColor: "rgb(0, 128, 0)",
            },
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/tick-svgrepo-com.svg",
                alt: "Colour button",
              },
            },
          },
          "|button.colour-button": {
            $: {
              backgroundColor: "rgb(255, 255, 0)",
            },
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/tick-svgrepo-com.svg",
                alt: "Colour button",
              },
            },
          },
          "|button.colour-button": {
            $: {
              backgroundColor: "rgb(255, 166, 0)",
            },
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/tick-svgrepo-com.svg",
                alt: "Colour button",
              },
            },
          },
          "|button.colour-button": {
            $: {
              backgroundColor: "rgb(128, 0, 128)",
            },
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/tick-svgrepo-com.svg",
                alt: "Colour button",
              },
            },
          },
          "|button.colour-button": {
            $: {
              backgroundColor: "rgb(255, 192, 203)",
            },
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/tick-svgrepo-com.svg",
                alt: "Colour button",
              },
            },
          },
        },
        "|div": {
          "|canvas.canvas": {},
        },
        "|div.draw-page-controls": {
          "|button.canvas-button#fillButton": {
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/fill-solid-svgrepo-com.svg",
                alt: "fill tool",
              },
            },
          },
          "|button.canvas-button#eraserButton": {
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/eraser-svgrepo-com.svg",
                alt: "eraser tool",
              },
            },
          },
          "|button.canvas-button#drawButton": {
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/eraser-svgrepo-com.svg",
                alt: "draw tool",
              },
            },
          },
          "|button.canvas-button#clearButton": {
            "|img.inner-button-img": {
              "@": {
                src: "./public/assets/canvas/trash-svgrepo-com.svg",
                alt: "clear tool",
              },
            },
          },
        },
      },
    },
  });
};

// <section class="draw-page">
// <div class="draw-page-header-ctn">
//   <div class="draw-page-title-timer-ctn">
//     <h2 class="large-heading draw-page-title">Garlic Phone</h2>
//     <p class="draw-page-timer">00:00</p>
//   </div>
//   <img class="draw-page-logo" src="./public/assets/logo.svg" />
// </div>
// <div class="draw-page-prompt-ctn">
//   <p>Draw:</p>
//   <h3 class="medium-heading">Clown with pie on his face</h3>
// </div>
// <div class="draw-page-controls">
//   <button style="background-color: rgb(255, 0, 0)" class="colour-button">
//     <img
//       src="./public/assets/canvas/tick-svgrepo-com.svg"
//       alt="tick"
//       class="inner-button-img"
//     />
//   </button>
//   <button style="background-color: rgb(0, 0, 255)" class="colour-button">
//     <img
//       src="./public/assets/canvas/tick-svgrepo-com.svg"
//       alt="tick"
//       class="inner-button-img"
//     />
//   </button>
//   <button style="background-color: rgb(0, 128, 0)" class="colour-button">
//     <img
//       src="./public/assets/canvas/tick-svgrepo-com.svg"
//       alt="tick"
//       class="inner-button-img"
//     />
//   </button>
//   <button
//     style="background-color: rgb(255, 255, 0)"
//     class="colour-button"
//   >
//     <img
//       src="./public/assets/canvas/tick-svgrepo-com.svg"
//       alt="tick"
//       class="inner-button-img"
//     />
//   </button>
//   <button
//     style="background-color: rgb(255, 166, 0)"
//     class="colour-button"
//   >
//     <img
//       src="./public/assets/canvas/tick-svgrepo-com.svg"
//       alt="tick"
//       class="inner-button-img"
//     />
//   </button>
//   <button
//     style="background-color: rgb(128, 0, 128)"
//     class="colour-button"
//   >
//     <img
//       src="./public/assets/canvas/tick-svgrepo-com.svg"
//       alt="tick"
//       class="inner-button-img"
//     />
//   </button>
//   <button
//     style="background-color: rgb(255, 192, 203)"
//     class="colour-button"
//   >
//     <img
//       src="./public/assets/canvas/tick-svgrepo-com.svg"
//       alt="tick"
//       class="inner-button-img"
//     />
//   </button>
//   <button
//     style="background-color: rgb(0, 0, 0)"
//     class="colour-button colour-button-active"
//   >
//     <img
//       src="./public/assets/canvas/tick-svgrepo-com.svg"
//       alt="tick"
//       class="inner-button-img"
//     />
//   </button>
// </div>
// <div><canvas id="canvas" class="canvas"></canvas></div>
// <div class="draw-page-controls">
//   <button class="canvas-button" id="fillButton">
//     <img
//       class="inner-button-img"
//       src="./public/assets/canvas/fill-solid-svgrepo-com.svg"
//       alt="eraser"
//     />
//   </button>
//   <button class="canvas-button" id="eraserButton">
//     <img
//       class="inner-button-img"
//       src="./public/assets/canvas/eraser-svgrepo-com.svg"
//       alt="eraser"
//     />
//   </button>
//   <button class="canvas-button canvas-button-active" id="drawButton">
//     <img
//       class="inner-button-img"
//       src="./public/assets/canvas/pencil-svgrepo-com.svg"
//       alt="eraser"
//     />
//   </button>
//   <button class="canvas-button" id="clearButton">
//     <img
//       class="inner-button-img"
//       src="./public/assets/canvas/trash-svgrepo-com.svg"
//       alt="eraser"
//     />
//   </button>
// </div>
// </section>
