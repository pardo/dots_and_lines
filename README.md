# dots_and_lines

A small "Dots and Boxes" game. Vanilla JS, bundled with [Vite], with online
1v1 play over WebRTC using [Trystero] (no server to run).

Live: https://pardo.github.io/dots_and_lines/

## Requirements

Node (see `.nvmrc`):

```
nvm install   # installs the version in .nvmrc
nvm use
npm install
```

## Commands

```
npm run dev      # start the Vite dev server (also exposed on the LAN for phones)
npm run build    # production build into docs/ (served by GitHub Pages)
npm run preview  # preview the production build locally
```

## How to play online

One player clicks **HOST** and enters a match name; the other clicks **JOIN**
and enters the same name. They connect peer-to-peer — the host is Blue and
plays first, the joiner is Red. Press `u` to undo (host only).

[Vite]: https://vitejs.dev/
[Trystero]: https://github.com/dmotz/trystero
