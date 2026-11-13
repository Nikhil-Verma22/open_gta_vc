var haveOriginalGame = true;
const params = new URLSearchParams(window.location.search);
const cloudSavesStatus = document.getElementById('cloud-saves-status');
var statusElement = document.getElementById("status");
var progressElement = document.getElementById("progress");
var spinnerElement = document.getElementById('spinner');
var wasm_content = params.get("wasm");

const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
let isTouch = isMobile && window.matchMedia('(pointer: coarse)').matches;

document.body.dataset.isTouch = isTouch ? 1 : 0;

const dataSize = 130 * 1024 * 1024;
const textDecoder = new TextDecoder();
(function () {
    const translations = {
        en: {
            clickToPlayDemo: "Click to play demo",
            clickToPlayFull: "Click to play",
            invalidKey: "invalid key",
            checking: "checking...",
            cloudSaves: "Cloud saves:",
            enabled: "enabled",
            disabled: "disabled",
            playDemoText: "You can play the DEMO version, or provide the original game files to play the full version.",
            disclaimer: "DISCLAIMER:",
            disclaimerSources: "This game is based on an open source version of GTA: Vice City. It is not a commercial release and is not affiliated with Rockstar Games.",
            disclaimerCheckbox: "I own the original game",
            disclaimerPrompt: "You need to provide a file from the original game to confirm ownership of the original game.",
            cantContinuePlaying: "You can't continue playing in DEMO version. Please provide the original game files to continue playing.",
            demoAlert: "The demo version is intended only for familiarizing yourself with the game technology. All features are available, but you won’t be able to progress through the game’s storyline. Please provide the original game files to launch the full version.",
            downloading: "Downloading",
            enterKey: "enter your key",
            clickToContinue: "Click to continue...",
            enterJsDosKey: "Enter js-dos key",
            portBy: "HTML5 port by:",
            ruTranslate: "",
            demoOffDisclaimer: "Due to the unexpectedly high popularity of the project, resulting in significant traffic costs, and in order to avoid any risk of the project being shut down due to rights holder claims, we have disabled the demo version. You can still run the full version by providing the original game resources.",
        },
        ru: {
            clickToPlayDemo: "Играть в демо версию",
            clickToPlayFull: "Играть",
            invalidKey: "неверный ключ",
            checking: "проверка...",
            cloudSaves: "Облачные сохранения:",
            enabled: "включены",
            disabled: "выключены",
            playDemoText: "Вы можете играть в демо версию, или предоставить оригинальные файлы игры для полной версии.",
            disclaimer: "ОТКАЗ ОТ ОТВЕТСТВЕННОСТИ:",
            disclaimerSources: "Эта игра основана на открытой версии GTA: Vice City. Она не является коммерческим изданием и не связана с Rockstar Games.",
            disclaimerCheckbox: "Я владею оригинальной игрой",
            disclaimerPrompt: "Вам потребуется приложить какой-либо файл из оригинальной игры для подтверждения владения оригинальной игрой.",
            cantContinuePlaying: "Вы не можете продолжить игру в демо версии. Пожалуйста, предоставьте оригинальные файлы игры для продолжения игры.",
            demoAlert: "Демо версия предназначена только для ознакомления с технологией игры. Все функции доступны, но вы не сможете продолжить игру по сюжету. Пожалуйста, предоставьте оригинальные файлы игры для запуска полной версии.",
            downloading: "Загрузка",
            enterKey: "введите ваш ключ",
            clickToContinue: "Нажмите для продолжения...",
            enterJsDosKey: "Введите ключ js-dos",
            portBy: "Авторы HTML5 порта:",
            ruTranslate: `
<div class="translated-by">
    <span>Переведено на русский студией</span>
    <a href="https://www.gamesvoice.ru/" target="_blank">GamesVoice</a>
</div>
`,
            demoOffDisclaimer: "В связи с неожиданно высокой популярностью проекта, как следствие — значительными расходами на трафик, а также во избежание рисков закрытия проекта из-за претензий правообладателей, мы отключили возможность запуска демо-версии. При этом вы по-прежнему можете запустить полную версию, предоставив оригинальные ресурсы.",
        },
    };

    let currentLanguage = navigator.language.split("-")[0] === "ru" ? "ru" : "en";
    if (params.get("lang") === "ru") {
        currentLanguage = "ru";
    }
    if (params.get("lang") === "en") {
        currentLanguage = "en";
    }

    window.t = function (key) {
        return translations[currentLanguage][key];
    }
})();

async function loadData() {
};

let isGameLoading = false;

async function startGame(e) {
    if (isGameLoading) return;
    isGameLoading = true;
    if (e && e.stopPropagation) e.stopPropagation();

    const startContainer = document.querySelector('.start-container');
    if (startContainer) startContainer.style.display = 'none';
    const devBy = document.querySelector('.developed-by');
    if (devBy) devBy.style.display = 'none';
    const ctp = document.querySelector('.click-to-play');
    if (ctp) ctp.style.display = 'none';

    // Acknowledge start to host window so it stops retrying host.start
    if (window.top !== window) {
        window.top.postMessage({ event: 'engine.ack_start' }, '*');
    }

    loadGame();
}

// Listen for start signal from parent host window (index.html)
window.addEventListener('message', (event) => {
    if (event.data && event.data.event === 'host.start') {
        if (isGameLoading) {
            if (window.top !== window) {
                window.top.postMessage({ event: 'engine.ack_start' }, '*');
            }
            return;
        }
        console.log('[game.js] Received host.start, starting game...');
        startGame(event);
    }
});

// Notify parent host window that engine runtime is ready
if (window.top !== window) {
    window.top.postMessage({ event: 'engine.ready' }, '*');
}

function setStatus(text) {
    console.log(text);
};

const ASSET_PREFIX = 'gtavc-assets/local';
const ASSET_BASE = new URL(`${ASSET_PREFIX}/`, window.location.href).href;
const PRELOAD_URL = new URL('preload_files.list?v=' + Date.now(), window.location.href).href;
const STREAM_URL = new URL('stream_files.list?v=' + Date.now(), window.location.href).href;

function normalizeAssetRel(rel) {
    if (!rel) return '';
    let p = rel.replaceAll('\\', '/').replaceAll('//', '/');
    if (p.startsWith('/')) p = p.substring(1);
    if (p.toLowerCase().startsWith('gtavc-assets/local/')) {
        p = p.substring('gtavc-assets/local/'.length);
    } else if (p.toLowerCase().startsWith('vc-assets/local/')) {
        p = p.substring('vc-assets/local/'.length);
    }
    return p;
}

function assetCandidates(rel) {
    const r = normalizeAssetRel(rel);
    const out = [r];
    
    // Fallback: loose files extracted from gta3.img
    let m = r.match(/^models\/([^/]+\.(dff|txd|col|ifp))$/i);
    if (m) out.push(`models/gta3.img/${m[1].toLowerCase()}`);

    m = r.match(/^models\/([^/]+)\/([^/]+\.(dff|txd|col|ifp))$/i);
    if (m && m[1].toLowerCase() !== 'gta3.img' && m[1].toLowerCase() !== 'coll' && m[1].toLowerCase() !== 'generic') {
        out.push(`models/gta3.img/${m[2].toLowerCase()}`);
    }

    if (r.endsWith('cuts.img')) {
        out.push('anim/cuts.img');
    }
    return out;
}

async function loadGame() {
    var Module = {
        initFS: async () => {
            await new Promise((resolve, reject) => {
                let files = 0;
                const createdDirs = new Set(['/', '/gtavc-assets', '/gtavc-assets/local', '/vc-assets', '/vc-assets/local', '/models', '/data', '/anim', '/audio', '/text', '/txd', '/skins']);

                function ensureDir(p) {
                    const parts = p.split('/').filter(Boolean);
                    let cur = '';
                    for (let i = 0; i < parts.length - 1; i++) {
                        cur += '/' + parts[i];
                        if (!createdDirs.has(cur)) {
                            try {
                                Module.FS.mkdir(cur);
                            } catch (e) {}
                            createdDirs.add(cur);
                        }
                    }
                }

                window.addEventListener('message', (event) => {
                    const data = event.data;
                    if (data.event === '>module.initfs') {
                        files = data.files;
                    }

                    if (data.event === '>module.initfile' || data.event === '>module.initfs') {
                        if (data.event === '>module.initfile') {
                            try {
                                const cleanPath = data.path.replaceAll('\\', '/');
                                const rel = normalizeAssetRel(cleanPath);
                                const pathsToWrite = Array.from(new Set([
                                    cleanPath,
                                    'gtavc-assets/local/' + rel,
                                    'vc-assets/local/' + rel,
                                    rel
                                ]));

                                let fileData = data.data;
                                // Auto-tune gta_vc.dat if vanilla file has more than 16 streamed IPLs
                                if (cleanPath.toLowerCase().endsWith('data/gta_vc.dat')) {
                                    let content = textDecoder.decode(fileData);
                                    if (content.includes('IPL DATA\\MAPS\\airportN\\airportN.IPL') && !content.includes('# IPL DATA\\MAPS\\airportN')) {
                                        console.log('[game.js] Auto-tuning gta_vc.dat for 16-slot CIplStore pool limit');
                                        const iplsToComment = [
                                            'IPL DATA\\MAPS\\cisland\\cisland.IPL',
                                            'IPL DATA\\MAPS\\airport\\airport.IPL',
                                            'IPL DATA\\MAPS\\airportN\\airportN.IPL',
                                            'IPL DATA\\MAPS\\haiti\\haiti.IPL',
                                            'IPL DATA\\MAPS\\haitin\\haitin.IPL',
                                            'IPL DATA\\MAPS\\islandsf\\islandsf.IPL',
                                            'IPL DATA\\MAPS\\stadint\\stadint.IPL',
                                            'IPL DATA\\MAPS\\bank\\bank.IPL',
                                            'IPL DATA\\MAPS\\mall\\mall.IPL',
                                            'IPL DATA\\MAPS\\yacht\\yacht.IPL',
                                            'IPL DATA\\MAPS\\club\\club.IPL',
                                            'IPL DATA\\MAPS\\lawyers\\lawyers.IPL',
                                            'IPL DATA\\MAPS\\stripclb\\stripclb.IPL',
                                            'IPL DATA\\MAPS\\concerth\\concerth.IPL',
                                            'IPL DATA\\MAPS\\mansion\\mansion.IPL',
                                        ];
                                        for (const line of iplsToComment) {
                                            content = content.replaceAll(line, '# ' + line);
                                        }
                                        fileData = new TextEncoder().encode(content);
                                    }
                                }

                                for (const p of pathsToWrite) {
                                    ensureDir(p);
                                    try {
                                        Module.FS.createDataFile(p, 0, fileData, fileData.length);
                                    } catch (err) {}
                                }

                                // Mirror key DAT files to asset root if loaded from data/
                                const lowerPath = cleanPath.toLowerCase();
                                const mirrorNames = ['carcols.dat', 'pedstats.dat', 'timecyc.dat', 'surface.dat', 'waterpro.dat'];
                                for (const mName of mirrorNames) {
                                    if (lowerPath.endsWith('data/' + mName)) {
                                        for (const p of pathsToWrite) {
                                            const rootPath = p.substring(0, p.toLowerCase().lastIndexOf('data/')) + mName;
                                            ensureDir(rootPath);
                                            try {
                                                Module.FS.createDataFile(rootPath, 0, fileData, fileData.length);
                                            } catch (err) {}
                                        }
                                    }
                                }
                            } catch (e) {
                                reject(new Error('Failed to create file: ' + data.path));
                                return;
                            }
                            files--;
                        }
                        if (files > 0) {
                            window.top.postMessage({
                                event: 'module.initfile',
                            }, '*');
                        } else {
                            window.top.postMessage({
                                event: 'preload.complete',
                            }, '*');
                            resolve();
                        }
                    }
                });

                window.top.postMessage({
                    event: 'module.initfs',
                }, '*');
            });

            if (!isMobile) {
                if (window.top === window) {
                    if (!window.location.href.includes('test.js-dos.com')) {
                        document.body.requestFullscreen(document.documentElement);
                    }
                } else {
                    window.top.postMessage({
                        event: 'request-fullscreen',
                    }, '*');
                }
                function lockMouseIfNeeded() {
                    if (!document.pointerLockElement && typeof Module !== 'undefined' && Module.canvas) {
                        Module.canvas.requestPointerLock({
                            unadjustedMovement: true,
                        }).catch(() => {
                            console.warn('Failed to lock in unadjusted movement mode');
                            Module.canvas.requestPointerLock().catch(() => {
                                console.error('Failed to lock in default mode');
                            });
                        });
                    }
                }
                document.addEventListener("mousedown", lockMouseIfNeeded, { capture: true });
                if (navigator.keyboard && navigator.keyboard.lock) {
                    try {
                        navigator.keyboard.lock(["Escape", "KeyW"]).catch(() => {});
                    } catch (e) {}
                }
            }
        },
        getAsyncUrl: (file) => new Promise((resolve, reject) => {
            file = file.replaceAll("\\", "/").replaceAll("//", "/");
            const listener = (event) => {
                const data = event.data;
                if (data.event === '>module.getasyncurl' && data.file === file) {
                    window.removeEventListener('message', listener);
                    if (data.data) {
                        const url = URL.createObjectURL(new Blob([data.data.buffer]));
                        resolve(url);
                    } else {
                        reject(new Error("File not found: " + file));
                    }
                }
            }
            window.addEventListener('message', listener);
            window.top.postMessage({
                event: 'module.getasyncurl',
                file,
            }, '*');
        }),
        mainCalled: async () => {
            try {
                // Initialize required directory trees in VFS
                const dirs = [
                    '/' + ASSET_PREFIX + '/models/gta3.img',
                    '/' + ASSET_PREFIX + '/models/coll',
                    '/' + ASSET_PREFIX + '/models/generic',
                    '/' + ASSET_PREFIX + '/anim',
                    '/' + ASSET_PREFIX + '/anim/cuts.img',
                    '/' + ASSET_PREFIX + '/audio',
                    '/' + ASSET_PREFIX + '/data',
                    '/' + ASSET_PREFIX + '/text',
                    '/' + ASSET_PREFIX + '/txd',
                    '/' + ASSET_PREFIX + '/skins',
                    '/vc-assets/local/models/gta3.img',
                    '/vc-assets/local/models/coll',
                    '/vc-assets/local/models/generic',
                    '/vc-assets/local/anim',
                    '/vc-assets/local/anim/cuts.img',
                    '/vc-assets/local/audio',
                    '/vc-assets/local/data',
                    '/vc-assets/local/text',
                    '/vc-assets/local/txd',
                    '/vc-assets/local/skins'
                ];
                for (const d of dirs) {
                    try {
                        Module.FS.mkdirTree(d);
                    } catch (e) {}
                }

                await Module.initFS();

                // Signal preload complete to host window
                if (window.top !== window) {
                    window.top.postMessage({ event: 'preload.complete' }, '*');
                }

                const currentIni = getRevcIni();

                try {
                    Module.FS.unlink("/vc-assets/local/revc.ini");
                } catch (e) {}
                try {
                    Module.FS.unlink("/" + ASSET_PREFIX + "/revc.ini");
                } catch (e) {}

                Module.FS.createDataFile("/vc-assets/local/revc.ini", 0, currentIni, currentIni.length);
                try {
                    Module.FS.createDataFile("/" + ASSET_PREFIX + "/revc.ini", 0, currentIni, currentIni.length);
                } catch (e) {}

                try {
                    Module.FS.chdir('/vc-assets/local');
                } catch (e) {
                    console.warn('[game.js] chdir to /vc-assets/local failed:', e);
                }

                Module['_async_main']();

                // Signal game.started once first frames begin rendering
                let framesRendered = 0;
                function notifyStartedOnRender() {
                    framesRendered++;
                    if (framesRendered >= 2) {
                        console.log('[game.js] Engine rendering active, notifying host');
                        if (window.top !== window) {
                            window.top.postMessage({ event: 'game.started' }, '*');
                        }
                        return;
                    }
                    requestAnimationFrame(notifyStartedOnRender);
                }
                requestAnimationFrame(notifyStartedOnRender);
            } catch (e) {
                console.error('mainCalled error:', e);
            }
        },
        syncRevcIni: () => {
            try {
                const path = Module.FS.lookupPath("/vc-assets/local/revc.ini");
                if (path && path.node && path.node.contents) {
                    localStorage.setItem('vcsky.revc.ini', textDecoder.decode(path.node.contents));
                }
            } catch (e) {
                console.error('syncRevcIni error:', e);
            }
        },
        preRun: [],
        postRun: [
            () => {
                console.log('[game.js] Module.postRun executed');
                if (window.top !== window) {
                    window.top.postMessage({ event: 'game.started' }, '*');
                }
            }
        ],
        print: (...args) => console.log(args.join(' ')),
        printErr: (...args) => console.error(args.join(' ')),
        canvas: function () {
            const canvas = document.getElementById('canvas');
            canvas.addEventListener('webglcontextlost', (e) => {
                statusElement.textContent = 'WebGL context lost. Please reload the page.';
                e.preventDefault();
            });
            return canvas;
        }(),
        setStatus,
        totalDependencies: 0,
        monitorRunDependencies: (num) => {
            Module.totalDependencies = Math.max(Module.totalDependencies, num);
            Module.setStatus(`Preparing... (${Module.totalDependencies - num}/${Module.totalDependencies})`);
        },
        hotelMission: () => {
            if (!haveOriginalGame) {
                showWasted();
                alert(t("cantContinuePlaying"));
                throw new Error(t("cantContinuePlaying"));
            }
        },
    };
    Module.log = Module.print;
    Module.instantiateWasm = async (
        info,
        receiveInstance,
    ) => {
        const wasm = await (await fetch(wasm_content ? wasm_content : "index.wasm")).arrayBuffer();
        const module = await WebAssembly.instantiate(wasm, info);
        return receiveInstance(module.instance, module);
    };
    Module.arguments = window.location.search
        .slice(1)
        .split('&')
        .filter(Boolean)
        .map(decodeURIComponent);
    window.onbeforeunload = function (event) {
        event.preventDefault();
        return '';
    };

    window.Module = Module;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'index.js';
    document.body.appendChild(script);

    document.body.classList.add('gameIsStarted');

    if (!window._gamepadEmulator) {
        try {
            window._gamepadEmulator = new GamepadEmulator();
            window._gamepad = window._gamepadEmulator.AddEmulatedGamepad(null, true);
        } catch (e) {
            console.warn('[game.js] GamepadEmulator initialization error:', e);
        }
    }
    const emulator = window._gamepadEmulator;
    const gamepad = window._gamepad;
    const gamepadEmulatorConfig = {
        directions: { up: true, down: true, left: true, right: true },
        dragDistance: 100,
        tapTarget: move,
        lockTargetWhilePressed: true,
        xAxisIndex: 0,
        yAxisIndex: 1,
        swapAxes: false,
        invertX: false,
        invertY: false,
    };
    emulator.AddDisplayJoystickEventListeners(0, [gamepadEmulatorConfig]);
    const gamepadEmulatorConfig1 = {
        directions: { up: true, down: true, left: true, right: true },
        dragDistance: 100,
        tapTarget: look,
        lockTargetWhilePressed: true,
        xAxisIndex: 2,
        yAxisIndex: 3,
        swapAxes: false,
        invertX: false,
        invertY: false,
    };
    emulator.AddDisplayJoystickEventListeners(0, [gamepadEmulatorConfig1]);

    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 9,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.menu'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 3,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.car.getIn'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 0,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.run'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 1,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.fist'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 5,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.drift'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 2,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.jump'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 4,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.mobile'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 11,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.job'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 4,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.radio'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 7,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.weapon'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 8,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.camera'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 10,
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.horn'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 7,
        buttonIndexes: [1, 7],
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.fireRight'),
    }]);
    emulator.AddDisplayButtonEventListeners(0, [{
        buttonIndex: 6,
        buttonIndexes: [1, 6],
        lockTargetWhilePressed: false,
        tapTarget: document.querySelector('.touch-control.fireLeft'),
    }]);
}

const clickToPlay = document.querySelector('.click-to-play');
const clickLink = clickToPlay.querySelector('button');
clickToPlay.addEventListener('click', (e) => {
    if (e.target === clickToPlay || e.target === clickLink) {
        startGame(e);
    } else if (window.top !== window) {
        window.top.postMessage({
            event: 'request-fullscreen',
        }, '*');
    }
});

const savesMountPoint = "/vc-assets/local/userfiles";
const savesFile = "vcsky.saves";
wrapIDBFS(console.log).addListener({
    onLoad: (_, mount) => {
        if (mount.mountpoint !== savesMountPoint) {
            return null;
        }
        const token = localStorage.getItem('vcsky.key');
        if (token && token.length === 5) {
            const promise = CloudSDK.pullFromStorage(token, savesFile);
            promise.then((payload) => {
                console.log('[IDBFS] onLoad', token, payload ? payload.length / 1024 : 0, 'kb');
            });
            return promise;
        }
        return null;
    },
    onSave: (getData, _, mount) => {
        if (mount.mountpoint !== savesMountPoint) {
            return;
        }
        const token = localStorage.getItem('vcsky.key');
        if (token && token.length === 5) {
            getData().then((payload) => {
                if (payload.length > 0) {
                    console.log('[IDBFS] onSave', token, payload.length / 1024, 'kb');
                    return CloudSDK.pushToStorage(token, savesFile, payload);
                }
            });
        }
    },
});


function updateToken(token) {
    cloudSavesStatus.textContent = t('checking');
    if (token.length === 5) {
        CloudSDK.resolveToken(token).then((profile) => {
            if (profile) {
                console.log('[CloudSdk] resolveToken', profile);
                localStorage.setItem('vcsky.key', profile.token);
                if (profile.premium) {
                    keyStatus.textContent = t('enabled');
                    keyStatus.style.color = 'green';
                    keyStatus.style.fontWeight = 'bold';
                } else {
                    keyStatus.textContent = t('disabled');
                    keyStatus.style.color = 'red';
                    keyStatus.style.fontWeight = 'bold';
                }
            } else {
                keyStatus.textContent = t('invalidKey');
                keyStatus.style.color = 'white';
                keyStatus.style.fontWeight = 'normal';
            }
        });
    } else {
        cloudSavesStatus.textContent = t('enterKey');
    }
}

const keyInput = document.querySelector('.jsdos-key-input');
keyInput.setAttribute('placeholder', t("enterJsDosKey"));
const keyStatus = document.querySelector('.jsdos-key-status');
keyInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        updateToken(e.target.value);
    }, 100);
});

keyInput.addEventListener('keyup', (e) => {
    updateToken(e.target.value);
});

if (localStorage.getItem('vcsky.key')) {
    keyInput.value = localStorage.getItem('vcsky.key');
    updateToken(keyInput.value);
} else {
    keyStatus.textContent = t('invalidKey');
    keyStatus.style.color = 'shite';
    keyStatus.style.fontWeight = 'normal';
}

const clickToPlayButton = document.getElementById('click-to-play-button');
clickToPlayButton.textContent = t('clickToPlayFull');
const cloudSavesLink = document.getElementById('cloud-saves-link');
cloudSavesLink.textContent = t('cloudSaves');
cloudSavesStatus.textContent = t('enterKey');
const developedBy = document.querySelector('.developed-by');
developedBy.innerHTML += t('ruTranslate');
const portBy = document.getElementById('port-by');
portBy.textContent = t('portBy');


const revc_iniDefault = `
[VideoMode]
Width=800
Height=600
Depth=32
Subsystem=0
Windowed=0
[Controller]
HeadBob1stPerson=0
HorizantalMouseSens=0.002500
InvertMouseVertically=1
DisableMouseSteering=1
Vibration=0
Method=${isTouch ? '1' : '0'}
InvertPad=0
JoystickName=
PadButtonsInited=0
[Audio]
SfxVolume=36
MusicVolume=37
MP3BoostVolume=0
Radio=0
SpeakerType=0
Provider=0
DynamicAcoustics=1
[Display]
Brightness=256
DrawDistance=1.800000
Subtitles=0
ShowHud=1
RadarMode=0
ShowLegends=0
PedDensity=1.200000
CarDensity=1.200000
CutsceneBorders=1
FreeCam=0
[Graphics]
AspectRatio=2
VSync=1
Trails=1
FrameLimiter=0
MultiSampling=0
IslandLoading=0
PS2AlphaTest=1
ColourFilter=2
MotionBlur=0
VehiclePipeline=0
NeoRimLight=0
NeoLightMaps=0
NeoRoadGloss=0
[General]
SkinFile=$$""
Language=0
DrawVersionText=0
NoMovies=0
[CustomPipesValues]
PostFXIntensity=1.000000
NeoVehicleShininess=1.000000
NeoVehicleSpecularity=1.000000
RimlightMult=1.000000
LightmapMult=1.000000
GlossMult=1.000000
[Rendering]
BackfaceCulling=1
NewRenderer=1
[Draw]
ProperScaling=1
FixRadar=1
FixSprites=1
[Bindings]
PED_FIREWEAPON=mouse:LEFT,2ndKbd:PAD5
PED_CYCLE_WEAPON_RIGHT=2ndKbd:PADENTER,mouse:WHLDOWN,kbd:E
PED_CYCLE_WEAPON_LEFT=kbd:PADDEL,mouse:WHLUP,2ndKbd:Q
GO_FORWARD=kbd:UP,2ndKbd:W
GO_BACK=kbd:DOWN,2ndKbd:S
GO_LEFT=2ndKbd:A,kbd:LEFT
GO_RIGHT=kbd:RIGHT,2ndKbd:D
PED_SNIPER_ZOOM_IN=kbd:PGUP,2ndKbd:Z,mouse:WHLUP
PED_SNIPER_ZOOM_OUT=kbd:PGDN,2ndKbd:X,mouse:WHLDOWN
VEHICLE_ENTER_EXIT=kbd:ENTER,2ndKbd:F
CAMERA_CHANGE_VIEW_ALL_SITUATIONS=kbd:HOME,2ndKbd:V
PED_JUMPING=kbd:RCTRL,2ndKbd:SPC
PED_SPRINT=2ndKbd:LSHIFT,kbd:RSHIFT
PED_LOOKBEHIND=2ndKbd:CAPSLK,mouse:MIDDLE,kbd:PADINS
PED_DUCK=kbd:C
PED_ANSWER_PHONE=kbd:TAB
VEHICLE_FIREWEAPON=kbd:PADINS,2ndKbd:LCTRL,mouse:LEFT
VEHICLE_ACCELERATE=2ndKbd:W
VEHICLE_BRAKE=2ndKbd:S
VEHICLE_CHANGE_RADIO_STATION=kbd:INS,2ndKbd:R
VEHICLE_HORN=2ndKbd:LSHIFT,kbd:RSHIFT
TOGGLE_SUBMISSIONS=kbd:PLUS,2ndKbd:CAPSLK
VEHICLE_HANDBRAKE=kbd:RCTRL,2ndKbd:SPC,mouse:RIGHT
PED_1RST_PERSON_LOOK_LEFT=kbd:PADLEFT
PED_1RST_PERSON_LOOK_RIGHT=kbd:PADHOME
VEHICLE_LOOKLEFT=kbd:PADEND,2ndKbd:Q
VEHICLE_LOOKRIGHT=kbd:PADDOWN,2ndKbd:E
VEHICLE_LOOKBEHIND=mouse:MIDDLE
VEHICLE_TURRETLEFT=kbd:PADLEFT
VEHICLE_TURRETRIGHT=kbd:PAD5
VEHICLE_TURRETUP=kbd:PADPGUP,2ndKbd:UP
VEHICLE_TURRETDOWN=kbd:PADRIGHT,2ndKbd:DOWN
PED_CYCLE_TARGET_LEFT=kbd:[,2ndKbd:PADEND
PED_CYCLE_TARGET_RIGHT=2ndKbd:],kbd:PADDOWN
PED_CENTER_CAMERA_BEHIND_PLAYER=kbd:#
PED_LOCK_TARGET=kbd:DEL,mouse:RIGHT,2ndKbd:PADRIGHT
NETWORK_TALK=kbd:T
PED_1RST_PERSON_LOOK_UP=kbd:PADPGUP
PED_1RST_PERSON_LOOK_DOWN=kbd:PADUP
_CONTROLLERACTION_36=
TOGGLE_DPAD=
SWITCH_DEBUG_CAM_ON=
TAKE_SCREEN_SHOT=
SHOW_MOUSE_POINTER_TOGGLE=
UNKNOWN_ACTION=

`;

function getRevcIni() {
    let ini = localStorage.getItem('vcsky.revc.ini');
    if (ini) {
        // Enforce Auto Aspect Ratio (AspectRatio=2) to prevent wide/fat stretching
        ini = ini.replace(/AspectRatio=\d+/g, 'AspectRatio=2');
        // Enforce safe 800x600 VideoMode so reVC doesn't crash on invalid mode index
        ini = ini.replace(/Width=\d+/g, 'Width=800');
        ini = ini.replace(/Height=\d+/g, 'Height=600');
        localStorage.setItem('vcsky.revc.ini', ini);
        return ini;
    }
    return revc_iniDefault;
}

const revc_ini = getRevcIni();