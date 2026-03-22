import * as THREE from 'three';

// ===== History UI =====
const historyList = document.getElementById('history-list');
let tossCount = 0;

function addToHistory(face) {
  if (!historyList) return;
  tossCount += 1;

  const item = document.createElement('div');
  item.className = `history-item ${face.toLowerCase()}`;
  item.setAttribute('aria-label', `Toss #${tossCount}: ${face}`);
  item.textContent = `#${tossCount} – ${face}`;
  historyList.prepend(item);
}

// ===== Audio =====
const coinFlipSound = new Audio('audio/coin-flip.mp3');
const coinLandSound = new Audio('audio/coin-land.mp3');

// ===== Three.js Coin Setup =====
const coinWrap = document.querySelector('.coin-wrap');
const resultEl  = document.querySelector('.result');
const tossBtn   = document.getElementById('toss-button');

// Create the WebGL canvas and give it button-like accessibility attributes
const canvas = document.createElement('canvas');
canvas.setAttribute('tabindex', '0');
canvas.setAttribute('role', 'button');
canvas.setAttribute('aria-live', 'polite');
canvas.setAttribute('aria-label', 'Coin – click or press Enter/Space to toss');
canvas.setAttribute('aria-pressed', 'false');
coinWrap.appendChild(canvas);

// Scene
const scene = new THREE.Scene();

// Camera – lookAt raised so the coin renders ~20% lower in the canvas
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 3.5, 3.5);
camera.lookAt(0, 0.7, 0);

// Renderer (transparent background so page background shows through)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---- Responsive resize ----
function onResize() {
  const w = coinWrap.clientWidth;
  const h = coinWrap.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// Prefer ResizeObserver for container-level responsiveness
if (window.ResizeObserver) {
  new ResizeObserver(onResize).observe(coinWrap);
} else {
  window.addEventListener('resize', onResize);
}
onResize();

// ===== Lighting =====
// Soft ambient fill
const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

// Main key light (sun-like, casts shadows)
const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// Warm accent (golden rim reflections)
const fillLight = new THREE.PointLight(0xffd080, 1.6, 25);
fillLight.position.set(-3, 2, 3);
scene.add(fillLight);

// Subtle back-light for edge definition
const backLight = new THREE.PointLight(0x6699ff, 0.7, 20);
backLight.position.set(0, -4, -4);
scene.add(backLight);

// Front fill light for face brightness
const frontFill = new THREE.PointLight(0xffffff, 0.35, 20);
frontFill.position.set(0, 2, 5);
scene.add(frontFill);

// ===== Coin Geometry =====
const COIN_RADIUS   = 1.0;
const COIN_THICKNESS = 0.09;
const COIN_SEGMENTS  = 128;

// CylinderGeometry groups: [0] = side/rim, [1] = top cap (+Y), [2] = bottom cap (-Y)
const coinGeometry = new THREE.CylinderGeometry(
  COIN_RADIUS,
  COIN_RADIUS,
  COIN_THICKNESS,
  COIN_SEGMENTS,
  1,
  false
);

// ===== Textures =====
const textureLoader = new THREE.TextureLoader();
const headsTexture = textureLoader.load('img/heads.png');
const tailsTexture = textureLoader.load('img/tails.png');

// Enable sRGB color space for accurate color rendering
headsTexture.colorSpace = THREE.SRGBColorSpace;
tailsTexture.colorSpace  = THREE.SRGBColorSpace;

// The bottom cap UV is mirrored relative to how we view it when the coin is flipped,
// so flip the tails texture vertically to compensate.
// Rotating the coin 180° around X negates Z, which maps to the V axis in UV space.
tailsTexture.wrapT = THREE.RepeatWrapping;
tailsTexture.repeat.set(1, -1);
tailsTexture.offset.set(0, 1);

// ===== Materials =====
// Metallic gold rim
const rimMaterial = new THREE.MeshStandardMaterial({
  color: 0xDEAC24,
  metalness: 0.93,
  roughness: 0.12,
});

// Heads face (top cap, +Y)
const headsMaterial = new THREE.MeshStandardMaterial({
  map: headsTexture,
  metalness: 0.38,
  roughness: 0.26,
  emissive: 0x332200,
  emissiveIntensity: 0.08,
});

// Tails face (bottom cap, -Y)
const tailsMaterial = new THREE.MeshStandardMaterial({
  map: tailsTexture,
  metalness: 0.38,
  roughness: 0.26,
  emissive: 0x332200,
  emissiveIntensity: 0.08,
});

// Build the coin mesh with a per-group material array
const coinMesh = new THREE.Mesh(coinGeometry, [rimMaterial, headsMaterial, tailsMaterial]);
coinMesh.castShadow = true;
scene.add(coinMesh);

// ===== Main Render Loop =====
let isTossing = false;  // is a toss animation running?

function mainLoop() {
  // Gentle idle Y rotation when not tossing
  if (!isTossing) {
    coinMesh.rotation.y += 0.004;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(mainLoop);
}
mainLoop();

// ===== Easing helpers =====
const TWO_PI = Math.PI * 2;

function easeInOut(t) {
  // Smooth step (cubic ease-in-out)
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ===== Toss Animation =====
function startToss() {
  if (isTossing) return;
  isTossing = true;

  if (tossBtn) tossBtn.disabled = true;
  document.body.classList.add('no-scroll');
  resultEl.style.opacity = 0;
  canvas.setAttribute('aria-pressed', 'true');

  coinFlipSound.currentTime = 0;
  coinFlipSound.play().catch(() => {});

  // 50/50 random result
  const isHeads = Math.random() < 0.5;
  const face     = isHeads ? 'Heads' : 'Tails';

  // Random spin count (5–10 full rotations) drives duration
  const spins    = Math.floor(Math.random() * 6) + 5;
  const duration = spins * 500; // 2500–5000 ms

  // ---- Calculate final X rotation ----
  // rotation.x = 0   (mod 2π) → top cap (heads) faces +Y → visible to camera
  // rotation.x = π   (mod 2π) → bottom cap (tails) faces +Y → visible to camera
  const startXRot     = coinMesh.rotation.x;
  const startYRot     = coinMesh.rotation.y;
  const targetFaceAngle = isHeads ? 0 : Math.PI;
  const normalizedStart = ((startXRot % TWO_PI) + TWO_PI) % TWO_PI;
  let extra = (targetFaceAngle - normalizedStart + TWO_PI) % TWO_PI;
  // Guarantee at least a meaningful tail-off angle so the landing looks clean
  if (extra < Math.PI * 0.15) extra += TWO_PI;
  const totalXRot  = spins * TWO_PI + extra;
  const finalXRot  = startXRot + totalXRot;

  // Arc height (world units)
  const MAX_HEIGHT = 1.8;

  // Wobble amplitudes (adds Y/Z rotation during flight for realism)
  const wobbleY = 0.18;
  const wobbleZ = 0.12;

  const startTime = performance.now();

  // ---- Settle / bounce phase ----
  let settling    = false;
  let settleStart = 0;
  const SETTLE_DURATION = 380;

  function animate() {
    const elapsed = performance.now() - startTime;

    if (!settling) {
      // ---- Toss phase ----
      const t = Math.min(elapsed / duration, 1.0);

      // Parabolic arc: peaks at t = 0.5
      coinMesh.position.y = MAX_HEIGHT * Math.sin(t * Math.PI);

      // Rotation with ease-in-out spreading over the full flight
      coinMesh.rotation.x = startXRot + totalXRot * easeInOut(t);

      // Side-wobble (Y and Z) gives the coin a tumbling feel
      coinMesh.rotation.y = startYRot + Math.sin(t * Math.PI * spins * 1.1) * wobbleY;
      coinMesh.rotation.z = Math.sin(t * Math.PI * spins * 0.7) * wobbleZ;

      if (t >= 1.0) {
        // Land: snap to canonical final rotation
        coinMesh.rotation.x = finalXRot;
        coinMesh.rotation.y = 0;
        coinMesh.rotation.z = 0;
        coinMesh.position.y = 0;

        settling    = true;
        settleStart = performance.now();
      }
    } else {
      // ---- Settle / bounce phase ----
      const st = Math.min((performance.now() - settleStart) / SETTLE_DURATION, 1.0);

      // Decaying oscillation simulates a coin bouncing to rest
      coinMesh.position.y = Math.sin(st * Math.PI * 2.5) * 0.12 * (1 - st);

      if (st >= 1.0) {
        coinMesh.position.y = 0;

        // Normalize accumulated X rotation so it doesn't grow unbounded
        coinMesh.rotation.x = isHeads ? 0 : Math.PI;

        // Show result
        resultEl.textContent  = face;
        resultEl.classList.remove('heads', 'tails');
        resultEl.classList.add(face.toLowerCase());
        resultEl.style.opacity = 1;
        addToHistory(face);

        coinLandSound.currentTime = 0;
        coinLandSound.play().catch(() => {});

        canvas.setAttribute('aria-pressed', 'false');
        if (tossBtn) tossBtn.disabled = false;
        document.body.classList.remove('no-scroll');

        isTossing = false;
        return; // end animation loop
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// ===== Event Bindings =====
canvas.addEventListener('click', startToss);
canvas.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    startToss();
  }
});
if (tossBtn) tossBtn.addEventListener('click', startToss);

// ===== Fullscreen Toggle =====
function setupFsButton() {
  const fsBtn = document.getElementById('fs-toggle');
  if (!fsBtn || fsBtn.dataset.wired === '1') return;

  function isFullscreen() {
    return document.fullscreenElement
      || document.webkitFullscreenElement
      || document.mozFullScreenElement
      || document.msFullscreenElement;
  }
  function requestFs(el) {
    if (el.requestFullscreen)       return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.mozRequestFullScreen)    return el.mozRequestFullScreen();
    if (el.msRequestFullscreen)     return el.msRequestFullscreen();
  }
  function exitFs() {
    if (document.exitFullscreen)       return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen)  return document.mozCancelFullScreen();
    if (document.msExitFullscreen)     return document.msExitFullscreen();
  }
  function syncFsButton() {
    const active = !!isFullscreen();
    fsBtn.setAttribute('data-state', active ? 'exit' : 'enter');
    fsBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    fsBtn.setAttribute('title',      active ? 'Exit fullscreen' : 'Enter fullscreen');
  }
  function toggleFullscreen() {
    if (isFullscreen()) { exitFs(); } else { requestFs(document.documentElement); }
  }

  fsBtn.addEventListener('click', toggleFullscreen);
  fsBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFullscreen(); }
  });
  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
    .forEach(evt => document.addEventListener(evt, syncFsButton));
  syncFsButton();
  fsBtn.dataset.wired = '1';
}

setupFsButton();