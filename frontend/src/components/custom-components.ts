import { UIButton } from "./ui-button";

export function defineCustomComponents() {
    // Register the element
    customElements.define('ui-button', UIButton);
}