import {
  DEFAULT_FLEX_CONFIG,
  GALLERY_FLEX_CONFIG,
  LIST_FLEX_CONFIG,
  wrapAsFlex,
} from "../lib/flex";
import { parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { menuNav } from "../components/menuNav";

function menuButton(label: Lowercase<string>): ElemTree {
  return {
    [`|button#${label}Button`]: {
        _: `${label[0]?.toUpperCase()}${label.slice(1)}`,
        $: {
            width: "10em"
        },
        "%click": () => { visit("lobby") }
    },
  };
}

export const menuPlayPage: PageRenderer = ({ page }) => {
  // Render page
  return parseInto(page, {
    ...menuNav(),

    "|div": wrapAsFlex(
      {
        ...menuButton("play"),
        ...menuButton("create"),
        "|input#joinInput": {
            $: { width: "10em" }
        },
        ...menuButton("join"),
      },
      LIST_FLEX_CONFIG
    ),
  });
};
