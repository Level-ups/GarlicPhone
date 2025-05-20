import { menuNav } from "../components/menuNav";
import { wrapAsCard } from "../lib/card";
import { apiFetch } from "../lib/fetch";
import { GALLERY_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { forEl, parseInto, react, type StyleDict } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { sig } from "../lib/util/signal";

type GalleryItem = { title: string, imgUrl: string };

const cardStyleOverrides: StyleDict = {
    maxWidth: "25em",
    padding: "0"
};

async function getGallery(): Promise<GalleryItem[]> {
    const res = await apiFetch("get", "/api/users/gallery", undefined);
    console.log("GALLERY DATA:", await res.json());

    return [];
}

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

    // { title: "Item A", imgUrl: "https://picsum.photos/100" },
    // Get gallery content
    const items = sig<GalleryItem[] >([]);

    (async () => { items(await getGallery()); })();

    isolateContainer("page");

    // Render page
    return parseInto(page, {
        ...menuNav(),
        "|section.game-grid": {
            ...react([items], () => items().length === 0 ?
                ({ "|p": { _: "Gallery is empty" } }) :
                forEl(items(), createGalleryCard)
            )
        }
    });
}