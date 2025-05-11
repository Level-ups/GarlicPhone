import type { ElemTree } from "./parse";

// Wrap the given tree as a card element
export function wrapAsCard(tree: ElemTree): ElemTree {
  return { "|article.card": { ...tree } };
}