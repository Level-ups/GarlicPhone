import { NAV_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { forEl, type ElemTree } from "../lib/parse";
import garlicPhoneLogo from "/assets/logo.svg";

type Link = {
  name: string;
  url: string;
};

function createLink({ name, url }: Link): ElemTree {
  return {
    "|a.menuButton": {
      _: name,
      "@": { href: url },
    },
  };
}

export function menuNav(): ElemTree {
  const links: Link[] = [
    { name: "Play", url: "/play" },
    { name: "Gallery", url: "/gallery" },
  ];

  return {
    "|nav.nav.card": {
        "|p.nav-title.large-heading": { _: "Garlic Phone" },
      "|img.nav-logo": {
        "@": { src: garlicPhoneLogo, alt: "Garlic Phone" },
      },
      "|div.nav-buttons": {
        ...forEl(links, (_, l) => createLink(l)),
      },

      $: { marginBottom: "2em" },
    },
  };
}

export function titleCard(title: string): ElemTree {
  return {
    "|nav.nav.card": {
      "|h1.large-heading": { _: title },
      $: {
        marginBottom: "2em",
        textAlign: "center",
      },
    },
  };
}

export function titleNav(): ElemTree {
  return {
    "|nav.nav.card": {
      "garlic|h1.large-heading.nav-title": { _: "Garlic" },
      "|img.nav-logo": {
        "@": { src: garlicPhoneLogo, alt: "Garlic Phone" },
      },
      "phone|h1.large-heading.nav-title": { _: "Phone" },
    },
  };
}
