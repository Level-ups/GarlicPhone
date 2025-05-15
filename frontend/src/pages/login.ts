import { startGoogleLogin } from "../components/auth/auth";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import garlicPhoneLogo from "/assets/logo.svg";

import googleLogo from "/assets/google.svg";
export const loginPage: PageRenderer = ({ app }) =>
  parseInto(app, {
    "|section.login": {
      "|form.login-form": {
        "|img.login-logo": {
          "@": { src: garlicPhoneLogo, alt: "Garlic Phone" },
        },
        "|h1.login-heading": { _: "Garlic Phone" },
        "|p.login-subheading": {
          _: "Friends don’t let friends draw alone.",
        },
        "|button#google-login-button.login-google-button": {
          "%click": (event) => {
            event.preventDefault();
            startGoogleLogin(event as MouseEvent);
          },
          '@': {
            type: "button",
          },
          "|p.login-google-button-text": { _: "Login with Google" },
          "|img.login-google-image": {
            "@": { src: googleLogo, alt: "Google" },
          },
        },
      },
    },
  });
