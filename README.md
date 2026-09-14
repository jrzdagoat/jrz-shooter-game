# JRZ's Shooter Game

A self-contained, browser-based first-person shooter — fight AI bots, pick your
loadout, choose a map, and tune performance and keybinds to your machine.
Built with plain HTML/CSS/JS and [Three.js](https://threejs.org/) (vendored
locally, so it works fully offline).

## Features

- **Loading screen** with progress + rotating tips
- **AI bots** that patrol, chase, and shoot back with line-of-sight checks
- **5 guns** (Pistol, SMG, Rifle, Shotgun, Sniper) + **3 melee weapons**
  (Knife, Bat, Axe), each with real stats (damage, fire rate, mag size, range)
- **4 maps**: Warehouse, Desert Outpost, Neon City, Ice Base
- **Rebindable keyboard controls** for every movement/action key
- **FPS limiter** (30 / 60 / 120 / 144 / Unlimited) and a **render quality**
  + **shadow** + **draw distance** setting, so it scales down to weaker PCs
- Health, stamina/sprint, crouch, jump, reload, kill feed, hit markers

## Play in a browser

Just open `index.html` in a modern browser (Chrome, Edge, Firefox). No build
step, no server required — everything (including the Three.js library) is
bundled in the `vendor/` folder.

> Click into the game window once you press **Play** to lock your mouse.
> Press **Esc** to pause and unlock it again.

## Run as a desktop app (Electron)

```bash
npm install
npm start
```

This opens the same game in a native window using `electron-main.js`.

## Build a Windows `.exe` yourself

```bash
npm install
npm run dist:win
```

The installer and a portable `.exe` are written to `dist/`. (This step needs
to run on Windows, or in the GitHub Actions workflow below — Electron's
Windows packaging isn't reliably cross-built from Linux/macOS.)

## Get a `.exe` automatically from GitHub (recommended)

This repo includes `.github/workflows/build-exe.yml`, which builds the
Windows `.exe` for you in the cloud — no Windows machine needed:

1. Push this project to a GitHub repository.
2. GitHub Actions runs automatically on every push to `main` (or trigger it
   manually from the **Actions** tab → *Build Windows EXE* → *Run workflow*).
3. Open the finished run and download the **`jrz-shooter-game-windows`**
   artifact — it contains the installer `.exe` and a portable `.exe`.
4. To publish a proper GitHub Release with the `.exe` attached, push a tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Controls (defaults — all rebindable in Settings)

| Action          | Key       |
|-----------------|-----------|
| Move            | W A S D   |
| Jump            | Space     |
| Crouch          | Left Ctrl |
| Sprint          | Left Shift|
| Reload          | R         |
| Fire / Swing    | Left Click|
| Aim             | Right Click|
| Switch to gun   | 1         |
| Switch to melee | 2         |
| Pause           | Esc       |

## Project structure

```
index.html               Game shell: loading screen, menus, HUD, canvas
style.css                Visual design (tactical HUD theme)
game.js                  All game logic: menus, weapons, maps, Three.js engine, bot AI
vendor/three.min.js      Vendored Three.js build (offline, no CDN needed)
electron-main.js         Electron desktop wrapper
package.json             npm scripts + electron-builder config (.exe target)
build/icon.ico           App icon used by the Windows build
.github/workflows/       GitHub Actions workflow that builds the .exe
```

## Performance tips

If it chugs on an older machine: open **Settings** and set FPS Limit to 30–60,
Render Quality to **Low**, Shadows to **Off**, and lower the Draw Distance
slider. The game uses simple low-poly geometry and hitscan (raycast) weapons
throughout, so it should run smoothly on most integrated GPUs even on Low.

## License

MIT — do whatever you like with it.
