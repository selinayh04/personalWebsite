# Personal Website

A React + Vite personal website scaffold with `anime.js` 4.3.5 preinstalled.

## Tech stack

- React 19
- React Router 7
- Vite 6
- anime.js 4.3.5

## Project structure

```
.
├── index.html
├── package.json
├── vite.config.js
└── src
    ├── main.jsx          # App entry point
    ├── main.css          # Global stylesheet
    ├── App.jsx           # Routes + nav
    ├── component/        # Reusable components (empty for now)
    └── page/
        ├── HomePage.jsx
        ├── HomePage.css
        ├── WorksPage.jsx
        ├── WorksPage.css
        ├── ContactPage.jsx
        └── ContactPage.css
```

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:5173
npm run build    # build for production
npm run preview  # preview the production build
```

## Using anime.js

Import the named APIs directly from `animejs` (v4 is ESM-first):

```js
import { animate } from 'animejs';

animate('.box', {
  translateX: 250,
  rotate: '1turn',
  duration: 800,
  ease: 'outElastic',
});
```

See the official docs: <https://animejs.com/documentation/getting-started/installation>
