// ---------------------------------------------
// Tap to Move — Pixel Art Game
// ---------------------------------------------
// Put your pixel art files in an "assets" folder
// next to this script, e.g.:
//   assets/map.png     <- the game map / background
//   assets/player.png  <- the player sprite (single frame, 16x16 works well)
// If assets are missing, colored placeholders are drawn instead,
// so the game still runs while you're preparing your art.
// ---------------------------------------------

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Internal game resolution (kept small on purpose for that pixel-art look).
// Change these to match your map.png's actual pixel size.
const GAME_WIDTH = 320;
const GAME_HEIGHT = 180;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Scale the canvas up to fill the screen while keeping pixels crisp.
function resize() {
  const scale = Math.floor(
    Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT)
  ) || 1;
  canvas.style.width = GAME_WIDTH * scale + 'px';
  canvas.style.height = GAME_HEIGHT * scale + 'px';
}
window.addEventListener('resize', resize);
resize();

// ---------------------------------------------
// Asset loading
// ---------------------------------------------
const assets = {};
function loadImage(name, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { assets[name] = img; resolve(img); };
    img.onerror = () => {
      console.warn(`Missing asset "${src}", using placeholder graphics instead.`);
      assets[name] = null;
      resolve(null);
    };
    img.src = src;
  });
}

Promise.all([
  loadImage('map', 'assets/map.png'),
  loadImage('player', 'assets/player.png'),
]).then(() => {
  requestAnimationFrame(loop);
});

// ---------------------------------------------
// Player state
// ---------------------------------------------
const player = {
  x: GAME_WIDTH / 2,
  y: GAME_HEIGHT / 2,
  targetX: GAME_WIDTH / 2,
  targetY: GAME_HEIGHT / 2,
  speed: 60,   // pixels per second
  width: 16,
  height: 16,
};

// ---------------------------------------------
// Input: tap / click to set a destination
// ---------------------------------------------
function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = GAME_WIDTH / rect.width;
  const scaleY = GAME_HEIGHT / rect.height;

  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function handleTap(e) {
  e.preventDefault();
  const pos = getPointerPos(e);
  player.targetX = Math.max(0, Math.min(GAME_WIDTH, pos.x));
  player.targetY = Math.max(0, Math.min(GAME_HEIGHT, pos.y));
}

canvas.addEventListener('mousedown', handleTap);
canvas.addEventListener('touchstart', handleTap, { passive: false });

// ---------------------------------------------
// Update
// ---------------------------------------------
function update(dt) {
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 1) {
    const moveDist = player.speed * dt;
    if (moveDist >= dist) {
      player.x = player.targetX;
      player.y = player.targetY;
    } else {
      player.x += (dx / dist) * moveDist;
      player.y += (dy / dist) * moveDist;
    }
  }
}

// ---------------------------------------------
// Draw
// ---------------------------------------------
function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Map / background
  if (assets.map) {
    ctx.drawImage(assets.map, 0, 0, GAME_WIDTH, GAME_HEIGHT);
  } else {
    ctx.fillStyle = '#4a7a4a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // Destination marker (small pulsing dot), only while still moving
  const distToTarget = Math.hypot(player.targetX - player.x, player.targetY - player.y);
  if (distToTarget > 1) {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(player.targetX, player.targetY, 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Player
  if (assets.player) {
    ctx.drawImage(
      assets.player,
      player.x - player.width / 2,
      player.y - player.height / 2,
      player.width,
      player.height
    );
  } else {
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(player.x - 8, player.y - 8, 16, 16);
  }
}

// ---------------------------------------------
// Main loop
// ---------------------------------------------
let lastTime = 0;
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}
