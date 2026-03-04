// 8-bit retro mountain country scene drawn on canvas
export function drawPixelScene(canvas) {
  const ctx = canvas.getContext('2d');
  const W = 320, H = 140;

  // Sky gradient (dark night)
  for (let y = 0; y < 80; y++) {
    const t = y / 80;
    const r = Math.floor(12 + t * 20);
    const g = Math.floor(8 + t * 18);
    const b = Math.floor(35 + t * 30);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, W, 1);
  }

  // Stars
  const stars = [
    [30,8],[55,15],[90,5],[120,20],[150,10],[180,25],[210,8],[245,18],[270,12],[300,6],
    [15,28],[70,32],[140,35],[200,14],[260,30],[45,42],[170,38],[290,22],[110,45],[230,40],
    [20,55],[80,50],[160,58],[240,52],[310,48],[50,62],[130,56],[195,65],[275,60],[100,68],
  ];
  stars.forEach(([x, y]) => {
    const bright = 150 + Math.floor(Math.random() * 105);
    ctx.fillStyle = `rgb(${bright},${bright},${Math.min(255, bright + 30)})`;
    ctx.fillRect(x, y, 1, 1);
    if (Math.random() > 0.6) ctx.fillRect(x + 1, y, 1, 1);
  });

  // Moon
  px(ctx, 260, 15, '#fffde0', 6);
  px(ctx, 261, 16, '#2a1c10', 4); // crescent shadow

  // Far mountains (dark blue-grey)
  drawMountain(ctx, -20, 55, 120, 30, '#1a2640');
  drawMountain(ctx, 60, 50, 140, 35, '#1e2d4a');
  drawMountain(ctx, 160, 52, 130, 33, '#1a2640');
  drawMountain(ctx, 240, 48, 120, 37, '#1e2d4a');

  // Near mountains (darker green-brown)
  drawMountain(ctx, -30, 65, 150, 30, '#1a3020');
  drawMountain(ctx, 80, 60, 160, 35, '#1f3828');
  drawMountain(ctx, 200, 62, 160, 33, '#1a3020');

  // Ground
  ctx.fillStyle = '#1a2a12';
  ctx.fillRect(0, 85, W, 55);
  ctx.fillStyle = '#15220e';
  ctx.fillRect(0, 95, W, 45);

  // Ground texture
  for (let i = 0; i < 60; i++) {
    const gx = Math.floor(Math.random() * W);
    const gy = 86 + Math.floor(Math.random() * 50);
    ctx.fillStyle = Math.random() > 0.5 ? '#1e3016' : '#162810';
    ctx.fillRect(gx, gy, 2, 1);
  }

  // Creek/stream
  ctx.fillStyle = '#2a4a6a';
  for (let x = 0; x < W; x++) {
    const y = 115 + Math.sin(x * 0.05) * 2;
    ctx.fillRect(x, Math.floor(y), 1, 2);
  }
  // Creek shimmer
  for (let i = 0; i < 15; i++) {
    const sx = Math.floor(Math.random() * W);
    ctx.fillStyle = '#4a7a9a';
    ctx.fillRect(sx, 115 + Math.floor(Math.sin(sx * 0.05) * 2), 2, 1);
  }

  // Trees (background, smaller)
  drawTree(ctx, 20, 78, 6);
  drawTree(ctx, 45, 80, 5);
  drawTree(ctx, 75, 76, 7);
  drawTree(ctx, 250, 79, 6);
  drawTree(ctx, 280, 77, 7);
  drawTree(ctx, 305, 80, 5);

  // Cabin
  drawCabin(ctx, 130, 85);

  // Still (next to cabin)
  drawStill(ctx, 180, 90);

  // Trees (foreground, larger)
  drawTree(ctx, 5, 90, 10);
  drawTree(ctx, 35, 92, 8);
  drawTree(ctx, 95, 88, 9);
  drawTree(ctx, 220, 89, 9);
  drawTree(ctx, 260, 91, 10);
  drawTree(ctx, 295, 88, 8);

  // Fireflies
  const fireflies = [[60,95],[110,100],[200,98],[240,105],[155,108],[80,110],[170,95]];
  fireflies.forEach(([x, y]) => {
    ctx.fillStyle = '#ffee88';
    ctx.fillRect(x, y, 1, 1);
  });

  // Chimney smoke (drifting pixels)
  ctx.fillStyle = 'rgba(180,170,160,0.4)';
  const smokeX = 152;
  for (let i = 0; i < 8; i++) {
    const sx = smokeX + Math.floor(Math.sin(i * 1.2) * 3) + i;
    const sy = 72 - i * 3;
    ctx.fillRect(sx, sy, 2, 1);
    if (i > 2) ctx.fillRect(sx + 1, sy - 1, 1, 1);
  }

  // Animate stars twinkling + fireflies
  let frame = 0;
  function animate() {
    frame++;
    // Twinkle a few stars
    if (frame % 20 === 0) {
      const s = stars[Math.floor(Math.random() * stars.length)];
      const on = Math.random() > 0.3;
      ctx.fillStyle = on ? `rgb(${180 + Math.floor(Math.random() * 75)},${180 + Math.floor(Math.random() * 75)},${220 + Math.floor(Math.random() * 35)})` : '#0c0820';
      ctx.fillRect(s[0], s[1], 1, 1);
    }
    // Fireflies blink
    if (frame % 30 === 0) {
      const f = fireflies[Math.floor(Math.random() * fireflies.length)];
      ctx.fillStyle = Math.random() > 0.4 ? '#ffee88' : '#1a2a12';
      ctx.fillRect(f[0], f[1], 1, 1);
    }
    // Smoke drift
    if (frame % 40 === 0) {
      // Redraw smoke area
      const gradient = ctx.createLinearGradient(0, 50, 0, 75);
      gradient.addColorStop(0, '#0e0c22');
      gradient.addColorStop(1, '#1a2640');
      ctx.fillStyle = gradient;
      ctx.fillRect(148, 48, 20, 28);
      ctx.fillStyle = 'rgba(180,170,160,0.35)';
      const offset = Math.sin(frame * 0.1) * 2;
      for (let i = 0; i < 8; i++) {
        const sx = smokeX + Math.floor(Math.sin(i * 1.2 + offset) * 3) + i;
        const sy = 72 - i * 3;
        ctx.fillRect(sx, sy, 2, 1);
        if (i > 3) ctx.fillRect(sx + 1, sy - 1, 1, 1);
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// Helpers
function px(ctx, x, y, color, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
}

function drawMountain(ctx, x, peakY, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, peakY + height);
  ctx.lineTo(x + width / 2, peakY);
  ctx.lineTo(x + width, peakY + height);
  ctx.closePath();
  ctx.fill();

  // Snow cap
  ctx.fillStyle = '#c8c8d0';
  ctx.beginPath();
  ctx.moveTo(x + width / 2 - 8, peakY + 6);
  ctx.lineTo(x + width / 2, peakY);
  ctx.lineTo(x + width / 2 + 8, peakY + 6);
  ctx.closePath();
  ctx.fill();
}

function drawTree(ctx, x, baseY, h) {
  // Trunk
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(x, baseY - 2, 2, 4);

  // Canopy (triangle layers)
  const layers = Math.floor(h / 3);
  for (let i = 0; i < layers; i++) {
    const ly = baseY - 3 - i * 3;
    const lw = (layers - i) * 2 + 2;
    const shade = i % 2 === 0 ? '#1a4a22' : '#22582a';
    ctx.fillStyle = shade;
    ctx.fillRect(x + 1 - lw / 2, ly, lw, 3);
  }
}

function drawCabin(ctx, x, y) {
  // Walls
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(x, y - 12, 24, 14);
  // Log lines
  ctx.fillStyle = '#4a2e18';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x, y - 12 + i * 3, 24, 1);
  }
  // Roof
  ctx.fillStyle = '#3a2210';
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 12);
  ctx.lineTo(x + 12, y - 22);
  ctx.lineTo(x + 27, y - 12);
  ctx.closePath();
  ctx.fill();
  // Door
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(x + 9, y - 8, 5, 10);
  // Window (lit)
  ctx.fillStyle = '#ffcc44';
  ctx.fillRect(x + 3, y - 9, 4, 3);
  ctx.fillStyle = '#ffaa22';
  ctx.fillRect(x + 17, y - 9, 4, 3);
  // Chimney
  ctx.fillStyle = '#6a4a30';
  ctx.fillRect(x + 20, y - 26, 4, 10);
}

function drawStill(ctx, x, y) {
  // Copper pot
  ctx.fillStyle = '#b87333';
  ctx.fillRect(x, y - 6, 10, 8);
  ctx.fillRect(x + 1, y - 8, 8, 2);
  // Copper coil pipe
  ctx.fillStyle = '#d4944a';
  ctx.fillRect(x + 10, y - 5, 8, 2);
  ctx.fillRect(x + 16, y - 5, 2, 6);
  ctx.fillRect(x + 12, y - 1, 6, 2);
  // Fire underneath
  ctx.fillStyle = '#ff6622';
  ctx.fillRect(x + 2, y + 2, 3, 2);
  ctx.fillStyle = '#ffaa22';
  ctx.fillRect(x + 5, y + 2, 3, 2);
  ctx.fillStyle = '#ff4400';
  ctx.fillRect(x + 3, y + 1, 2, 1);
  // Barrel
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(x + 20, y - 4, 6, 6);
  ctx.fillStyle = '#4a2e18';
  ctx.fillRect(x + 20, y - 2, 6, 1);
}
