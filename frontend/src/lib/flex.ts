import type { ElemTree } from "./parse";

interface FlexConfig {
  flexDirection?:   "row" | "column" | "row-reverse" | "column-reverse";
  justifyContent?:  "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
  alignItems?:      "stretch" | "flex-start" | "flex-end" | "center" | "baseline";
  flexWrap?:        "nowrap" | "wrap" | "wrap-reverse";
  gap?:             string;
};

export const DEFAULT_FLEX_CONFIG: FlexConfig = {
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "stretch",
  gap: "2rem",
  flexWrap: "nowrap"
};

export const LIST_FLEX_CONFIG: FlexConfig = {
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: "2rem",
  flexWrap: "nowrap"
};

export const ROW_FLEX_CONFIG: FlexConfig = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: "1em",
  flexWrap: "wrap"
};

export const GALLERY_FLEX_CONFIG: FlexConfig = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "2rem",
  flexWrap: "wrap"
};

export const NAV_FLEX_CONFIG: FlexConfig = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "5em",
  flexWrap: "wrap"
};

// Wrap the given tree inside a semantic flex container.
export function wrapAsFlex(tree: ElemTree, config: FlexConfig = DEFAULT_FLEX_CONFIG): ElemTree {
  return {
    "|section.flex-container": {
      $: {
        display: "flex",
        ...(config?.flexDirection ? { flexDirection: config.flexDirection } : {}),
        ...(config?.justifyContent ? { justifyContent: config.justifyContent } : {}),
        ...(config?.alignItems ? { alignItems: config.alignItems } : {}),
        ...(config?.gap ? { gap: config.gap } : {}),
        ...(config?.flexWrap ? { flexWrap: config.flexWrap } : {})
      },
      ...tree
    },
  };
}