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
      "|p.nav-title": { _: "Garlic Phone" },
      "|img.nav-logo": {
        "@": { src: garlicPhoneLogo, alt: "Garlic Phone" },
      },
      "|section.nav-buttons": {
        ...forEl(links, (_, l) => createLink(l)),
      },

      $: { marginBottom: "2em" },
    },
  };
}

export function titleCard(title: string): ElemTree {
  return {
    "|nav.nav.card.title-card": {
      "|section.title-and-logo": {
        "|p.nav-title": { _: "Garlic Phone" },
        "|img.nav-logo": {
          "@": { src: garlicPhoneLogo, alt: "Garlic Phone" },
        },
      },
      "|h1": { _: title },
      $: {
        marginBottom: "2em",
        textAlign: "center",
      },
    },
  };
}
