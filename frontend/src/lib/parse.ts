import { bind, der, eff, maybeBind, maybeSub, multiSub, sig, type MaybeReactive, type Reactive } from "./util/signal";

export type Generator<T, Args extends any[] = []> = T | ((...args: Args) => T);

//-------------------- Types --------------------//
export type ElemTree_Meta = {
  '_'?: TextContent;
  '@'?: AttrDict;
  '$'?: StyleDict;
  '%'?: (el: HTMLElement) => void;
};

export type ElemTree_Elems = (
    { [key in `|${keyof HTMLElementTagNameMap}`]?: ElemTreeGenerator; } &
    { [key in `${string}|${string}`]?: ElemTreeGenerator; }
);

export type ElemTreeGenerator<Args extends any[] = []> = ElemTree | ((...args: Args) => ElemTree);

export type ElemTree_Events = { [key in `%${keyof HTMLElementEventMap}`]?: (e: Event) => void; };

export type ElemTree = ElemTree_Meta & ElemTree_Events & ElemTree_Elems;

type ElemData = {
    tag: string;
    id: string;
    classList: string[];
    style: StyleDict;
    attributes: AttrDict;
    eventHandlers: EventHandlerDict;
    textContent: TextContent;
    initFunc: (el: HTMLElement) => void;
};

export type TextContent = MaybeReactive<string>;
export type StyleDict = { [key in keyof CSSStyleDeclaration]?: MaybeReactive<string> };
export type AttrDict = { [key: string]: MaybeReactive<string> };
export type EventHandler = (e: Event) => void;
export type EventHandlerDict = { [eventName: string]: EventHandler; }


//-------------------- Parser --------------------//
// Parse an ElemTree and set it as the subtree of the given parent
// Any _,$,@,% set on the root of the tree are ignored
export function parseInto(parent: HTMLElement, tree: ElemTree) {
    parent.innerHTML = "";
    parse(tree).forEach(c => parent.appendChild(c));
}

// Parse an ElemTree into a set of HTMLElements
export function parse(tree: ElemTree, par: ElemData = createEmptyElemData()): HTMLElement[] {
    const res: HTMLElement[] = [];

    for (let k in tree) {
        const tok = k as keyof ElemTree;
        const v = tree[tok];

        switch(tok[0]) {
            // Set parent properties
            case '_': par.textContent = (v as TextContent); break;              // content
            case '$': par.style       = (v as StyleDict);   break;              // style
            case '@': par.attributes  = (v as AttrDict);    break;              // attribute
            case '%':
                if (tok === '%')
                    { par.initFunc    = v as (el: HTMLElement) => void; }       // init callback
                else
                    { par.eventHandlers[tok.slice(1)] = v as EventHandler; }    // event
                break;

            // Create new child
            default:                                                            // child
                const subtree : ElemTree = tryCall(tree[tok]);

                // Create element data + physical HTML element
                const childData = createEmptyElemData();
                const tokData = parseElemToken(tok);
                if (typeof tokData === "string") {
                    error(`Invalid element token:\n${tok}\n${tokData}`);
                    break;
                }
                [childData.tag, childData.id, childData.classList] = tokData;

                const grandchildren = parse(subtree, childData);
                res.push(createDomElement(childData, grandchildren));
                break;
        }
    }

    return res;
}

const ID_MARKER = /\s*\#/g;
const CLASS_MARKER = /\s*\./g;
const SPACELESS_MARKER = /(?=[\#\.])/g;
const WHITESPACE = /\s+/g;

type ElemTokenParseRes = [string, string, string[]];
// Format: "label | tag #id .class1 .class2"
// - Spaces between items are optional
// - Names cannot contain spaces
// Returns error string if something goes wrong
function parseElemToken(token: string): ElemTokenParseRes | string {
    // Remove label
    let tok = token.split("|")?.at(-1)?.trim();
    if (tok == null) return "Invalid element token";

    // Remove redundant whitespace
    tok = tok.replaceAll(ID_MARKER, "#").replaceAll(CLASS_MARKER, ".")
    if (WHITESPACE.test(tok)) return "Names cannot have spaces";

    // Parse components
    let [tag, id, classes]: ElemTokenParseRes = ["", "", []];
    tok.split(SPACELESS_MARKER).forEach(part => {
        if (part === "") return "Names cannot be empty";
        switch(part[0]) {
            case ".": classes.push(part.slice(1)); break;
            case "#":
                if (id !== "") return "Cannot specify multiple id's";
                id = part.slice(1);
                break;
            default:
                if (tag !== "") return "Cannot specify multiple element tags";
                tag = part;
                break;
        }
    });

    return [tag, id, classes];
}

function createEmptyElemData(): ElemData {
    return {
        tag: "", id: "", classList: [],
        style: {}, attributes: {},
        eventHandlers: {}, textContent: "",
        initFunc: (_: HTMLElement) => {}
    };
}

// Construct HTML DOM element from PElem metadata
function createDomElement(meta: ElemData, children: HTMLElement[] = []): HTMLElement {
    const {
        tag, id, classList,
        style, attributes: attrs,
        eventHandlers: evnts, textContent,
        initFunc
    } = meta;

    const elem = document.createElement(tag);

    if (id !== "") { elem.id = id; }
    if (classList.length > 0) elem.classList.add(...classList);
    maybeBind(elem, "textContent", textContent);
    Object.entries(style).forEach(([key, val]) => { (elem.style as any)[key] = maybeBind(elem.style as any, key, val); });
    Object.entries(attrs).forEach(([attr, val]) => { maybeSub(val, v => { elem.setAttribute(attr, v); }) });
    Object.entries(evnts).forEach(([eventName, handler]) => { elem.addEventListener(eventName, handler); })
    children.forEach(c => { elem.appendChild(c); });
    initFunc(elem);

    return elem;
}

//-------------------- Utils --------------------//

// Filter only elements from an ElemTree, discarding all meta properties
export function getElems(tree: ElemTree): [ElemTree_Elems, number] {
    const res: ElemTree_Elems = {};
    let i = 0;
    for (let key in tree) {
        if (!key.includes("|")) continue; // skip meta elements
        const k = key as keyof ElemTree_Elems;
        res[k] = tree[k];
        i++;
    }
    return [res, i];
}

// Repeat a tree's elements N times
export function forEl<T>(it: number | T[], tree: ElemTree | ((i: number, x: T) => ElemTree)): ElemTree_Elems {
    let res = {};
    let n = typeof it === "number" ? it : it.length;
    const getArg = typeof it === "number" ? (i: number) => [i] : (i: number) => [i, it[i]];

    for (let i = 0; i < n; i++) {
        const t: ElemTree = tryCall(tree, getArg(i));
        for (let k in t) {
            if (!k.includes("|")) continue; // skip meta elements
            res = { ...res, [`${i}|${k}`]: t[k as keyof ElemTree] }
        }
    }
    return res;
}

// Wrap the tree in a reactive <div> element
// If any of the listed signals changes value, then the subtree will be regenerated
// WARNING: When nesting make sure that all parents & grandparents have a `() => ElemTree`
// function as the `tree` generator, and not a fixed ElemTree
export function react(sigs: Reactive<any>[], tree: ElemTreeGenerator): ElemTree {
    const reactiveId = `react-${randHex(10)}`;
    return {
        [`|div #${reactiveId} .reactiveParent`]: {
            "%": (el: HTMLElement) => multiSub(sigs, () => {
                el.innerHTML = "";
                parseInto(el, generate(tree as any, []));
            }),
            ...tree
        }
    };
}

// If the object is a function, call it
// Otherwise, return it's value
export function tryCall<T>(x: T, args: any[] = []) {
  if (typeof x === "function") return x(...args);
  return x;
}

// Run generator with args if its a function, otherwise just return it's value
export function generate<T, Args extends any[]>(x: Generator<T, Args>, args: Args): T {
  return (typeof x === "function") ? (x as (_: Args) => T)(args) : x as any;
}

// Generate a random hexadecimal string of length `n`
export function randHex(n: number) {
  return [...Array(n)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}



//-------------------- Spec : ElemTree --------------------//

const elemTreeSpec: ElemTree = {
  // Key names starting with | followed by alphanumeric characters are parsed as element types
  // # and . can be appended to set classnames and id's
  "|h1#mainHeader.customHeader": {
        // _ Sets the element's innerHTML
        _: "Header text content goes here"
  },

  "|p.content": {
    // $ allows CSS overrides to set styling
    $: {
        fontFamily: "Nuva Sans",
        color: "red"
    },

    // %<event> allows calling functions on HTML element events
    "%click": (_: Event) => { log("Do something here"); },

    // @ allows arbitrary attribute overrides
    // Setting the `style`, `class`, and `id` attributes here is forbidden
    "@": { value: "myvalue" },
  }
};

// { ...repeat(3, { _: "hello world", "asdf": {}, "fdsa": {} }) }
// {
//     "0|asdf": {}, "0|fdsa": {}
//     "1|asdf": {}, "1|fdsa": {}
//     "2|asdf": {}, "2|fdsa": {}
// }

//----- Create signal -----//
function signalSpec(): ElemTree {
    //----- Create signals -----//
    const count = sig<number>(0);                       // Create signal
    const countStr = der(() => String(count() * 2));    // Create derived signal
    const prog = sig<string>("[]");                     // Create another signal

    //----- Signal R/W -----//
    // Get current signal value by calling it without arguments
    const currCount = count(); // returns 0

    // Set new value and update all subscribers
    count(5);               // New value is 5
    count(x => x * 2)       // New value is 10

    // Create reactive effect which runs when either `count` or `prog` changes
    eff(() => log("COUNT EFFECT:", count(), prog()));

    return {
        "|input": { _: "asdf" }, // TODO: two-way input binding

        ...forEl(3, { "|br": {} }),

        "|button#progButton": {
            "%": (el) =>    { bind(el, "innerText", prog); }, // Manually bind property to signal
            "%click": () => { prog(prog().replace("[", "[=")); }
        },

        "|button#countButton": {
            _: countStr,                                      // Use signal directly as a _/@/$
            $: {
                // @'s and $'s are individually and optionally reactive
                color: der(() => count() % 2 == 0 ? "red" : "green"),   // reacts to current count
                fontSize: "2em"                                         // not reactive
            },
            "%click": () => {
                count(v => v + 1); // set new signal value
            }
        },
    };
}