// Static pixel art night scene for overlay backgrounds
// Replace this with a custom image later by swapping to an <img> element

export function drawNightScene(canvas) {
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  const W = 320, H = 180;

  // Sky gradient
  for (let y = 0; y < 100; y++) {
    const t = y / 100;
    ctx.fillStyle = `rgb(${Math.floor(8 + t * 18)},${Math.floor(6 + t * 14)},${Math.floor(28 + t * 30)})`;
    ctx.fillRect(0, y, W, 1);
  }

  // Stars (deterministic)
  let seed = 12345;
  function rng() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rng() * W), y = Math.floor(rng() * 85);
    ctx.globalAlpha = 0.3 + rng() * 0.6;
    ctx.fillRect(x, y, 1, 1);
    if (rng() > 0.75) ctx.fillRect(x + 1, y, 1, 1);
  }
  ctx.globalAlpha = 1;

  // Crescent moon
  ctx.fillStyle = '#fffde0';
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -6; dx <= 6; dx++)
      if (dx * dx + dy * dy <= 36 && !((dx + 3) * (dx + 3) + (dy - 2) * (dy - 2) <= 36))
        ctx.fillRect(265 + dx, 20 + dy, 1, 1);

  // Moon glow
  ctx.fillStyle = 'rgba(255,253,224,0.05)';
  for (let dy = -16; dy <= 16; dy++)
    for (let dx = -16; dx <= 16; dx++)
      if (dx * dx + dy * dy <= 256) ctx.fillRect(265 + dx, 20 + dy, 1, 1);

  // Far mountains
  ctx.fillStyle = '#151e35';
  ctx.beginPath();
  ctx.moveTo(0, 75);
  [[40, 55], [80, 68], [120, 50], [160, 62], [200, 48], [240, 58], [280, 52], [320, 65]].forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(320, H); ctx.lineTo(0, H); ctx.fill();

  // Near mountains
  ctx.fillStyle = '#101828';
  ctx.beginPath();
  ctx.moveTo(0, 82);
  [[35, 70], [70, 78], [105, 65], [140, 72], [175, 60], [210, 70], [250, 62], [290, 72], [320, 80]].forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(320, H); ctx.lineTo(0, H); ctx.fill();

  // Tree line
  ctx.fillStyle = '#0a1215';
  for (let x = 0; x < W; x += 4) {
    const h = 6 + (x * 7 % 9), base = 90 + (x * 3 % 6);
    for (let t = 0; t < h; t++) {
      const w = Math.max(1, Math.floor(t * 0.5));
      ctx.fillRect(x + 2 - w, base - t, w * 2 + 1, 1);
    }
  }

  // Ground
  ctx.fillStyle = '#080e12';
  ctx.fillRect(0, 100, W, 80);
  ctx.fillStyle = '#060a0e';
  ctx.fillRect(0, 115, W, 65);

  // Cabin
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(140, 92, 25, 14);
  ctx.fillStyle = '#1c1008';
  for (let i = 0; i < 6; i++) ctx.fillRect(138 - i, 92 - i, 27 + i * 2, 1);
  ctx.fillStyle = '#ffaa33';
  ctx.fillRect(143, 95, 4, 3);
  ctx.fillRect(157, 95, 4, 3);
  ctx.fillStyle = '#ffcc66';
  ctx.fillRect(144, 96, 2, 1);
  ctx.fillRect(158, 96, 2, 1);
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(158, 83, 4, 9);

  // Still
  ctx.fillStyle = '#8a5524';
  ctx.fillRect(175, 98, 10, 8);
  ctx.fillStyle = '#b87333';
  ctx.fillRect(176, 96, 8, 2);
  ctx.fillStyle = '#ff5500';
  ctx.fillRect(177, 106, 3, 2);
  ctx.fillStyle = '#ffaa00';
  ctx.fillRect(180, 106, 3, 2);

  // Fireflies
  [[100, 100], [120, 95], [200, 102], [250, 98], [80, 105], [175, 94]].forEach(([x, y]) => {
    ctx.fillStyle = `rgba(170,255,68,${0.4 + rng() * 0.5})`;
    ctx.fillRect(x, y, 1, 1);
  });
}
