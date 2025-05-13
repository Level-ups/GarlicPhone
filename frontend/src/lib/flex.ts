import type { ElemTree } from "./parse";

interface FlexConfig {
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  justifyContent?: | "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
  alignItems?: "stretch" | "flex-start" | "flex-end" | "center" | "baseline";
  gap?: string;
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  // Add more if needed
}

export const DEFAULT_FLEX_CONFIG: FlexConfig = {
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "stretch",
  gap: "1rem",
  wrap: "nowrap"
};

export const GALLERY_FLEX_CONFIG: FlexConfig = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "1rem",
  wrap: "wrap"
};

export const NAV_FLEX_CONFIG: FlexConfig = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "5em",
  wrap: "wrap"
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
        ...(config?.wrap ? { flexWrap: config.wrap } : {}),
      },
      ...tree
    },
  };
}
