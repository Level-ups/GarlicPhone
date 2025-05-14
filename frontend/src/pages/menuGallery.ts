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

export const menuGalleryPage: PageRenderer = ({ page }) => {

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
        "|div": wrapAsFlex(forEl(items(), genGalleryCard), GALLERY_FLEX_CONFIG)
    });
}