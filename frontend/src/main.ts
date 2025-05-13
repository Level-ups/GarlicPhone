import './style.css'
import { PageRouter, type ContainerMap, type PageRenderer, type RedirectFn } from './lib/router'
import { parseInto } from './lib/parse';
import { defineCustomComponents } from './components/custom-components';
import { loginPage } from './pages/login';
import { galleryPage } from './pages/gallery';
import { drawPage } from './pages/draw';
import { gamePage } from './pages/game';

//---------- Setup ----------//
const containers: ContainerMap = {
  "app": document.getElementById("app")!,
  "page": document.getElementById("page")!
};

defineCustomComponents();

//---------- Page routing ----------//
const pages: { [key: string]: PageRenderer } = {
  // "home": c => { c.innerHTML = '<h1>Home</h1>'; },
  "home": ({ app }) => parseInto(app, {
    "|h1 #someid.someclass1 .someclass2": {
      _: "Home",
      $: {
        color: "red",
      },
      "|div": {
        _: "hello world",
        $: {
          color: "var(--asdf)",
          border: "1px solid blue",
          fontSize: "0.5em",
        },
        "%click": () => {
          console.log("CLICKED!")
        }
      },
      "|ui-button": { _: "asdf" }
    },
  }),
  "about": ({ app }) => { app.innerHTML = '<h1>About</h1>'; },
  "contact": ({ app }) => { app.innerHTML = '<h1>Contact</h1>'; },

  "login": c => loginPage(c),
  "game": c => gamePage(c),
  "gallery": c => galleryPage(c),
  "draw": c => drawPage(c)
};

const redirects: RedirectFn[] = [
  path => path === '/'        ? 'home' : null,
  path => path === '/login'   ? 'login' : null,
  path => path === '/game'    ? 'game' : null,
  path => path === '/gallery' ? 'gallery' : null,
  path => path === '/draw'    ? 'draw' : null,
  path => path.startsWith('/about') ? 'about' : null,
];

const router = new PageRouter({ pages, redirects, containers });

// Trigger navigation via buttons:
document.getElementById('toAbout')?.addEventListener('click', () => visit('about'));
document.getElementById('toContact')?.addEventListener('click', () => visit('contact'));
