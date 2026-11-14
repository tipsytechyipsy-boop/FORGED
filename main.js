const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- The wordmark: hammer it out to full width ---------- */
function hammerOut() {
  const ingot = document.getElementById('ingot');
  // Three blows: each one spreads the metal wider and cools it a little.
  const blows = [
    { width: 0.34, heat: 2.2 },
    { width: 0.58, heat: 1.9 },
    { width: 0.8, heat: 1.5 },
    { width: 1, heat: 1 },
  ];
  const beat = 1 / (blows.length - 1);
  const strike = 0.08; // share of the animation each blow takes to land
  const frames = [];
  blows.forEach((blow, i) => {
    const at = i * beat;
    const pose = { transform: `scaleX(${blow.width})`, filter: `brightness(${blow.heat})` };
    if (i > 0) {
      // Rest until just before the blow, then land it fast.
      const rest = blows[i - 1];
      frames.push({ offset: at - strike, transform: `scaleX(${rest.width})`, filter: `brightness(${rest.heat * 0.9})`, easing: 'cubic-bezier(.7,0,1,.6)' });
    }
    frames.push({ offset: at, easing: 'linear', ...pose });
  });
  ingot.animate(frames, { duration: 1400, delay: 200, fill: 'backwards' });
}

/* ---------- Preloader: three blows crack the ice, and the logo is what's left ---------- */
const ICE_APEX = [25, 20]; // where the logo's streaks meet, in % of the block

// Pieces of ice that fill the gaps in the logo. Points are % of the block.
const ICE_SHARDS = [
  [[26, 18], [41, 26], [42, 32], [27, 21]],
  [[41, 26], [61, 37], [62, 46], [42, 32]],
  [[61, 37], [81, 48], [88, 51.5], [84, 61.5], [62, 46]],
  [[88, 51.5], [98, 50], [98, 66], [84, 61.5]],
  [[23, 21], [40, 37.5], [41, 42], [23.5, 25]],
  [[40, 37.5], [55, 53.5], [50, 60], [41, 42]],
  [[55, 53.5], [71, 70], [57, 71], [50, 60]],
  [[71, 70], [74, 74], [72, 96], [61, 96], [60.5, 80], [57, 71]],
  [[84, 61.5], [86, 67], [82, 74], [98, 76], [98, 66]],
  [[74, 74], [82, 74], [98, 76], [98, 85], [80, 84]],
  [[74, 74], [80, 84], [84, 96], [72, 96]],
  [[80, 84], [98, 85], [98, 96], [84, 96]],
];

// Crack lines, grouped by the blow that opens them.
const ICE_CRACKS = [
  ['M25 20 L34 25 L42 29', 'M25 21 L31 30 L38 38'],
  ['M42 29 L52 34 L62 41 L72 46', 'M38 38 L47 47 L55 55', 'M52 34 L49 41', 'M47 47 L55 44'],
  ['M72 46 L84 55 L96.5 58', 'M55 55 L58 66 L66 72 L72 84 L75 94', 'M84 55 L86 66 L82 74', 'M72 84 L85 80 L96.5 82'],
];

function runPreloader(onReveal) {
  const ice = document.getElementById('ice');
  const stage = document.getElementById('ice-stage');
  const block = stage.querySelector('.ice__block');
  const logo = stage.querySelector('.ice__logo');
  const flash = document.getElementById('ice-flash');
  const shardBox = document.getElementById('ice-shards');
  const crackBox = document.getElementById('ice-cracks');
  const hot = document.getElementById('ice-hot');
  const frost = document.getElementById('ice-frost');
  const readout = document.getElementById('ice-read');
  const tempEl = document.getElementById('ice-temp');
  const msgEl = document.getElementById('ice-msg');
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const between = (min, max) => min + Math.random() * (max - min);

  // Each crack is a dark fracture with a bright edge, so it shows on pale ice.
  const crackGroups = ICE_CRACKS.map((group) => group.flatMap((d) => (
    [['#2B4654', '0.85'], ['#FFFFFF', '0.3']].map(([stroke, width]) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '1');
      path.setAttribute('stroke', stroke);
      path.setAttribute('stroke-width', width);
      crackBox.append(path);
      return path;
    })
  )));

  const shards = ICE_SHARDS.map((points) => {
    const shard = document.createElement('div');
    shard.className = 'ice__shard';
    shard.style.clipPath = `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(',')})`;
    shardBox.append(shard);
    const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    shard.style.transformOrigin = `${cx}% ${cy}%`;
    return { shard, cx, cy };
  });

  // Frost drifting up through the dark.
  for (let i = 0; i < 28; i++) {
    const speck = document.createElement('i');
    speck.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;--s:${(1.5 + Math.random() * 3).toFixed(1)}px;--life:${(4 + Math.random() * 5).toFixed(1)}s;--wait:${(-Math.random() * 8).toFixed(1)}s;--drift:${(Math.random() * 80 - 40).toFixed(0)}px`;
    frost.append(speck);
  }

  // The readout counts its way to each new temperature.
  let shownTemp = -18;
  function heatTo(target, ms) {
    const from = shownTemp;
    const start = performance.now();
    shownTemp = target;
    (function frame(now) {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - t) ** 3;
      tempEl.textContent = Math.round(from + (target - from) * eased).toLocaleString('en-IN');
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  function ring(power) {
    const wave = document.createElement('i');
    wave.className = 'ice__ring';
    stage.append(wave);
    wave.animate(
      [{ transform: 'scale(.2)', opacity: 0.9 }, { transform: `scale(${1.6 + power * 0.9})`, opacity: 0 }],
      { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)' },
    ).finished.then(() => wave.remove());
  }

  function strike(power, cracks) {
    ring(power);
    heatTo(Math.round(-18 + power * 8), 260);
    const kick = 2 + power * 2.5;
    stage.animate([
      { transform: 'none' },
      { transform: `translate(${kick}%, ${kick * 0.7}%) rotate(${power * 0.7}deg) scale(.985)`, offset: 0.2 },
      { transform: `translate(${-kick * 0.5}%, ${-kick * 0.3}%) rotate(${-power * 0.35}deg)`, offset: 0.5 },
      { transform: 'none' },
    ], { duration: 240, easing: 'ease-out' });
    flash.animate([{ opacity: 0.35 + power * 0.2 }, { opacity: 0 }], { duration: 260, easing: 'ease-out' });
    cracks.forEach((path) => {
      path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 170, easing: 'ease-out', fill: 'forwards' });
    });
  }

  function throwChips(size) {
    for (let i = 0; i < 26; i++) {
      const chip = document.createElement('i');
      chip.className = 'ice__chip';
      const s = between(0.8, 3.2);
      chip.style.cssText = `left:${between(30, 92)}%;top:${between(25, 90)}%;width:${s}%;height:${s * between(0.6, 1.5)}%;clip-path:polygon(50% 0,100% 40%,70% 100%,0 70%);visibility:visible`;
      stage.append(chip);
      const angle = between(-0.5, 1.9);
      const dist = size * between(0.5, 1.4);
      chip.animate([
        { transform: 'none', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + size * 0.55}px) rotate(${between(-400, 400)}deg)`, opacity: 0 },
      ], { duration: between(500, 950), easing: 'cubic-bezier(.15,.7,.5,1)', fill: 'forwards' });
    }
  }

  function shatter() {
    const size = stage.offsetWidth;
    block.style.visibility = 'hidden';
    crackBox.style.visibility = 'hidden';
    logo.style.visibility = 'visible';
    flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' });
    shards.forEach(({ shard, cx, cy }) => {
      shard.style.visibility = 'visible';
      // Each piece flies out from where the streaks meet, then gravity takes it.
      const dx = cx - ICE_APEX[0];
      const dy = cy - ICE_APEX[1];
      const length = Math.hypot(dx, dy);
      const reach = size * between(0.45, 0.95);
      const x = (dx / length) * reach;
      const y = (dy / length) * reach;
      const spin = between(-110, 110);
      shard.animate([
        { transform: 'none', opacity: 1, easing: 'cubic-bezier(.1,.7,.5,1)' },
        { transform: `translate(${x * 0.7}px, ${y * 0.7}px) rotate(${spin * 0.6}deg)`, opacity: 1, offset: 0.45, easing: 'cubic-bezier(.6,0,1,.7)' },
        { transform: `translate(${x}px, ${y + size * 1.1}px) rotate(${spin}deg) scale(.9)`, opacity: 0 },
      ], { duration: 1000, fill: 'forwards' });
    });
    throwChips(size);
    // Ice to forge: the cold light flares into heat and the frost turns to embers.
    ice.classList.add('is-hot');
    hot.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.35 }, { opacity: 0.75, transform: 'none' }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
    ring(3.2);
    heatTo(1300, 700);
    msgEl.textContent = 'Forged';
    logo.animate([
      { transform: 'scale(.97)', filter: 'brightness(1.5)' },
      { transform: 'scale(1.03)', filter: 'brightness(1.15)', offset: 0.35 },
      { transform: 'none', filter: 'none' },
    ], { duration: 620, easing: 'ease-out' });
  }

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    onReveal();
    // A skip can land before the break, so make sure the logo is what's showing.
    block.style.visibility = 'hidden';
    crackBox.style.visibility = 'hidden';
    logo.style.visibility = 'visible';
    const navF = document.querySelector('.nav__f img');
    const orged = document.querySelector('.nav__orged');
    const target = navF.getBoundingClientRect();
    const from = logo.getBoundingClientRect();
    // The logo flies up and becomes the F of the name, if the nav is on screen.
    if (target.bottom > 0) {
      const scale = target.width / from.width;
      const x = target.left + target.width / 2 - (from.left + from.width / 2);
      const y = target.top + target.height / 2 - (from.top + from.height / 2);
      stage.animate([{ transform: 'none' }, { transform: `translate(${x}px, ${y}px) scale(${scale})` }], { duration: 620, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' });
      // Only one F: the nav's stays hidden until the flying one lands on it.
      navF.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 620 });
      // It hits, and the rest of the name comes out of the F, hot, then cools to steel.
      navF.animate(
        [{ filter: 'brightness(1.7)', transform: 'scale(1.14)' }, { filter: 'none', transform: 'none' }],
        { duration: 300, delay: 620, easing: 'ease-out' },
      );
      orged.animate(
        [
          { clipPath: 'inset(0 100% 0 0)', transform: 'translateX(-10px)', backgroundColor: '#FFC53A' },
          { clipPath: 'inset(0 0 0 0)', transform: 'none', backgroundColor: '#FFC53A', offset: 0.45 },
          { clipPath: 'inset(0 0 0 0)', transform: 'none', backgroundColor: getComputedStyle(orged).color },
        ],
        { duration: 900, delay: 600, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' },
      );
    }
    ice.style.pointerEvents = 'none';
    [hot, frost, readout].forEach((layer) => layer.animate([{ opacity: getComputedStyle(layer).opacity }, { opacity: 0 }], { duration: 380, easing: 'ease-in', fill: 'forwards' }));
    ice.querySelector('.ice__glow--cold').style.display = 'none';
    const background = ice.animate([{ backgroundColor: '#0A0809' }, { backgroundColor: 'rgb(10 8 9 / 0)' }], { duration: 620, easing: 'ease-in', fill: 'forwards' });
    background.finished.then(() => ice.remove());
  }

  // Tap, click or press a key to skip.
  ice.addEventListener('click', finish);
  addEventListener('keydown', finish, { once: true });

  const pageLoaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else addEventListener('load', resolve, { once: true });
  });
  const artReady = Promise.all([block, logo].map((img) => img.decode().catch(() => {})));

  (async () => {
    await Promise.race([artReady, wait(1200)]);
    stage.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
    await wait(480);
    if (finished) return;
    strike(1, crackGroups[0]);
    await wait(420);
    if (finished) return;
    strike(1.6, crackGroups[1]);
    await Promise.all([wait(420), Promise.race([pageLoaded, wait(1500)])]);
    if (finished) return;
    strike(2.2, crackGroups[2]);
    await wait(90);
    if (finished) return;
    shatter();
    await wait(1050);
    finish();
  })();
}


/* ---------- Molten wordmark: touch the metal and it heats, sags, sparks and cools ---------- */
function startMolten() {
  const hero = document.getElementById('hero');
  const mark = document.querySelector('.ingot .wordmark');
  const hint = document.getElementById('ingot-hint');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const between = (min, max) => min + Math.random() * (max - min);

  // Heat lives on a small grid that the browser stretches smoothly over the
  // letters. The wordmark's mask keeps it on the metal, and it costs very little.
  const W = 192;
  const H = 31;
  const glow = document.createElement('canvas');
  glow.className = 'molten__glow';
  glow.width = W;
  glow.height = H;
  glow.setAttribute('aria-hidden', 'true');
  mark.prepend(glow);
  const glowCtx = glow.getContext('2d');
  const image = glowCtx.createImageData(W, H);
  const pixels = new Uint32Array(image.data.buffer);
  let heat = new Float32Array(W * H);
  let spare = new Float32Array(W * H);

  // Colour by temperature: dull red, orange, yellow, then white-hot.
  const STOPS = [
    [0, 120, 10, 10, 0],
    [0.1, 163, 20, 26, 0.5],
    [0.32, 242, 70, 24, 0.92],
    [0.62, 255, 170, 40, 1],
    [0.92, 255, 240, 190, 1],
    [1, 255, 255, 245, 1],
  ];
  const ramp = new Uint32Array(256);
  ramp.forEach((_, i) => {
    const t = i / 255;
    const to = STOPS.findIndex((stop) => stop[0] >= t);
    const a = STOPS[Math.max(0, to - 1)];
    const b = STOPS[to];
    const mix = b === a ? 0 : (t - a[0]) / (b[0] - a[0]);
    const channel = (n) => a[n] + (b[n] - a[n]) * mix;
    ramp[i] = ((Math.round(channel(4) * 255) << 24) | (Math.round(channel(3)) << 16) | (Math.round(channel(2)) << 8) | Math.round(channel(1))) >>> 0;
  });

  // A soft noise tile that scrolls through the heat, so it churns like liquid.
  const NOISE_H = 64;
  let noise = Float32Array.from({ length: W * NOISE_H }, () => Math.random());
  for (let pass = 0; pass < 10; pass++) {
    noise = noise.map((_, i) => {
      const x = i % W;
      const y = (i - x) / W;
      return (noise[i] * 2 + noise[y * W + (x + 1) % W] + noise[y * W + (x + W - 1) % W]
        + noise[((y + 1) % NOISE_H) * W + x] + noise[((y + NOISE_H - 1) % NOISE_H) * W + x]) / 6;
    });
  }
  const noiseMin = Math.min(...noise);
  const noiseRange = Math.max(...noise) - noiseMin;
  noise = noise.map((n) => (n - noiseMin) / noiseRange);

  // Where the metal actually is, read from the artwork, so sparks and drips
  // start on a letter and not in a gap.
  let metal = new Uint8Array(W * H).fill(1);
  const lowest = new Uint8Array(W).fill(H - 1);
  const art = new Image();
  art.onload = () => {
    try {
      const reader = document.createElement('canvas');
      reader.width = W;
      reader.height = H;
      const readerCtx = reader.getContext('2d', { willReadFrequently: true });
      readerCtx.drawImage(art, 0, 0, W, H);
      const alpha = readerCtx.getImageData(0, 0, W, H).data;
      const found = new Uint8Array(W * H);
      let count = 0;
      for (let i = 0; i < found.length; i++) {
        if (alpha[i * 4 + 3] > 110) {
          found[i] = 1;
          count++;
          lowest[i % W] = Math.floor(i / W);
        }
      }
      if (count > found.length * 0.2) metal = found;
    } catch (error) { /* Without the map, sparks can start anywhere on the word. */ }
  };
  art.src = 'assets/wordmark.svg';

  // Sparks and drips can leave the letters, so they get their own layer.
  const air = document.createElement('canvas');
  air.className = 'molten__air';
  air.setAttribute('aria-hidden', 'true');
  hero.append(air);
  const airCtx = air.getContext('2d');
  let airScale = 1;
  function fitAir() {
    airScale = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(hero.clientWidth * airScale);
    const h = Math.round(hero.clientHeight * airScale);
    if (air.width !== w || air.height !== h) {
      air.width = w;
      air.height = h;
    }
  }

  const particles = [];
  const MAX_PARTICLES = 170;

  function addHeat(cx, cy, radius, amount) {
    const reach = Math.ceil(radius * 1.6);
    const falloff = radius * radius * 0.5;
    for (let y = Math.max(0, Math.floor(cy - reach)); y <= Math.min(H - 1, Math.ceil(cy + reach)); y++) {
      for (let x = Math.max(0, Math.floor(cx - reach)); x <= Math.min(W - 1, Math.ceil(cx + reach)); x++) {
        const distance = (x - cx) ** 2 + (y - cy) ** 2;
        const i = y * W + x;
        heat[i] = Math.min(1, heat[i] + amount * Math.exp(-distance / falloff));
      }
    }
  }

  function throwSparks(clientX, clientY, count, aimX, aimY) {
    const from = hero.getBoundingClientRect();
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
      const life = between(0.3, 0.85);
      particles.push({
        drip: false,
        x: clientX - from.left,
        y: clientY - from.top,
        vx: aimX * 0.5 + between(-190, 190),
        vy: aimY * 0.25 + between(-430, -40),
        age: 0,
        life,
      });
    }
  }

  // A brush about a fingertip wide on phones, and a bit more on big screens.
  function brushSize(box) {
    return clamp(24 / (box.width / W), 3.5, 6);
  }

  function burnAlong(from, to, box, withSparks) {
    const toGrid = (point) => [((point.x - box.left) / box.width) * W, ((point.y - box.top) / box.height) * H];
    const [x0, y0] = toGrid(from);
    const [x1, y1] = toGrid(to);
    const radius = brushSize(box);
    const steps = clamp(Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (radius * 0.5)), 1, 40);
    for (let i = 1; i <= steps; i++) {
      addHeat(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, radius, 0.16);
    }
    const col = Math.floor(clamp(x1, 0, W - 1));
    const row = Math.floor(clamp(y1, 0, H - 1));
    if (withSparks && metal[row * W + col]) {
      const moved = Math.hypot(to.x - from.x, to.y - from.y);
      throwSparks(to.x, to.y, Math.min(6, Math.round(moved / 12)), (to.x - from.x) * 18, (to.y - from.y) * 18);
    }
    wake();
  }

  let sweep = null;
  let scroll = 0;
  let awake = false;
  let lastTime = 0;
  let spareTime = 0;
  let box = null;

  function step() {
    scroll = (scroll + 0.35) % NOISE_H;
    let warm = false;
    for (let y = 0; y < H; y++) {
      const above = y > 0 ? (y - 1) * W : y * W;
      const below = y < H - 1 ? (y + 1) * W : y * W;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const here = heat[i];
        const left = heat[y * W + Math.max(0, x - 1)];
        const right = heat[y * W + Math.min(W - 1, x + 1)];
        const up = heat[above + x];
        const down = heat[below + x];
        // Spread out, sag downward like something melting, and cool.
        let next = here + 0.12 * ((left + right + up + down) / 4 - here);
        next += 0.05 * (up - next);
        next = next * 0.985 - 0.0016;
        if (next < 0.004) next = 0;
        else warm = true;
        spare[i] = next;
      }
    }
    [heat, spare] = [spare, heat];

    // Very hot metal at the bottom of a letter lets go of a drop.
    if (box && particles.length < MAX_PARTICLES) {
      const from = hero.getBoundingClientRect();
      for (let tries = 0; tries < 4; tries++) {
        const x = Math.floor(Math.random() * W);
        const y = lowest[x];
        if (heat[y * W + x] > 0.4 && Math.random() < 0.14) {
          particles.push({
            drip: true,
            x: box.left - from.left + ((x + 0.5) / W) * box.width,
            y: box.top - from.top + ((y + 0.6) / H) * box.height,
            vx: between(-5, 5),
            vy: between(10, 40),
            age: 0,
            life: between(0.55, 1.05),
            size: between(1.2, 2.8),
          });
        }
      }
    }
    return warm;
  }

  function paintHeat() {
    const shift = Math.floor(scroll);
    for (let y = 0; y < H; y++) {
      const noiseRow = ((y + NOISE_H - shift) % NOISE_H) * W;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const value = heat[i];
        if (value === 0) {
          pixels[i] = 0;
        } else {
          // The churn shows most while the metal is mid-heat.
          const churned = value * (0.82 + 0.36 * noise[noiseRow + x]);
          pixels[i] = ramp[Math.min(255, Math.floor(churned * 255))];
        }
      }
    }
    glowCtx.putImageData(image, 0, 0);
  }

  function paintAir(seconds) {
    airCtx.setTransform(airScale, 0, 0, airScale, 0, 0);
    airCtx.clearRect(0, 0, air.width, air.height);
    airCtx.globalCompositeOperation = 'lighter';
    airCtx.lineCap = 'round';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += seconds;
      if (p.age >= p.life) {
        particles.splice(i, 1);
        continue;
      }
      const left = 1 - p.age / p.life;
      p.vy += (p.drip ? 780 : 1050) * seconds;
      p.vx *= p.drip ? 1 : 0.985;
      p.x += p.vx * seconds;
      p.y += p.vy * seconds;
      airCtx.globalAlpha = Math.sqrt(left);
      const hue = 12 + 36 * left;
      const light = 48 + 40 * left;
      if (p.drip) {
        airCtx.fillStyle = `hsl(${hue} 100% ${light}%)`;
        airCtx.beginPath();
        airCtx.ellipse(p.x, p.y, p.size, p.size + Math.min(5, p.vy * 0.012), 0, 0, Math.PI * 2);
        airCtx.fill();
      } else {
        airCtx.strokeStyle = `hsl(${hue} 100% ${light}%)`;
        airCtx.lineWidth = 0.8 + left;
        airCtx.beginPath();
        airCtx.moveTo(p.x, p.y);
        airCtx.lineTo(p.x - p.vx * 0.022, p.y - p.vy * 0.022);
        airCtx.stroke();
      }
    }
  }

  function tick(now) {
    const seconds = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    box = mark.getBoundingClientRect();

    if (sweep) {
      // Once after the page opens, heat runs through the word on its own.
      const t = Math.min(1, (now - sweep.start) / 1250);
      const at = {
        x: box.left + box.width * (0.02 + 0.96 * t),
        y: box.top + box.height * (0.52 + 0.26 * Math.sin(t * 15)),
      };
      if (sweep.last) burnAlong(sweep.last, at, box, Math.random() < 0.55);
      sweep.last = at;
      if (t >= 1) sweep = null;
    }

    // Same speed on 60 Hz and 120 Hz screens.
    spareTime += seconds;
    let warm = true;
    let stepped = false;
    while (spareTime >= 1 / 60) {
      warm = step();
      stepped = true;
      spareTime -= 1 / 60;
    }
    if (stepped) paintHeat();
    paintAir(seconds);

    if (warm || particles.length || sweep) {
      requestAnimationFrame(tick);
    } else {
      awake = false;
      paintHeat();
      airCtx.clearRect(0, 0, air.width, air.height);
    }
  }

  function wake() {
    if (awake) return;
    awake = true;
    fitAir();
    lastTime = performance.now();
    requestAnimationFrame(tick);
  }

  const dismissHint = () => hint.classList.remove('is-on');
  // No touching once the camera has started flying into the letters.
  const canTouch = () => !mark.style.transform && !document.getElementById('ice');
  let last = null;

  mark.addEventListener('pointerdown', (event) => {
    if (!canTouch()) return;
    dismissHint();
    sweep = null;
    const here = { x: event.clientX, y: event.clientY };
    last = here;
    // Pressing is a hammer blow: a big hot spot, a shudder and a shower of sparks.
    const rect = mark.getBoundingClientRect();
    addHeat(((here.x - rect.left) / rect.width) * W, ((here.y - rect.top) / rect.height) * H, brushSize(rect) * 1.5, 1.05);
    throwSparks(here.x, here.y, 26, 0, -120);
    mark.animate(
      [{ transform: 'scale(1.012, .975)' }, { transform: 'none' }],
      { duration: 200, easing: 'cubic-bezier(.2,.7,.2,1)' },
    );
    wake();
  });
  mark.addEventListener('pointermove', (event) => {
    if (!canTouch()) return;
    const here = { x: event.clientX, y: event.clientY };
    if (last) {
      dismissHint();
      sweep = null;
      burnAlong(last, here, mark.getBoundingClientRect(), true);
    }
    last = here;
  });
  const letGo = () => { last = null; };
  mark.addEventListener('pointerleave', letGo);
  mark.addEventListener('pointercancel', letGo);
  mark.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'mouse') letGo();
  });
  addEventListener('scroll', dismissHint, { passive: true });
  new ResizeObserver(() => { if (awake) fitAir(); }).observe(hero);

  return {
    // Once the hammering has finished, show what the metal can do.
    showOff() {
      setTimeout(() => {
        if (!canTouch() || last) return;
        hint.classList.add('is-on');
        sweep = { start: performance.now(), last: null };
        wake();
      }, 1750);
    },
  };
}
const molten = reducedMotion ? null : startMolten();

/* ---------- The route: a road with a molten trail up to the next run ---------- */
function setupRoute() {
  const route = document.getElementById('route');
  const road = document.getElementById('route-road');
  const lines = [...road.querySelectorAll('path')];
  const trails = lines.filter((line) => line.hasAttribute('pathLength'));
  const heat = document.getElementById('route-heat');
  const embers = document.getElementById('route-embers');
  const stops = [...route.querySelectorAll('.route__stop')];
  const soon = document.getElementById('route-soon');
  const runner = document.getElementById('route-runner');
  const [tailNear, tailFar] = runner.querySelectorAll('.route__runner-tail');
  const fadeGrad = document.getElementById('route-fade-grad');
  const fadeArea = document.getElementById('route-fade-area');

  // A stop is done once its run is over (data-ends, or the end of its day);
  // the first one left is next.
  const now = new Date();
  const isDone = (stop) => new Date(stop.dataset.ends || `${stop.dataset.date}T23:59:59`) < now;
  const next = stops.find((stop) => !isDone(stop));
  stops.forEach((stop, i) => {
    stop.classList.toggle('is-done', isDone(stop));
    stop.classList.toggle('is-next', stop === next);
    // Stops sit on alternate peaks and valleys, with labels inside each bend.
    stop.classList.add(i % 2 ? 'is-valley' : 'is-peak');
  });

  // Embers rising from the hot end of the trail.
  if (next) {
    for (let i = 0; i < 14; i++) {
      const ember = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ember.setAttribute('class', 'route__ember');
      ember.setAttribute('r', (1 + Math.random() * 1.6).toFixed(1));
      ember.style.setProperty('--drift', `${(Math.random() * 44 - 22).toFixed(0)}px`);
      ember.style.setProperty('--rise', `${(-34 - Math.random() * 46).toFixed(0)}px`);
      ember.style.setProperty('--life', `${(1.1 + Math.random() * 1.1).toFixed(2)}s`);
      ember.style.setProperty('--wait', `${(Math.random() * 2).toFixed(2)}s`);
      embers.append(ember);
    }
  }

  let reached = 1; // share of the road's length covered by the trail
  let roadLength = 0; // in pixels
  let stopLengths = []; // how far along the road each stop sits, in pixels
  let head = [0, 0];
  let runnerAt = null; // pixels along the road while running; null once it's waiting
  let runnerScale = 1;
  // The runner waits just short of the next coin, so the hot coin stays in view.
  const waitAt = () => Math.max(0, stopLengths[stops.indexOf(next)] - (parseFloat(getComputedStyle(route).getPropertyValue('--coin')) || 24) * 1.7);

  // The fireball sits on the road at a distance, with two embers trailing it.
  const pointAt = (length) => lines[0].getPointAtLength(Math.max(0, Math.min(roadLength, length)));
  function placeRunner(length) {
    const p = pointAt(length);
    runner.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${runnerScale})`);
    [[tailNear, 12], [tailFar, 22]].forEach(([tail, back]) => {
      const q = pointAt(length - back * runnerScale);
      tail.setAttribute('cx', ((q.x - p.x) / runnerScale).toFixed(1));
      tail.setAttribute('cy', ((q.y - p.y) / runnerScale).toFixed(1));
    });
  }

  function layout() {
    const w = route.clientWidth;
    const h = route.clientHeight;
    const width = innerWidth < 600 ? 14 : 26;
    route.style.setProperty('--road', `${width}px`);
    // A steep road has narrow bends that can't hold a label, so labels sit outside them.
    const compact = h / w > 0.33;
    route.classList.toggle('is-compact', compact);
    const top = compact ? 66 : width / 2 + 18;
    const low = compact ? h - 34 : h - width / 2 - 3;
    const y = (share) => top + share * (low - top);

    // Peak, valley, peak... with flat tangents, so the road sweeps between stops.
    const first = 0.13;
    const gap = (0.835 - first) / Math.max(1, stops.length - 1);
    const points = stops.map((_, i) => [(first + gap * i) * w, y(i % 2 ? 1 : 0)]);
    // The road ends at the mystery stop, just short of the edge.
    const all = [[0, y(0.55)], ...points, [w * 0.962, y(0.5)]];
    const sweep = (a, b) => {
      const pull = (b[0] - a[0]) / 2;
      return `C${(a[0] + pull).toFixed(1)} ${a[1].toFixed(1)} ${(b[0] - pull).toFixed(1)} ${b[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    };
    const pathTo = (end) => `M${all[0][0]} ${all[0][1].toFixed(1)} ${all.slice(1, end + 1).map((p, i) => sweep(all[i], p)).join(' ')}`;
    const d = pathTo(all.length - 1);

    road.setAttribute('viewBox', `0 0 ${w} ${h}`);
    lines.forEach((line) => line.setAttribute('d', d));
    stops.forEach((stop, i) => {
      stop.style.left = `${points[i][0]}px`;
      stop.style.top = `${points[i][1]}px`;
    });
    const end = all[all.length - 1];
    soon.style.left = `${end[0]}px`;
    soon.style.top = `${end[1]}px`;

    // The trail stops at the next run; the heat gradient peaks right there.
    const nextIndex = stops.indexOf(next);
    head = next ? points[nextIndex] : end;
    const measure = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    roadLength = lines[0].getTotalLength();
    stopLengths = points.map((_, i) => {
      measure.setAttribute('d', pathTo(i + 1));
      return measure.getTotalLength();
    });
    reached = next ? stopLengths[nextIndex] / roadLength : 1;
    trails.forEach((trail) => { trail.style.strokeDasharray = `${reached} 1`; });
    heat.setAttribute('x2', head[0]);
    embers.setAttribute('transform', `translate(${head[0]} ${head[1]})`);

    // Past the next run, the road fades into the dark.
    fadeGrad.setAttribute('x1', head[0]);
    fadeGrad.setAttribute('x2', Math.max(head[0] + 1, end[0] + width));
    fadeArea.setAttribute('x', -60);
    fadeArea.setAttribute('y', -60);
    fadeArea.setAttribute('width', w + 120);
    fadeArea.setAttribute('height', h + 120);

    runnerScale = width / 26;
    if (next) placeRunner(runnerAt ?? waitAt());
    else runner.classList.remove('is-on');
    if (openStop) positionPop(openStop);
    route.classList.add('is-ready');
  }

  /* Photo pop-ups: hover with a mouse, tap on a phone, or focus with the keyboard */
  // Fingers and mice are told apart per tap, so touchscreen laptops work too.
  let lastPointer = matchMedia('(hover: hover) and (pointer: fine)').matches ? 'mouse' : 'touch';
  addEventListener('pointerdown', (event) => { lastPointer = event.pointerType || 'mouse'; }, { capture: true, passive: true });
  const items = [...stops, soon];
  let openStop = null;
  let closeTimer = 0;
  function positionPop(item) {
    const pop = item.querySelector('.route__pop');
    const label = item.querySelector('.route__label');
    const at = item.getBoundingClientRect();
    const labelBox = label.getBoundingClientRect();
    const coin = parseFloat(getComputedStyle(route).getPropertyValue('--coin')) || 24;
    // Below whichever is lower, the coin or its label.
    const top = Math.max(labelBox.bottom - at.top, coin / 2) + 12;
    // Centred on the stop, but kept on screen.
    const width = pop.offsetWidth;
    const left = Math.min(Math.max(-width / 2, 10 - at.left), innerWidth - 10 - width - at.left);
    pop.style.top = `${top.toFixed(1)}px`;
    pop.style.left = `${left.toFixed(1)}px`;
  }
  // The photos load only when someone's likely to look: on first open, or once the page has settled.
  const loadPhotos = () => route.querySelectorAll('.route__pop img[data-src]').forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
  addEventListener('load', () => setTimeout(loadPhotos, 6000), { once: true });
  function openPop(item) {
    loadPhotos();
    clearTimeout(closeTimer);
    if (openStop && openStop !== item) openStop.classList.remove('is-open');
    openStop = item;
    positionPop(item);
    item.classList.add('is-open');
  }
  function closePop(now) {
    clearTimeout(closeTimer);
    const shut = () => {
      if (openStop) openStop.classList.remove('is-open');
      openStop = null;
    };
    if (now) shut();
    else closeTimer = setTimeout(shut, 220);
  }
  items.forEach((item) => {
    const label = item.querySelector('.route__label');
    item.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') openPop(item); });
    item.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') closePop(false); });
    // Keyboard focus shows the photo; a tap's focus is left to the click below.
    label.addEventListener('focus', () => { if (label.matches(':focus-visible')) openPop(item); });
    item.addEventListener('focusout', (event) => {
      if (!item.contains(event.relatedTarget)) closePop(true);
    });
    // On a phone the first tap shows the photo; the second tap goes to the run.
    label.addEventListener('click', (event) => {
      if (lastPointer === 'mouse' || openStop === item) return;
      event.preventDefault();
      openPop(item);
    });
    item.querySelector('.route__pop').addEventListener('click', () => closePop(true));
  });
  document.addEventListener('click', (event) => {
    if (openStop && !openStop.contains(event.target)) closePop(true);
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePop(true); });
  addEventListener('scroll', () => { if (openStop && lastPointer !== 'mouse') closePop(true); }, { passive: true });

  /* Heat shimmer: the noise drifts a few times a second while the road is on screen */
  const turbulence = document.getElementById('route-turbulence');
  let shimmerOn = false;
  let shimmerLast = 0;
  function shimmer(now) {
    if (!shimmerOn) return;
    if (now - shimmerLast > 70) {
      shimmerLast = now;
      turbulence.setAttribute('seed', Math.floor(now / 70) % 60);
      turbulence.setAttribute('baseFrequency', `0.012 ${(0.08 + Math.sin(now / 900) * 0.02).toFixed(3)}`);
    }
    requestAnimationFrame(shimmer);
  }
  if (!reducedMotion && next) {
    new IntersectionObserver(([entry]) => {
      const on = entry.isIntersecting;
      if (on && !shimmerOn) {
        shimmerOn = true;
        requestAnimationFrame(shimmer);
      }
      shimmerOn = on;
    }).observe(route);
  }

  // Without the run-in animation, the runner simply waits at the next run.
  if (next) {
    runner.classList.add('is-on', 'is-waiting');
  }
  layout();
  // Redraw whenever the space changes, including when web fonts arrive and
  // the headline changes height, not just when the window is resized.
  let queuedLayout = false;
  const redraw = () => {
    if (queuedLayout) return;
    queuedLayout = true;
    requestAnimationFrame(() => {
      queuedLayout = false;
      layout();
    });
  };
  const watcher = new ResizeObserver(redraw);
  watcher.observe(route.parentElement);
  watcher.observe(route.parentElement.querySelector('.hero__body'));
  if (document.fonts) document.fonts.ready.then(redraw);

  // The runner pours the trail up to the next stop, and each coin flips as it arrives.
  return function runRoute() {
    const start = 500;
    const burn = 2300;
    const nextIndex = stops.indexOf(next);
    const showStop = (stop) => {
      stop.style.opacity = '';
      stop.animate(
        [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
        { duration: 320, easing: 'ease-out' },
      );
    };
    if (!next) {
      // Every run is done: just reveal the stops.
      [...stops, soon].forEach((stop, i) => setTimeout(() => showStop(stop), start + i * 150));
      return;
    }
    const waiting = stops.slice(0, nextIndex + 1);
    waiting.forEach((stop) => { stop.style.opacity = '0'; });
    stops.slice(nextIndex + 1).concat(soon).forEach((stop) => { stop.style.opacity = '0'; });
    embers.style.opacity = '0';
    runner.classList.remove('is-waiting');
    runnerAt = 0;
    trails.forEach((trail) => { trail.style.strokeDashoffset = reached; });
    placeRunner(0);
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const begin = performance.now() + start;
    const hit = new Set();
    function frame(now) {
      const t = Math.min(1, Math.max(0, (now - begin) / burn));
      const share = ease(t);
      runnerAt = share * waitAt();
      // The trail's hot end stays right behind the runner.
      trails.forEach((trail) => { trail.style.strokeDashoffset = (reached - runnerAt / roadLength).toFixed(4); });
      placeRunner(runnerAt);
      waiting.forEach((stop, i) => {
        if (!hit.has(i) && (runnerAt >= stopLengths[i] - 2 || (i === nextIndex && t >= 1))) {
          hit.add(i);
          showStop(stop);
          stop.classList.add('is-hit');
          setTimeout(() => stop.classList.remove('is-hit'), 900);
        }
      });
      if (t < 1) {
        requestAnimationFrame(frame);
        return;
      }
      runnerAt = null;
      trails.forEach((trail) => { trail.style.strokeDashoffset = ''; });
      runner.classList.add('is-waiting');
      embers.style.opacity = '';
      embers.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
      stops.slice(nextIndex + 1).concat(soon).forEach((stop, i) => setTimeout(() => showStop(stop), 200 + i * 150));
    }
    requestAnimationFrame(frame);
  };
}
const runRoute = setupRoute();

if (!reducedMotion) {
  runPreloader(() => {
    hammerOut();
    runRoute();
    molten.showOff();
  });
}

/* ---------- The watch: scroll position told as distance and time ---------- */
const MINUTES_PER_KM = 6.4; // easy social pace, from a 06:00 start
const marks = [...document.querySelectorAll('[data-km]')];
const kmEl = document.getElementById('watch-km');
const timeEl = document.getElementById('watch-time');
const barEl = document.getElementById('watch-bar');

function distanceRun() {
  const y = scrollY + innerHeight * 0.4;
  const maxY = document.documentElement.scrollHeight - innerHeight;
  if (scrollY >= maxY - 2) return 5;
  const tops = marks.map((el) => el.getBoundingClientRect().top + scrollY);
  tops[0] = innerHeight * 0.4; // km 0 is the top of the page
  for (let i = tops.length - 1; i >= 0; i--) {
    if (y >= tops[i]) {
      const next = i + 1 < tops.length ? tops[i + 1] : maxY + innerHeight * 0.4;
      return Math.min(5, i + (y - tops[i]) / (next - tops[i]));
    }
  }
  return 0;
}

let ticking = false;
function updateWatch() {
  ticking = false;
  const km = distanceRun();
  const minutes = Math.round(km * MINUTES_PER_KM);
  kmEl.textContent = km.toFixed(2);
  timeEl.textContent = `06:${String(minutes).padStart(2, '0')}`;
  barEl.style.transform = `scaleX(${km / 5})`;
  document.getElementById('watch').classList.toggle('is-finished', km >= 5);
}
function requestWatchUpdate() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateWatch);
  }
}
addEventListener('scroll', requestWatchUpdate, { passive: true });
addEventListener('resize', requestWatchUpdate);
updateWatch();

/* ---------- Easter egg: tap the logo five times fast and the forge overheats ---------- */
function startOverheat() {
  const brand = document.querySelector('.nav__brand');
  let taps = [];
  let busy = false;

  function overheat() {
    busy = true;
    const toast = document.createElement('p');
    toast.className = 'overheat__toast';
    toast.setAttribute('role', 'status');
    toast.textContent = 'You overheated the forge. Cool down at the next run.';
    document.body.append(toast);
    toast.animate(
      [{ transform: 'translate(-50%, -140%)' }, { transform: 'translate(-50%, 0)' }],
      { duration: reducedMotion ? 1 : 420, easing: 'cubic-bezier(.2,1.5,.4,1)', fill: 'forwards' },
    );

    if (!reducedMotion) {
      const flash = document.createElement('div');
      flash.className = 'overheat__flash';
      document.body.append(flash);
      flash.animate([{ opacity: 0.95 }, { opacity: 0.6, offset: 0.2 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' })
        .finished.then(() => flash.remove());
      document.querySelector('main').animate(
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ transform: i === 7 ? 'none' : `translate(${(Math.random() - 0.5) * 18}px, ${(Math.random() - 0.5) * 12}px)` })),
        { duration: 420, easing: 'linear' },
      );
      const colours = ['#C91F18', '#F2571B', '#F98F22', '#FFC53A', '#FFFBF0'];
      for (let i = 0; i < 70; i++) {
        const size = 3 + Math.random() * 7;
        const ember = document.createElement('i');
        ember.className = 'overheat__ember';
        ember.style.cssText = `left:${Math.random() * innerWidth}px;top:${innerHeight + 10}px;width:${size}px;height:${size}px;background:${colours[i % colours.length]}`;
        document.body.append(ember);
        ember.animate(
          [
            { transform: 'translate(0, 0)', opacity: 1 },
            { transform: `translate(${(Math.random() - 0.5) * 160}px, ${-innerHeight * (0.5 + Math.random() * 0.6)}px) scale(.2)`, opacity: 0 },
          ],
          { duration: 1200 + Math.random() * 1400, delay: Math.random() * 400, easing: 'cubic-bezier(.15,.7,.4,1)', fill: 'backwards' },
        ).finished.then(() => ember.remove());
      }
    }

    setTimeout(() => {
      toast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })
        .finished.then(() => { toast.remove(); busy = false; });
    }, 3200);
  }

  brand.addEventListener('click', () => {
    const now = performance.now();
    taps = taps.filter((t) => now - t < 2500);
    taps.push(now);
    if (taps.length >= 5 && !busy) {
      taps = [];
      overheat();
    }
  });
}
startOverheat();

/* ---------- Tapes: run along on their own, faster while you scroll ---------- */
const tapeRuns = reducedMotion ? [] : [...document.querySelectorAll('.tape__track')].map((track, i) => track.animate(
  [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
  { duration: 26000, iterations: Infinity, direction: i % 2 ? 'reverse' : 'normal' },
));

/* ---------- Heart rate: scroll hard and the watch notices ---------- */
function startHeartRate() {
  const watch = document.getElementById('watch');
  const bpmEl = document.getElementById('watch-bpm');
  const heart = watch.querySelector('.watch__bpm i');
  const RESTING = 72;
  let bpm = RESTING;
  let speed = 0; // smoothed scroll speed, px per second
  let lastY = scrollY;
  let lastTime = performance.now();
  let running = false;
  let shown = RESTING;

  function tick(now) {
    const seconds = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    const moved = Math.abs(scrollY - lastY);
    lastY = scrollY;
    speed += (moved / seconds - speed) * Math.min(1, seconds * 6);
    const target = RESTING + Math.min(118, speed / 22);
    // The heart climbs fast and recovers slowly, like a real one.
    bpm += (target - bpm) * Math.min(1, seconds * (target > bpm ? 2.2 : 0.8));
    const whole = Math.round(bpm);
    if (whole !== shown) {
      shown = whole;
      bpmEl.textContent = whole;
      heart.style.setProperty('--beat', `${(60 / whole).toFixed(2)}s`);
    }
    tapeRuns.forEach((run) => { run.playbackRate = 1 + Math.min(7, speed / 350); });
    if (bpm > 162) watch.classList.add('is-redline');
    else if (bpm < 140) watch.classList.remove('is-redline');
    if (bpm - RESTING > 0.6 || speed > 5) {
      requestAnimationFrame(tick);
    } else {
      running = false;
    }
  }
  addEventListener('scroll', () => {
    if (running) return;
    running = true;
    lastY = scrollY;
    lastTime = performance.now();
    requestAnimationFrame(tick);
  }, { passive: true });
}
if (!reducedMotion) startHeartRate();

/* ---------- Scroll: fly into the metal, and hammer things out as they arrive ---------- */
function startScrollEffects() {
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (t) => t * t * (3 - 2 * t);

  const pin = document.getElementById('hero-pin');
  const hero = document.getElementById('hero');
  const ingot = document.getElementById('ingot');
  const mark = ingot.querySelector('.wordmark');
  const heat = document.getElementById('wordmark-heat');
  const fading = [hero.querySelector('.nav'), hero.querySelector('.route'), hero.querySelector('.hero__body')];
  // The widest solid part of the wordmark, in the G. Measured from the artwork.
  const SOLID = { x: 0.5542, y: 0.6817, radius: 0.0445 };
  mark.style.transformOrigin = `${SOLID.x * 100}% ${SOLID.y * 100}%`;
  const HEAT = [
    { at: 0.3, rgb: [255, 120, 30] },
    { at: 0.62, rgb: [226, 40, 22] },
    { at: 1, rgb: [74, 12, 16] }, // matches --blood-from
  ];

  const numerals = [...document.querySelectorAll('.date__day')];
  const sunNumeral = document.querySelector('.date--lead .date__day');
  const finishMark = document.querySelector('.finish__line .wordmark');
  const ghosts = [...document.querySelectorAll('.ghost')];
  const seal = document.querySelector('.seal');
  finishMark.style.transformOrigin = '0 50%';

  // How far an element has travelled up the screen on its way in.
  const arrival = (el) => clamp((innerHeight - el.getBoundingClientRect().top) / (innerHeight * 0.55));

  document.documentElement.classList.add('has-flight');
  function fitFlight() {
    document.documentElement.style.setProperty('--hero-h', `${hero.offsetHeight}px`);
  }

  function flyInto() {
    // The hero pins once its bottom edge is on screen, which is at a negative
    // offset when it's taller than the screen.
    const travel = pin.offsetHeight - hero.offsetHeight;
    const pinsAt = parseFloat(getComputedStyle(hero).top) || 0;
    const progress = clamp((pinsAt - pin.getBoundingClientRect().top) / travel);
    const box = ingot.getBoundingClientRect();
    const t = clamp((progress - 0.03) / 0.97);

    // Scale exponentially so the speed feels constant, ending when the solid
    // part of the letter is big enough to cover the whole screen.
    const widest = Math.hypot(innerWidth, innerHeight) / 2;
    const maxScale = (widest / (SOLID.radius * box.width)) * 1.06;
    const scale = maxScale ** (t * t * (1.6 - 0.6 * t));
    // Bring that solid part to the middle of the screen as we approach.
    const aim = smooth(clamp(t * 1.5));
    const x = (innerWidth / 2 - (box.left + box.width * SOLID.x)) * aim;
    const y = (innerHeight / 2 - (box.top + box.height * SOLID.y)) * aim;
    mark.style.transform = t > 0 ? `translate(${x}px, ${y}px) scale(${scale})` : '';
    // The metal glows orange, then cherry, then settles into the next section's red.
    const stop = HEAT.findIndex((s) => t <= s.at);
    const to = HEAT[stop < 0 ? HEAT.length - 1 : Math.max(stop, 1)];
    const from = HEAT[HEAT.indexOf(to) - 1];
    const mix = smooth(clamp((t - from.at) / (to.at - from.at)));
    heat.style.background = `rgb(${from.rgb.map((c, i) => Math.round(c + (to.rgb[i] - c) * mix)).join(' ')})`;
    heat.style.opacity = smooth(clamp((t - 0.06) / 0.3));

    const gone = clamp(progress / 0.2);
    fading.forEach((el) => {
      el.style.opacity = 1 - gone;
      el.style.transform = gone ? `translateY(${-40 * gone}px)` : '';
    });
    hero.classList.toggle('is-flying', gone >= 1);
    hero.classList.toggle('is-molten', t >= 1);
    pin.classList.toggle('is-molten', t >= 1);
  }

  let emberBurstDone = false;
  function burstEmbers(wordmark) {
    wordmark.animate(
      [{ transform: 'scale(1.025)' }, { transform: 'scaleX(1)' }],
      { duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)' },
    );
    const area = wordmark.closest('.finish');
    const from = area.getBoundingClientRect();
    const box = wordmark.getBoundingClientRect();
    const colours = ['#C91F18', '#F2571B', '#F98F22', '#FFC53A'];
    for (let i = 0; i < 36; i++) {
      const size = 3 + Math.random() * 6;
      const ember = document.createElement('i');
      ember.className = 'finish__ember';
      ember.style.cssText = `left:${box.left - from.left + Math.random() * box.width}px;top:${box.top - from.top + box.height * (0.2 + Math.random() * 0.7)}px;width:${size}px;height:${size}px;background:${colours[i % colours.length]}`;
      area.append(ember);
      const rise = box.height * 0.8 + Math.random() * Math.min(innerHeight * 0.45, 300);
      ember.animate(
        [
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${(Math.random() - 0.5) * 120}px, ${-rise}px) scale(.15)`, opacity: 0 },
        ],
        { duration: 800 + Math.random() * 900, easing: 'cubic-bezier(.15,.7,.4,1)' },
      ).finished.then(() => ember.remove());
    }
  }

  let queued = false;
  function update() {
    queued = false;
    flyInto();
    // Ghost words drift sideways as their section passes.
    ghosts.forEach((ghost) => {
      const band = ghost.parentElement.getBoundingClientRect();
      if (band.bottom < 0 || band.top > innerHeight) return;
      const passed = clamp((innerHeight - band.top) / (innerHeight + band.height));
      ghost.style.transform = `translateX(${((0.5 - passed) * 14).toFixed(2)}vw)`;
    });
    seal.style.transform = `rotate(${(scrollY * 0.12).toFixed(1)}deg)`;
    numerals.forEach((numeral) => {
      numeral.style.fontVariationSettings = `"wdth" ${60 + 60 * smooth(arrival(numeral))}`;
    });
    // The sun in the 14 sets as it rises up the screen.
    if (sunNumeral) {
      const sunAt = sunNumeral.getBoundingClientRect();
      sunNumeral.style.setProperty('--sun', clamp((innerHeight * 0.85 - sunAt.top) / (innerHeight * 0.75)).toFixed(3));
    }
    const landed = arrival(finishMark);
    finishMark.style.transform = `scaleX(${0.34 + 0.66 * smooth(landed)})`;
    // The wordmark's last blow throws off embers, once, if anyone's there to see it.
    if (!emberBurstDone && landed >= 1 && !document.getElementById('ice')) {
      emberBurstDone = true;
      burstEmbers(finishMark);
    }
  }
  function requestUpdate() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  // The hero's height can change on resize and when web fonts arrive.
  new ResizeObserver(() => {
    fitFlight();
    requestUpdate();
  }).observe(hero);
  fitFlight();
  update();
}
if (!reducedMotion) startScrollEffects();

/* ---------- Reveals: headlines stamp in and divider lines run across, once each ---------- */
function startReveals() {
  document.documentElement.classList.add('has-reveals');

  function stampIn(head) {
    const original = head.innerHTML;
    head.classList.remove('is-waiting');
    // Wrap each word to find where the lines actually break on this screen.
    head.innerHTML = original
      .split(/<br\s*\/?>/i)
      .map((part) => part.trim().split(/\s+/).map((word) => `<span>${word}</span>`).join(' '))
      .join('<br>');
    const lines = [];
    let lastTop = null;
    [...head.querySelectorAll('span')].forEach((word) => {
      if (word.offsetTop !== lastTop) {
        lines.push([]);
        lastTop = word.offsetTop;
      }
      lines[lines.length - 1].push(word.outerHTML);
    });
    head.innerHTML = lines
      .map((words) => `<span class="head__line"><span>${words.join(' ')}</span></span>`)
      .join('');
    const landed = [...head.querySelectorAll('.head__line > span')].map((line, i) => line.animate(
      [{ transform: 'translateY(112%)' }, { transform: 'none' }],
      { duration: 560, delay: i * 90, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' },
    ).finished);
    // Put the plain text back so the headline can rewrap on resize.
    Promise.all(landed).then(() => { head.innerHTML = original; });
  }

  const heads = [...document.querySelectorAll('.head')];
  heads.forEach((head) => head.classList.add('is-waiting'));
  const headWatcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        headWatcher.unobserve(entry.target);
        stampIn(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  heads.forEach((head) => headWatcher.observe(head));

  const lineWatcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        lineWatcher.unobserve(entry.target);
        entry.target.classList.add('is-in');
      }
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.perks, .perks li, .log__row').forEach((el) => lineWatcher.observe(el));
}
if (!reducedMotion) startReveals();

/* ---------- Motion: things rise in, labels decode, photos tilt, buttons pull ---------- */
function startMotion() {
  document.documentElement.classList.add('has-motion');

  // Text, images and buttons rise in as they arrive, a beat apart.
  const risers = document.querySelectorAll([
    'main .lede', 'main .date > div > p:not(.date__day)', '.poster', '.plate',
    '.founder > div > p:not(.label):not(.lede)', '.pull', '.log__row > div:first-child > p',
    '.reel', '.finish__actions', '.follow__list li',
  ].join(','));
  risers.forEach((el) => el.classList.add('rise'));
  const riseWatcher = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry, i) => {
      riseWatcher.unobserve(entry.target);
      entry.target.style.setProperty('--d', `${i * 80}ms`);
      entry.target.classList.add('is-up');
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  risers.forEach((el) => riseWatcher.observe(el));

  // Section labels decode like a race timer settling on a reading.
  const GLYPHS = '#%&@$*+=<>/0123456789';
  function decode(label) {
    const final = label.textContent;
    const start = performance.now();
    const length = 650;
    (function frame(now) {
      const done = Math.min(1, (now - start) / length);
      const settled = Math.floor(done * final.length);
      label.textContent = [...final].map((ch, i) => (
        i < settled || /\s/.test(ch) ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      )).join('');
      if (done < 1) requestAnimationFrame(frame);
      else label.textContent = final;
    })(start);
  }
  const labels = document.querySelectorAll('main .label');
  const labelWatcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      labelWatcher.unobserve(entry.target);
      decode(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  labels.forEach((label) => labelWatcher.observe(label));

  // The founder's photo drifts inside its frame as you scroll past.
  const photo = document.querySelector('.plate__photo img');
  let queued = false;
  function drift() {
    queued = false;
    const box = photo.parentElement.getBoundingClientRect();
    if (box.bottom < 0 || box.top > innerHeight) return;
    const passed = Math.min(1, Math.max(0, (innerHeight - box.top) / (innerHeight + box.height)));
    photo.style.transform = `scale(1.12) translateY(${((0.5 - passed) * 7).toFixed(2)}%)`;
  }
  addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(drift);
    }
  }, { passive: true });
  drift();

  // On phones the posters tilt and catch the light as they scroll past.
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const posters = [...document.querySelectorAll('.poster')];
    let tiltQueued = false;
    const tiltAll = () => {
      tiltQueued = false;
      posters.forEach((card) => {
        const box = card.getBoundingClientRect();
        if (box.bottom < 0 || box.top > innerHeight) return;
        const t = Math.min(1, Math.max(0, (innerHeight - box.top) / (innerHeight + box.height))); // 0 entering, 1 leaving
        card.style.transform = `perspective(900px) rotateX(${((0.5 - t) * 14).toFixed(2)}deg) rotateY(${((t - 0.5) * -6).toFixed(2)}deg)`;
        card.style.setProperty('--my', `${(t * 120 - 10).toFixed(1)}%`);
        card.style.setProperty('--mx', `${(70 - t * 40).toFixed(1)}%`);
        card.style.setProperty('--lit', (1 - Math.abs(t - 0.5) * 2).toFixed(2));
      });
    };
    addEventListener('scroll', () => {
      if (!tiltQueued) {
        tiltQueued = true;
        requestAnimationFrame(tiltAll);
      }
    }, { passive: true });
    tiltAll();
    return;
  }

  // With a mouse: the poster and photo tilt toward the pointer and catch the light, buttons pull toward it.
  document.querySelectorAll('.poster, .plate').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 11).toFixed(2)}deg)`;
      card.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty('--lit', '1');
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
      card.style.setProperty('--lit', '0');
    });
  });
  document.querySelectorAll('.btn, .watch__join').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const box = button.getBoundingClientRect();
      const x = event.clientX - (box.left + box.width / 2);
      const y = event.clientY - (box.top + box.height / 2);
      button.style.translate = `${(x * 0.18).toFixed(1)}px ${(y * 0.3).toFixed(1)}px`;
    });
    button.addEventListener('pointerleave', () => { button.style.translate = ''; });
  });
}
if (!reducedMotion) startMotion();

/* ---------- Dates: keep the page honest once a run has happened ---------- */
const today = new Date();
today.setHours(0, 0, 0, 0);
const events = [...document.querySelectorAll('[data-event-date]')];
const upcoming = [];

events.forEach((event) => {
  const date = new Date(`${event.dataset.eventDate}T00:00:00`);
  if (date < today) {
    event.classList.add('is-past');
    event.querySelector('[data-status]').textContent = 'This one is done. New dates land in the WhatsApp group first.';
    event.querySelector('[data-register]')?.remove();
  } else {
    upcoming.push(date);
  }
});

const nextRun = document.getElementById('next-run');
// If the hero button points at a run's registration, it goes back to the group once that run has happened.
if (events[0].classList.contains('is-past')) {
  const cta = document.getElementById('hero-cta');
  cta.href = 'https://chat.whatsapp.com/GVBxCZZX6PT1FpaxrgBIuQ?mode=gi_t';
  cta.textContent = 'Join the run club on WhatsApp';
}
if (upcoming.length === 0) {
  nextRun.textContent = 'New dates land in the WhatsApp group first.';
} else if (events[0].classList.contains('is-past')) {
  nextRun.textContent = upcoming[0].toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '') + '. Details coming soon.';
}

/* ---------- Countdown: the clock to the next run, in the card and the hero ---------- */
function startCountdowns() {
  const clocks = [...document.querySelectorAll('[data-countdown]')];
  if (!clocks.length || document.getElementById('run-for-the-mind')?.classList.contains('is-past')) return;
  const start = new Date(clocks[0].dataset.countdown).getTime();
  const end = new Date(clocks[0].dataset.ends).getTime();
  const pad = (n) => String(n).padStart(2, '0');
  let timer;
  function tick() {
    const now = Date.now();
    if (now >= end) {
      clocks.forEach((clock) => { clock.hidden = true; });
      clearInterval(timer);
      return;
    }
    const left = Math.max(0, Math.floor((start - now) / 1000));
    const values = { d: Math.floor(left / 86400), h: Math.floor(left / 3600) % 24, m: Math.floor(left / 60) % 60, s: left % 60 };
    clocks.forEach((clock) => {
      clock.hidden = false;
      clock.classList.toggle('is-live', now >= start);
      clock.querySelector('[data-countdown-label]').textContent = now >= start ? 'Happening now' : 'Starts in';
      clock.querySelectorAll('[data-unit]').forEach((digit) => {
        const text = pad(values[digit.dataset.unit]);
        if (digit.textContent === text) return;
        digit.textContent = text;
        if (!reducedMotion) digit.animate(
          [{ transform: 'translateY(-.35em)', opacity: 0, filter: 'blur(2px)' }, { transform: 'none', opacity: 1, filter: 'none' }],
          { duration: 280, easing: 'cubic-bezier(.2, .8, .3, 1)' });
      });
    });
  }
  tick();
  timer = setInterval(tick, 1000);
}
startCountdowns();

/* ---------- Add to calendar: Apple devices get the calendar file ---------- */
const addCalendar = document.getElementById('add-calendar');
if (addCalendar) {
  if (addCalendar.closest('.is-past')) addCalendar.closest('[data-share]').remove();
  else if (/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) {
    addCalendar.href = 'assets/run-for-the-mind.ics';
    addCalendar.removeAttribute('target');
  }
}

/* ---------- RSVP: "Are you in?" for the next event, saved in Supabase ---------- */
// The URL and the anon key are meant to be public. The database only lets
// visitors add an RSVP and read the headcount; see supabase/rsvp.sql.
const SUPABASE = {
  url: 'https://btdeacnzfytwlxgcgifb.supabase.co',
  key: 'sb_publishable_tGyrRXbOQF8O4JAejLeTOQ_YYokYRQo',
};

function startRsvp() {
  const form = document.getElementById('rsvp-form');
  if (!form || !SUPABASE.url || !SUPABASE.key) return;
  if (form.closest('.is-past')) return;
  const event = form.dataset.event;
  const done = document.getElementById('rsvp-done');
  const errorEl = document.getElementById('rsvp-error');
  const headers = {
    apikey: SUPABASE.key,
    'Content-Type': 'application/json',
  };
  const remembered = `forged-rsvp-${event}`;

  // A burst of green and blue confetti from the button that was pressed.
  function confetti(from) {
    if (reducedMotion) return;
    const colours = ['#2BD96B', '#6CF29A', '#3D6BFF', '#9DB4FF', '#FFF4EC'];
    const x = from.left + from.width / 2;
    const y = from.top + from.height / 2;
    for (let i = 0; i < 70; i++) {
      const bit = document.createElement('i');
      bit.className = 'rsvp-confetti';
      const w = 5 + Math.random() * 6;
      bit.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${w * (0.4 + Math.random() * 0.8)}px;background:${colours[i % colours.length]}`;
      document.body.append(bit);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const power = 160 + Math.random() * 260;
      const dx = Math.cos(angle) * power;
      const dy = Math.sin(angle) * power;
      const spin = (Math.random() - 0.5) * 900;
      bit.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${dy * 0.8}px)) rotate(${spin * 0.5}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 320}px)) rotate(${spin}deg)`, opacity: 0 },
      ], { duration: 1300 + Math.random() * 900, easing: 'cubic-bezier(.2,.6,.4,1)' }).finished.then(() => bit.remove());
    }
  }

  // Saying yes: a green flash, shockwave rings round the stamp, and confetti
  // from the button and both sides of the screen.
  function celebrate(pressed) {
    confetti(pressed);
    // The form folds away into the stamp, so bring the stamp to the middle.
    done.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    if (reducedMotion) return;
    setTimeout(() => {
      confetti({ left: -20, top: innerHeight * 0.75, width: 0, height: 0 });
      confetti({ left: innerWidth + 20, top: innerHeight * 0.75, width: 0, height: 0 });
    }, 180);
    const flash = document.createElement('div');
    flash.className = 'rsvp-flash';
    document.body.append(flash);
    flash.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' })
      .finished.then(() => flash.remove());
    const stamp = document.getElementById('rsvp-stamp');
    const box = stamp.getBoundingClientRect();
    const area = done.getBoundingClientRect();
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('i');
      ring.className = 'rsvp-ring';
      ring.style.left = `${box.left - area.left + box.width / 2}px`;
      ring.style.top = `${box.top - area.top + box.height / 2}px`;
      done.append(ring);
      ring.animate(
        [{ transform: 'scale(.3)', opacity: 0.9 }, { transform: 'scale(4.5)', opacity: 0 }],
        { duration: 900, delay: 300 + i * 140, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' },
      ).finished.then(() => ring.remove());
    }
    document.getElementById('run-for-the-mind').animate([
      { transform: 'translate(0, 0)' }, { transform: 'translate(-4px, 2px)' }, { transform: 'translate(4px, -2px)' },
      { transform: 'translate(-2px, 1px)' }, { transform: 'translate(0, 0)' },
    ], { duration: 320, delay: 300 });
  }

  // The card only animates while it's on screen.
  const liveWatcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-live', entry.isIntersecting));
  });
  liveWatcher.observe(form);

  function showDone(attending, isNew) {
    form.hidden = true;
    done.hidden = false;
    done.classList.toggle('is-new', isNew);
    document.getElementById('rsvp-stamp').textContent = attending ? "You're in" : 'Next time';
    document.getElementById('rsvp-line').textContent = attending
      ? 'See you at 6:30 AM on 22 Nov at United Colors of Benetton, Goa Velha. Wear green or blue, and stay for the breakfast buffet at Edward’s Yard.'
      : 'No worries. New dates land in the WhatsApp group first.';
  }

  let saved = null;
  try { saved = localStorage.getItem(remembered); } catch (error) { /* private mode */ }
  if (saved === 'yes' || saved === 'no') {
    showDone(saved === 'yes', false);
    return;
  }
  form.hidden = false;

  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    const attending = submitEvent.submitter?.value !== 'no';
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    errorEl.textContent = '';
    if (data.get('website')) return; // a bot filled the hidden field
    if (!name) {
      errorEl.textContent = 'Add your name first.';
      form.elements.name.focus();
      return;
    }
    const pressed = (submitEvent.submitter || form.querySelector('.btn--hot')).getBoundingClientRect();
    form.classList.add('is-sending');
    try {
      const response = await fetch(`${SUPABASE.url}/rest/v1/rsvps`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ event, name: name.slice(0, 80), phone: phone.slice(0, 20) || null, attending }),
      });
      if (!response.ok) throw new Error(String(response.status));
      try { localStorage.setItem(remembered, attending ? 'yes' : 'no'); } catch (error) { /* private mode */ }
      showDone(attending, true);
      if (attending) celebrate(pressed);
    } catch (error) {
      errorEl.textContent = "That didn't go through. Check your connection and try again.";
    } finally {
      form.classList.remove('is-sending');
    }
  });
}
startRsvp();

// theforged.in/#rsvp is the link to share: the ice breaks as usual, then
// the page glides down to the "Are you in?" card for the next event.
function openRsvpLink() {
  if (location.hash !== '#rsvp') return;
  const land = () => {
    const target = ['rsvp-form', 'rsvp-done', 'run-for-the-mind']
      .map((id) => document.getElementById(id))
      .find((el) => el && !el.hidden);
    target?.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
  };
  // Wait for the preloader to finish, then a beat for the page to settle.
  const started = performance.now();
  (function waitForIce() {
    if (document.getElementById('ice') && performance.now() - started < 9000) {
      setTimeout(waitForIce, 150);
    } else {
      setTimeout(land, 400);
    }
  })();
}
openRsvpLink();

/* ---------- The medal: a 3D FORGED medal in the finish, loaded only when it's near ---------- */
(function loadMedal() {
  const figure = document.getElementById('medal');
  const anchor = document.querySelector('.finish__actions');
  if (!figure || !anchor || !('IntersectionObserver' in window)) return;
  const near = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    near.disconnect();
    import('./medal.js').then(({ startMedal }) => {
      figure.hidden = false;
      if (!startMedal(figure, { reducedMotion })) figure.hidden = true;
    }).catch(() => { figure.hidden = true; });
  }, { rootMargin: '900px 0px' });
  near.observe(anchor);
})();

/* ---------- Reels: play each video while it's on screen ---------- */
function loadInstagramEmbeds() {
  if (window.instgrm) {
    window.instgrm.Embeds.process();
  } else if (!document.getElementById('instagram-embed')) {
    const script = document.createElement('script');
    script.id = 'instagram-embed';
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.append(script);
  }
}

function startReel(reel) {
  const frame = reel.querySelector('.reel__frame');
  const video = reel.querySelector('video');
  const sound = reel.querySelector('.reel__sound');

  // No video file yet, so fall back to Instagram's embed (which can't autoplay).
  function showEmbed() {
    frame.classList.add('is-embed');
    frame.innerHTML = '';
    const embed = document.createElement('blockquote');
    embed.className = 'instagram-media';
    embed.dataset.instgrmPermalink = reel.dataset.permalink;
    embed.dataset.instgrmVersion = '14';
    frame.append(embed);
    loadInstagramEmbeds();
    // Instagram's frame arrives without a title; give it one for screen readers.
    new MutationObserver((changes, watcher) => {
      const iframe = frame.querySelector('iframe');
      if (iframe) {
        iframe.title = video.getAttribute('aria-label') || 'Instagram reel';
        watcher.disconnect();
      }
    }).observe(frame, { childList: true, subtree: true });
  }
  // Nothing loads until the reel is close to the screen: not the video, and
  // not Instagram's embed, which is over a megabyte on its own.
  const source = reel.querySelector('source');
  source.addEventListener('error', showEmbed);
  const nearby = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    nearby.disconnect();
    source.src = source.dataset.src;
    video.load();
  }, { rootMargin: '600px 0px' });
  nearby.observe(reel);

  sound.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.textContent = video.muted ? 'Sound on' : 'Sound off';
    sound.setAttribute('aria-pressed', String(!video.muted));
  });

  // People who ask for less motion get normal controls instead of autoplay.
  if (reducedMotion) {
    video.controls = true;
    sound.hidden = true;
    return;
  }
  new IntersectionObserver((entries) => {
    // Fast scrolling can batch several changes; only the latest one counts.
    if (entries[entries.length - 1].isIntersecting) {
      video.play().catch(() => { video.controls = true; });
    } else {
      video.pause();
    }
  }, { threshold: 0.5 }).observe(video);
}
document.querySelectorAll('.reel').forEach(startReel);
