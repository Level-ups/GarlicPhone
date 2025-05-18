import { tryCall } from "../../../lib/types";
import { ROW_FLEX_CONFIG, wrapAsFlex } from "./flex";
import { getElems, type ElemTree, type ElemTree_Elems, type StyleDict } from "./parse";

// Wrap the given tree as a card element
export function wrapAsCard(tree: ElemTree, label: string = "", additionalClasses: string[] = [], additionalStyling: StyleDict = {}): ElemTree {
  return { 
    [`${label}|article.card${joinWithLeadingSeparator(additionalClasses, '.')}`]: { 
      ...tree,
      ...(additionalStyling ? { $: additionalStyling } : {}),
    } 
  };
}

export function wrapAsRowCard(tree: ElemTree, label: string = ""): ElemTree {
  return {
    [`${label}|article.card.rowCard`]: { ...tree, $: { height: "100%" } },
  };
}

export function wrapAsRowCards(tree: ElemTree, ratios: number[] = [], gap: string = "1em"): ElemTree {
  const [elems, len] = getElems(tree);

  let ratiosTrimmed = ratios.slice(0, len);  // Trim
  while (ratiosTrimmed.length < len) ratiosTrimmed.push(1); // Fill remaining with 1's
  let tot = ratiosTrimmed.reduce((acc, x) => acc + x);
  const rs = ratiosTrimmed.map(x => Math.floor(100 * (x / tot)));


  let res: ElemTree = {};
  let i = 0;
  for (let e in elems) {
    const el = e as keyof ElemTree_Elems;

    res = {
      ...res,
      [el]: {
        ...wrapAsRowCard(tryCall(elems[el]), `${i}`),
        $: {
          width: `calc(${rs[i]}% - ${gap})`
        }
      },
    };

    i++;
  }

  return wrapAsFlex(res, ROW_FLEX_CONFIG);
}

function joinWithLeadingSeparator(arr: any[], separator = ',') {
  return arr.map(item => separator + item).join('');
}
