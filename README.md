# Grand Theft Auto: Vice City - Browser Port (WebAssembly)

[![Deploy GTA Vice City to GitHub Pages](https://github.com/Nikhil-Verma22/open_gta_vc/actions/workflows/deploy.yml/badge.svg)](https://github.com/Nikhil-Verma22/open_gta_vc/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Play-GitHub%20Pages-ff007f?style=flat&logo=github)](https://nikhil-verma22.github.io/open_gta_vc/)

A fully featured, browser-based WebAssembly port of **Grand Theft Auto: Vice City**, running client-side in modern web browsers via WebGL, Web Audio, and Emscripten.

🎮 **Live GitHub Pages URL:** [https://nikhil-verma22.github.io/open_gta_vc/](https://nikhil-verma22.github.io/open_gta_vc/)

---

## 🌟 Attribution & Credits

- **Authors of the Port:** Ported by the **DOS.Zone Team**.
- **Official DOS.Zone Project:** [https://dos.zone/reVCDOS](https://dos.zone/reVCDOS)
- **Upstream Repository:** [Carter54git/revcdos](https://github.com/Carter54git/revcdos)
- **Original Engine:** Built upon the re3 / reVC reverse-engineering project.
- **Trademarks:** *Grand Theft Auto*, *Grand Theft Auto: Vice City*, and Rockstar Games are registered trademarks of Take-Two Interactive Software, Inc. This project is an independent educational/research showcase and is not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.

---

## ⚡ Technical Highlights

- **Pure WebAssembly Engine:** Compiled with Emscripten using single-threaded Asyncify (`Module['_async_main']`). Compatible with static GitHub Pages hosting without requiring `SharedArrayBuffer` or restrictive COOP/COEP headers.
- **Client-Side Asset Streaming:** Preloads core data (~129 MB across ~1,944 essential files) into Emscripten MEMFS (`Module.initFS`) and streams additional assets on demand (`Module.getAsyncUrl`) directly in the browser.
- **Dynamic In-Memory Auto-Tuning:** Features built-in automatic patching of `gta_vc.dat` to ensure the streamed IPL pool strictly respects the engine's 16-slot limit (`NUM_STREAMED_IPLS = 16`), preventing runtime call stack overflows and out-of-bounds memory errors.
- **DAT File Auto-Mirroring:** Dynamically mirrors configuration files (`CARCOLS.DAT`, `PEDSTATS.DAT`, `TIMECYC.DAT`) from `data/` to the asset root to satisfy hardcoded engine paths.
- **Persistent Cloud & Local Saves:** Save games are automatically persisted to IndexedDB (`/saves/` directory) via `idbfs.js`, keeping your story progress safe between browser sessions.
- **Multiple Input Methods:** Full support for Keyboard + Mouse, standard Gamepads (XInput / DualShock / Generic Gamepad API), and mobile Touchscreen virtual controls.
- **Zero Asset CDN Reliance:** Operates completely offline with user-provided local assets; no external asset server calls or third-party tracking.

---

## 🚀 How to Play

### Option 1: Play Directly on GitHub Pages (Recommended)

1. Navigate to [https://nikhil-verma22.github.io/open_gta_vc/](https://nikhil-verma22.github.io/open_gta_vc/).
2. Click **"Select Asset Folder"** (or drag and drop your `vc-assets` folder into the browser window).
3. The launcher will automatically inspect your assets, preload the necessary 1,944 core files, and launch the 3D WebAssembly engine in full screen.
4. **IndexedDB Local Caching:** You can choose to cache the files in your browser so you do not need to select the folder again on future visits.
5. *Privacy Guarantee:* All game assets remain strictly inside your browser. No files are ever uploaded to GitHub or any external server.

### Option 2: Run Locally via Python

1. Clone this repository:
   ```bash
   git clone https://github.com/Nikhil-Verma22/open_gta_vc.git
   cd open_gta_vc
   ```
2. Place or symlink your compatible `vc-assets` folder inside the `open_gta_vc` directory:
   ```
   open_gta_vc/
   ├── vc-assets/
   │   └── local/
   │       ├── audio/
   │       ├── data/
   │       ├── models/
   │       ├── skins/
   │       └── textures/
   ├── index.html
   ├── engine.html
   ├── server.py
   └── ...
   ```
3. Start the local server:
   ```bash
   python server.py 8080
   ```
4. Open your browser and navigate to:
   ```
   http://127.0.0.1:8080/index.html
   ```

---

## 🎮 Controls

### On Foot
| Action | Keyboard & Mouse | Gamepad |
| :--- | :--- | :--- |
| **Move** | `W` / `A` / `S` / `D` or Arrow Keys | Left Analog Stick / D-Pad |
| **Look / Camera** | Mouse Movement | Right Analog Stick |
| **Sprint** | `Left Shift` | `A` (Xbox) / `Cross` (PlayStation) |
| **Jump** | `Space` | `X` (Xbox) / `Square` (PlayStation) |
| **Enter / Exit Vehicle** | `Enter` or `F` | `Y` (Xbox) / `Triangle` (PlayStation) |
| **Attack / Fire** | `Left Mouse Button` or `Left Ctrl` | Right Trigger (`RT`) / `R2` |
| **Next / Previous Weapon** | `Mouse Wheel` or `E` / `Q` | Bumpers (`LB` / `RB`) |
| **Pause / Menu** | `Esc` | `Start` / `Options` |

### In Vehicle
| Action | Keyboard & Mouse | Gamepad |
| :--- | :--- | :--- |
| **Accelerate** | `W` or `Up Arrow` | Right Trigger (`RT`) / `R2` |
| **Brake / Reverse** | `S` or `Down Arrow` | Left Trigger (`LT`) / `L2` |
| **Steer** | `A` / `D` or Left / Right Arrows | Left Analog Stick |
| **Handbrake** | `Space` | `Right Bumper` (`RB`) |
| **Horn** | `Left Shift` | Left Stick Click (`L3`) |
| **Change Radio Station** | `R` | `D-Pad Left` / `D-Pad Right` |

---

## 📁 Repository Structure

```
open_gta_vc/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated CI validation & GitHub Pages deployment
├── .gitignore                  # Excludes game assets, archives, and secrets
├── index.html                  # Cyberpunk Vice City launcher UI with folder picker & IndexedDB
├── engine.html                 # Isolated WebAssembly canvas host & Emscripten runtime
├── game.js                     # Asset loader, IPL auto-tuner & Emscripten FS bridge
├── index.js                    # Emscripten compiled JavaScript glue code
├── index.wasm                  # Vice City WebAssembly 3D engine (~7.6 MB)
├── preload_files.list          # Cleaned manifest of the 1,944 preloaded game files
├── GamepadEmulator.js          # Cross-browser Gamepad API bridge
├── idbfs.js                    # IndexedDB filesystem sync for cloud/local game saves
├── jsdos-cloud-sdk.js          # DOS.Zone cloud-save client library
├── server.py                   # Lightweight local development server
└── README.md                   # Project documentation & attribution
```

---

## ⚖️ Legal & Copyright Disclaimer

- This repository **does NOT contain any copyrighted game assets** (models, textures, audio tracks, radio stations, cutscenes, or level geometry).
- All source files, scripts, and WebAssembly binaries in this repository are for educational and compatibility purposes only.
- Players must supply their own legally purchased copy of Grand Theft Auto: Vice City to play.
