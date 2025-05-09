import './style.css'
import googleLogo from '/assets/google.svg'
import { PageRouter, type PageRenderer, type RedirectFn } from './lib/router'
import { parseInto } from './lib/parse';

const pageContainer = document.getElementById("app")!;

//---------- Page routing ----------//
const pages: { [key: string]: PageRenderer } = {
  // "home": c => { c.innerHTML = '<h1>Home</h1>'; },
  "home": c => {
    parseInto(c, {
      "|h1 #someid.someclass1 .someclass2": {
        "_": "Home",
        "$": {
          "color": "red"
        }
      }
    });
  },
  "about": c => { c.innerHTML = '<h1>About</h1>'; },
  "contact": c => { c.innerHTML = '<h1>Contact</h1>'; },
  "login": c => { c.innerHTML = `
    <section class="login">
      <form class="login-form">
        <h3 class="login-heading">Sign Up</h3>
        <button id="google-login-button" class="login-google-button">
            <p class="login-google-button-text">Login With Google</p>
            <img class="login-google-image" src="${googleLogo}"/></button>
      </form>
    </section>
  `; },
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