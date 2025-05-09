import './style.css'
import googleLogo from '/assets/google.svg'
import { PageRouter, type PageRenderer, type RedirectFn } from './lib/router'
import { parseInto } from './lib/parse';

const pageContainer = document.getElementById("app")!;

//---------- Page routing ----------//
const pages: { [key: string]: PageRenderer } = {
  // "home": c => { c.innerHTML = '<h1>Home</h1>'; },
  "home": c => parseInto(c, {
    "|h1 #someid.someclass1 .someclass2": {
      "_": "Home",
      "$": {
        color: "red"
      },
      "|div": {
        "_": "hello world",
        "$": {
          color: "var(--asdf)",
          border: "1px solid blue",
          fontSize: "0.5em",
        },
        "%click": () => {
          console.log("CLICKED!")
        }
      }
    }
  }),
  "about": c => { c.innerHTML = '<h1>About</h1>'; },
  "contact": c => { c.innerHTML = '<h1>Contact</h1>'; },
  "login": c => parseInto(c, {
      "|section.login": {
        "|form.login-form": {
          "|h3.login-heading": { _: "Sign Up" },
          "|button#google-login-button.login-google-button": {
            "|p.login-google-button-text": { _: "Login with Google" },
            "|img.login-google-image": { '@': { src: googleLogo } }
          }
        }
      }
  })
};

const redirects: RedirectFn[] = [
  path => path === '/'      ? 'home' : null,
  path => path === '/login' ? 'login' : null,
  path => path.startsWith('/about') ? 'about' : null,
];

const router = new PageRouter({ pages, redirects, container: pageContainer });

// Trigger navigation via buttons:
document.getElementById('toAbout')?.addEventListener('click', () => visit('about'));
document.getElementById('toContact')?.addEventListener('click', () => visit('contact'));