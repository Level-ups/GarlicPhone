import { menuNav } from "../components/menuNav";
import { wrapAsCard } from "../lib/card";
import { GALLERY_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { forEl, parseInto, type StyleDict } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { sig } from "../lib/util/signal";

type GalleryItem = { title: string, imgUrl: string };

const cardStyleOverrides: StyleDict = {
    maxWidth: "25em",
    padding: "0"
};

function createGalleryCard(i: number, itm: GalleryItem) {
    return wrapAsCard({
        $: cardStyleOverrides,
        "|figure.galleryItem": {
            "|img": {
                "@": { src: itm.imgUrl },
                $: {
                    width: "100%",
                    height: "100%",
                    imageRendering: "pixelated",
                }
            },
            "|figcaption.galleryCaption": {
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

    isolateContainer("page");

    // Render page
    return parseInto(page, {
        ...menuNav(),
        "|section": wrapAsFlex(forEl(items(), createGalleryCard), GALLERY_FLEX_CONFIG)
    });
}