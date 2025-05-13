import { wrapAsCard } from "../lib/card";
import { GALLERY_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto, forEl, type StyleDict } from "../lib/parse";
import { der, eff, sig } from "../../../lib/signal";
import type { PageRenderer } from "../lib/router";
import { menuNav } from "../components/menuNav";

type GalleryItem = { title: string, imgUrl: string };

const cardStyleOverrides: StyleDict = {
    maxWidth: "25em",
    padding: "0"
};

function genGalleryCard(i: number, itm: GalleryItem) {
    return wrapAsCard({
        $: cardStyleOverrides,
        "|figure": {
            "|img": {
                "@": { src: itm.imgUrl },
                $: {
                    width: "100%",
                    height: "100%",
                    imageRendering: "pixelated",
                }
            },
            "|figcaption": {
                _: itm.title,
                $: { padding: "1rem", fontSize: "1em" }
            }
        },
    });
}

export const galleryPage: PageRenderer = ({ page, app }) => {
    //----- Create signal -----//
    const count = sig<number>(0);                       // Create signal
    const countStr = der(() => String(count() * 2));    // Create derived signal
    const prog = sig<string>("[]");                     // Create another signal

    //----- Signal R/W -----//
    // Get current signal value by calling it without arguments
    const currCount = count(); // returns 0
    // OR use count.get()

    // Set new value and update all subscribers
    count(5); // New value is 5
    // OR use count(x => x + 5)
    // OR use count.set(5)
    // OR use count.set(x => x + 5)


    // Create reactive effect which runs when either `count` or `prog` changes
    eff(() => console.log("COUNT EFFECT:", count(), prog()));


    // parseInto(app, {
    //     "|input": {
    //         _: "asdf"
    //     },
    //     ...forEl(3, { "|br": {} }),
    //     "|button#progButton": {
    //         "%": (el) =>    { bind(el, "innerText", prog); }, // Manually bind property to signal
    //         "%click": () => { prog(prog().replace("[", "[=")); }
    //     },
    //     "|button#countButton": {
    //         _: countStr,                                      // Use signal directly as a _/@/$
    //         $: {
    //             // @'s and $'s are individually and optionally reactive
    //             color: der(() => count() % 2 == 0 ? "red" : "green"),   // reacts to current count
    //             fontSize: "2em"                                         // not reactive
    //         },
    //         "%click": () => {
    //             count(v => v + 1); // set new signal value
    //         }
    //     },
    // });


        // ...wrapAsFlex(forEl(items(), genGalleryCard), GALLERY_FLEX_CONFIG)

    // Get gallery content
    const items = sig<GalleryItem[] >([
        { title: "Item A", imgUrl: "https://picsum.photos/100" },
        { title: "Item B", imgUrl: "https://picsum.photos/150" },
        { title: "Item C", imgUrl: "https://picsum.photos/200" },
        { title: "Item D", imgUrl: "https://picsum.photos/250" },
        { title: "Item D", imgUrl: "https://picsum.photos/250" },
        { title: "Item D", imgUrl: "https://picsum.photos/250" },
        { title: "Item D", imgUrl: "https://picsum.photos/250" },
        { title: "Item D", imgUrl: "https://picsum.photos/250" },
        { title: "Item D", imgUrl: "https://picsum.photos/250" }
    ]);

    // Render page
    return parseInto(page, {
        ...menuNav(),

        "|div": wrapAsFlex({ ...forEl(items(), genGalleryCard) }, GALLERY_FLEX_CONFIG)
    });
}