import { maybeBind, maybeSub, type MaybeReactive } from "../../../lib/signal";
import { tryCall } from "../../../lib/types";

//-------------------- Types --------------------//
type ElemTree_Meta = {
  '_'?: TextContent;
  '@'?: AttrDict;
  '$'?: StyleDict;
  '%'?: (el: HTMLElement) => void;
};

type ElemTree_Elems = (
    { [key in `|${keyof HTMLElementTagNameMap}`]?: ElemTree | (() => ElemTree); } &
    { [key in `${string}|${string}`]?: ElemTree | (() => ElemTree); }
);

type ElemTree_Events = { [key in `%${keyof HTMLElementEventMap}`]?: (e: Event) => void; };

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


//-------------------- Spec --------------------//
const spec: ElemTree = {
  // Key names starting with | followed by alphanumeric characters are parsed as element types
  // # and . can be appended to set classnames and id's
  "|h1#mainHeader": {
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
    "%click": (_: Event) => { console.log("Do something here"); },

    // @ allows arbitrary attribute overrides
    // Setting the `style`, `class`, and `id` attributes here is forbidden
    "@": {
        "attr": "value"
    },
  },

  "|div": {
    _: "asdf",

    "|span": {
        "|p": {
            "|asdf": {},
            _: "fdsa"
        }
    },
    "|span.1": {
    }
  }
};


//-------------------- Trinkets --------------------//
class Signal<T> { val: T;
    deps: any[];

    constructor(val: T, deps: any[] = []) {
        this.val = val;
        this.deps = deps;
    }

    set(setter: T | ((v: T) => T)) {
        this.val = typeof setter === "function" ? (setter as Function)(this.val) : setter;
        this.notify();
    }

    notify() { this.deps.forEach(x => x()); }
    addDep(dep: (v: T) => void){ this.deps.push(dep); }
}

let x = new Signal(10);
x.set(20);

let silentRegisterCaller = (_: any) => {};

function init() {
    const $state = new Proxy({}, {
        get(target: { [key: string]: Signal<any> }, prop: string) {
            if (typeof prop === "symbol") return;

            // Silently add dependency when getting signal element
            const signal = target[prop];
            if (typeof silentRegisterCaller === "function") {
                signal.addDep(silentRegisterCaller);
            }
            return signal;
        }
    })
}


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
                    console.error(`Invalid element token:\n${tok}\n${tokData}`);
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

// Repeat a tree's elements N times
export function forEl<T>(it: number | T[], tree: ElemTree | ((i: number, x: T) => ElemTree)): ElemTree_Elems {
    let res = {};
    let n = typeof it === "number" ? it : it.length;
    const getArg = typeof it === "number" ? (i: number) => [i] : (i: number) => [i, it[i]];

    for (let i = 0; i < n; i++) {
        const t = tryCall(tree, getArg(i));
        for (let k in t) {
            if (!k.includes("|")) continue; // skip meta elements
            res = { ...res, [`${i}|${k}`]: t[k as keyof ElemTree] }
        }
    }
    return res;
}

// { ...repeat(3, { _: "hello world", "asdf": {}, "fdsa": {} }) }
// {
//     "0|asdf": {}, "0|fdsa": {}
//     "1|asdf": {}, "1|fdsa": {}
//     "2|asdf": {}, "2|fdsa": {}
// }