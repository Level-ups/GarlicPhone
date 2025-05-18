import { bind, der, sig, type Reactive } from "../../../lib/signal";
import { forEl, parse, type ElemTree } from "../lib/parse";

export function defineCustomElem (
  elemName: `${string}-${string}`,
  tree: ElemTree,
  observedAttrs: string[] = [],
  attrChanged: (name: string, oldVal?: string, newVal?: string) => void = () => {}
) {
  const elemClass = class extends HTMLElement {
    private elem: HTMLButtonElement;

    static get observedAttributes() { return observedAttrs; }

    constructor(label?: string) {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      this.elem = parse(tree)[0] as HTMLButtonElement;

      // Append
      shadow.appendChild(this.elem);
    }

    attributeChangedCallBack = attrChanged;

  };

  customElements.define(elemName, elemClass);
  return elemClass;
}

defineCustomElem("ui-button", {
  "|button": {
    _: "mybutton",
    "%click": () => {
    }
  }
});

export function createButton(
  label: string,
  onClick: (e: Event) => void = () => {}
): ElemTree {
  return {
    '|button.base-button': {
      "|span": { _: label },
      '%click': onClick
    }
  };
}

export function createInput(
  placeholder: string,
  val: Reactive<string>
): ElemTree {
  return {
    '|input.gradient-input': {
      '@': { placeholder },
      '%input': (e: Event) => { val((e.target as HTMLInputElement).value); }
    }
  };
}

export function createSlider(
  min: number,
  max: number,
  val: Reactive<number>
): ElemTree {
  return {
    '|input.slider': {
      '@': { type: 'range', min: String(min), max: String(max), value: String(val()) },
      '%input': (e: Event) => {
        val(Number((e.target as HTMLInputElement).value));
      }
    }
  };
}

/** Checkbox List */
export function createCheckboxList(
  items: { label: string; value: string; checked?: boolean }[],
  onChange: (selected: string[]) => void = () => {}
): ElemTree {
  // build children dynamically
  const elems: ElemTree = {};
  items.forEach(({ label, value, checked }, idx) => {
    elems[`|label.item${idx}`] = {
      '|input': {
        '@': { type: 'checkbox', value, checked: checked ? "true" : "false" },
        '%change': () => {
          const boxes = Array.from(document.querySelectorAll('input[type=checkbox]')) as HTMLInputElement[];
          const selected = boxes.filter(b => b.checked).map(b => b.value);
          onChange(selected);
        }
      },
      _: label
    };
  });
  return { '|div.checkbox-list': elems };
}

export function createRadioboxList(
  name: string,
  items: { label: string; value: string }[],
  onChange: (value: string) => void = () => {}
): ElemTree {
  const elems: ElemTree = {};
  items.forEach(({ label, value }, idx) => {
    elems[`|label.item${idx}`] = {
      '|input': {
        '@': { type: 'radio', name, value },
        '%change': (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.checked) onChange(target.value);
        }
      },
      _: label
    };
  });
  return { '|div.radiobox-list': elems };
}

export function createToggleSwitch(
  val: Reactive<boolean>
): ElemTree {
  return {
    '|label.toggle-switch': {
      '|input': {
        '@': { type: 'checkbox', checked: der(() => val() ? "true" : "false") },
        '%change': (e: Event) => { val((e.target as HTMLInputElement).checked); }
      },
      '|span.slider-track': {
        '|span.slider-thumb': {}
      }
    }
  };
}

export function createImage(
  src: Reactive<string>,
  alt: string = ''
): ElemTree {
  return {
    '|div.image-wrapper': {
      '|img.responsive-img': {
        '@': { src, alt },
      }
    }
  };
}

export function createItemList<T extends { name: string }>(
  items: T[],
  onSelect: (index: number, details: T) => void = () => {}
): ElemTree {
  function renderItem(index: number, item: T): ElemTree {
    return {
      '|li.item-button': {
        '|button.gradient-btn': {
          _: item.name,
          '%click': () => onSelect(index, item),
        }
      }
    };
  }

  return {
    '|ul.item-list': {
      ...forEl(items, (i, info) => renderItem(i, info))
    }
  };
}


export type ChainPrompt = { type: "prompt", prompt: string };
export type ChainImage = { type: "image", url: string };
export type ChainLink = ChainPrompt | ChainImage;
export type ChainInfo = {
    name: string,
    links: ChainLink[]
};


export function createChainDisplay(links: ChainLink[]): ElemTree {
  const showModal = sig<boolean>(false);
  const modalImage = sig<string>('');

  function renderLink(link: ChainLink): ElemTree {
    if (link.type === 'prompt') {
      return {
        '|div.chat-row.left': {
          '|p.prompt-bubble': { _: link.prompt }
        }
      };
    } else {
      return {
        '|div.chat-row.right': {
          '|img.chat-image': {
            '@': { src: link.url, alt: "Chat image" },
            '%click': () => {
              modalImage(link.url);
              showModal(true);
            }
          }
        }
      };
    }
  }

  return {
    '|section.chat-container': {
      ...forEl(links, (_, link) => renderLink(link)),

      // Modal overlay
      '|div#image-modal.modal-overlay': {
        $: { display: der(() => showModal() ? 'flex' : 'none') },

        '%click': (e: Event) => {
          if ((e.target as HTMLElement).id === 'image-modal') {
            showModal(false);
          }
        },
        '|img.modal-image': { "@": { src: modalImage } }
      }
    }
  };
}