import { wrapAsCard } from "../lib/card";
import { wrapAsFlex } from "../lib/flex";
import { parseInto, forEl, type StyleDict } from "../lib/parse";

import googleLogo from "/assets/google.svg";
export const loginPage = (par: HTMLElement) => parseInto(par, {
  "|section.login": {
    "|form.login-form": {
      "|h3.login-heading": { _: "Sign Up" },

      "|button#google-login-button.login-google-button": {
        "|p.login-google-button-text": { _: "Login with Google" },
        "|img.login-google-image": {
          "@": { src: googleLogo, alt: "Google" },
        },
      },
    },
  },
});