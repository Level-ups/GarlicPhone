import { forEl, type ElemTree } from "../lib/parse";
import { timer } from "../lib/timer";
import garlicPhoneLogo from "/assets/logo.svg";

type Link = {
  name: string;
  url: string;
};

function createLink({ name, url }: Link): ElemTree {
  return {
    "|a.menuButton.base-button": {
      "|span": { _: name },
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
      "|section.nav-info": {
        "|p.nav-title.large-heading": { _: "Garlic Phone" },
        "|img.nav-logo": {
          "@": { src: garlicPhoneLogo, alt: "Garlic Phone" },
        },
      },

      "|section.nav-buttons": {
        ...forEl(links, (_, l) => createLink(l)),
      },

      $: { marginBottom: "2em" },
    },
  };
}

export function titleCard(title: string, showLogo: boolean = true): ElemTree {
  return {
    "|nav.nav.card": {
      "|h1.large-heading": { _: title },
      $: {
        marginBottom: showLogo ? "2em" : "1em",
        ...(showLogo ? { padding: "0" } : {}),
        textAlign: "center",
      },
    },
  };
}

export function titleNav(modifyClass?: string): ElemTree {
  return {
    [`|nav.nav.card.solo-nav.${modifyClass}`]: {
      "|section.nav-info": {
        "|p.nav-title.large-heading": { _: "Garlic Phone" },
        "|img.nav-logo": {
          "@": { src: garlicPhoneLogo, alt: "Garlic Phone" },
        },
      },
    },
  };
}


export function titleNavWithTimer(time: number, modifyClass?: string): ElemTree {
  return {
    [`|nav.nav.card.nav-with-timer.${modifyClass}`]: {
      "|section.nav-info": {
        "|p.nav-title.large-heading": { _: "Garlic Phone" },
        "|img.nav-logo": {
          "@": { src: garlicPhoneLogo, alt: "Garlic Phone" },
        },
      },
      ...timer(time),
    },
  };
}