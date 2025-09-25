const coin = document.getElementById('coin');
const tossBtn = document.getElementById('toss-button');
const result = document.querySelector('.result');

// History UI
const historyList = document.getElementById('history-list');
let tossCount = 0;
function addToHistory(face){
  if (!historyList) return;
  tossCount += 1;
  const li = document.createElement('li');

  const idx = document.createElement('span');
  idx.className = 'badge-pill';
  idx.textContent = `#${tossCount}`;

  const faceEl = document.createElement('span');
  faceEl.className = `history-face ${face.toLowerCase()}`;
  faceEl.textContent = face;

  li.appendChild(idx);
  li.appendChild(faceEl);
  historyList.insertAdjacentElement('afterbegin', li);
}


let currentAngle = 0; // Track current rotation in degrees

function startToss(){
    if (tossBtn) tossBtn.disabled = true;
    document.body.classList.add('no-scroll');
    result.style.opacity = 0;

    const randomVal = Math.random();
    const isHeads = randomVal < 0.5;
    const face = isHeads ? 'Heads' : 'Tails';

    // Random spins between 5 and 10
    const spins = Math.floor(Math.random() * 6) + 5;

    // Base rotation
    let extraRotation = spins * 360;

    // Target final side
    const targetAngle = isHeads ? 0 : 180;

    // Final angle adjustment
    currentAngle += extraRotation;
    if ((currentAngle % 360) !== targetAngle) {
        currentAngle += (targetAngle - (currentAngle % 360));
    }

    // Duration based on number of spins
    const duration = spins * 500; // Increased base duration

    // Animate main coin flip
    coin.style.transition = `transform ${duration}ms cubic-bezier(0.4, 2.5, 0.6, 0.5),
                              scale ${duration}ms ease-in-out,
                              box-shadow ${duration}ms ease-in-out`;
    coin.style.transform = `rotateY(${currentAngle}deg) scale(1.3)`;
    coin.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.5)`;

    // Midway shrink
    setTimeout(() => {
        coin.style.transform = `rotateY(${currentAngle}deg) scale(1)`;
        coin.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.2)`;
    }, duration / 2);

    // After full spin, do little wiggle
    setTimeout(() => {
        // Set transition to fast for wiggle
        coin.style.transition = `transform 150ms ease-in-out`;

        // Wiggle sequence
        coin.style.transform = `rotateY(${currentAngle + 2}deg)`;
        setTimeout(() => {
            coin.style.transform = `rotateY(${currentAngle - 2}deg)`;
            setTimeout(() => {
                coin.style.transform = `rotateY(${currentAngle}deg)`;
            }, 150);
        }, 150);

        // Finally show the result
        setTimeout(() => {
            result.textContent = `${face}`; // no "Result:" prefix
            result.style.opacity = 1;
            addToHistory(face);
            if (tossBtn) tossBtn.disabled = false;
            document.body.classList.remove('no-scroll');
        }, 500); // Allow wiggle to finish
    }, duration);
}

// Bindings: button, coin click, and keyboard (Enter/Space) on coin
if (tossBtn) tossBtn.addEventListener('click', startToss);
coin.addEventListener('click', startToss);
coin.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    startToss();
  }
});
// ===== Fullscreen toggle =====
const fsBtn = document.getElementById('fs-toggle');

function isFullscreen(){
  return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
}
function requestFs(el){
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
}
function exitFs(){
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
}
function syncFsButton(){
  if (!fsBtn) return;
  const active = !!isFullscreen();
  fsBtn.setAttribute('data-state', active ? 'exit' : 'enter');
  fsBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  fsBtn.setAttribute('title', active ? 'Exit fullscreen' : 'Enter fullscreen');
}
function toggleFullscreen(){
  if (isFullscreen()) {
    exitFs();
  } else {
    // use the root app as target for better iOS behavior
    const target = document.documentElement;
    requestFs(target);
  }
}

if (fsBtn){
  fsBtn.addEventListener('click', toggleFullscreen);
  fsBtn.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFullscreen(); }
  });
  // initialize
  syncFsButton();
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, syncFsButton);
  });
}


// ===== Fullscreen toggle (robust init) =====
function setupFsButton(){
  const fsBtnLocal = document.getElementById('fs-toggle');
  if (!fsBtnLocal || fsBtnLocal.dataset.wired === '1') return;

  function isFullscreen(){
    return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
  }
  function requestFs(el){
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
    if (el.msRequestFullscreen) return el.msRequestFullscreen();
  }
  function exitFs(){
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
  }
  function syncFsButton(){
    const active = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    fsBtnLocal.setAttribute('data-state', active ? 'exit' : 'enter');
    fsBtnLocal.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    fsBtnLocal.setAttribute('title', active ? 'Exit fullscreen' : 'Enter fullscreen');
  }
  function toggleFullscreen(){
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
      exitFs();
    } else {
      const target = document.documentElement;
      requestFs(target);
    }
  }

  fsBtnLocal.addEventListener('click', toggleFullscreen);
  fsBtnLocal.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFullscreen(); }
  });
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, syncFsButton);
  });
  syncFsButton();
  fsBtnLocal.dataset.wired = '1';
}

// Try to wire immediately (in case button is already present)
setupFsButton();
// Also wire on DOMContentLoaded in case script ran before button existed
document.addEventListener('DOMContentLoaded', setupFsButton);

