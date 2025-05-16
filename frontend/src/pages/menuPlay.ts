import {
  DEFAULT_FLEX_CONFIG,
  GALLERY_FLEX_CONFIG,
  LIST_FLEX_CONFIG,
  NAV_FLEX_CONFIG,
  wrapAsFlex,
} from "../lib/flex";
import { parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { menuNav } from "../components/menuNav";
import { createInput } from "../components/ui";
import { wrapAsCard } from "../lib/card";
import { sig } from "../lib/signal";

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
  const joinInp = sig<string>("");

  isolateContainer("page");

  // Render page
  return parseInto(page, {
    ...menuNav(),

    "|section": wrapAsFlex(
      {
        ...menuButton("play"),
        ...menuButton("create"),
        "|section": {
          ...wrapAsCard(wrapAsFlex({
            ...createInput("Join Code", joinInp),
            ...menuButton("join"),
          }, NAV_FLEX_CONFIG)),
          $: { width: "60%" }
        }
      },
      LIST_FLEX_CONFIG
    ),
  });
};
