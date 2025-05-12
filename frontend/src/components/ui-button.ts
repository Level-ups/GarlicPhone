import { parse } from "../lib/parse";

export class UIButton extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'color', 'background'];
  }

  private elem: HTMLButtonElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    this.elem = parse({
      "|button": {
        _: this.getAttribute("label") || "Click me",

        "%click": () => {
          this.dispatchEvent(new CustomEvent('button-click', {
            detail: { message: 'Button clicked!' },
            bubbles: true,
            composed: true
          }));
        }
      }
    })[0] as HTMLButtonElement;

    this.updateStyles();

    // Append
    shadow.appendChild(this.elem);
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
    switch (name) {
      case 'label':
        this.elem.textContent = newValue || 'Click me';
        break;
      case 'color':
      case 'background':
        this.updateStyles();
        break;
    }
  }

  //---------- Styles ----------//
  private updateStyles() {
    const updates: Partial<CSSStyleDeclaration> = {
      color: this.getAttribute('color') || '#fff',
      backgroundColor: this.getAttribute('background') || '#007bff',
      padding: '0.5em 1em',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1em'
    };
    for (let k in updates) {
      if (updates[k] != null) this.elem.style[k] = updates[k];
    }
  }
}
