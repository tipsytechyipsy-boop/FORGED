const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Christmas mode is switched on in the page's head, by date or ?xmas.
const xmas = document.documentElement.classList.contains('is-xmas');

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

  // Christmas: the ice block sits inside a snow globe that shakes with each blow.
  const globeParts = [];
  if (xmas) {
    const globe = document.createElement('div');
    globe.className = 'ice__globe';
    stage.prepend(globe);
    const glass = document.createElement('div');
    glass.className = 'ice__glass';
    const base = document.createElement('div');
    base.className = 'ice__base';
    stage.append(glass, base);
    globeParts.push(globe, glass, base);
    msgEl.textContent = 'Shaking the snow globe';
    // The logo inside is the Christmas one: the F in a Santa hat, fairy lights and holly.
    logo.removeAttribute('srcset');
    logo.removeAttribute('sizes');
    logo.srcset = 'assets/xmas-logo-480.webp 445w, assets/xmas-logo.webp 890w';
    logo.sizes = 'min(68vmin, 446px)';
    logo.src = 'assets/xmas-logo.webp';
    logo.classList.add('ice__logo--xmas');
    const ready = () => logo.classList.add('is-ready');
    if (logo.decode) logo.decode().then(ready, ready);
    else logo.addEventListener('load', ready, { once: true });
  }

  // Christmas: it's the globe's glass that cracks, from one impact point near the top right.
  // Coordinates are % of the globe's own square; the glass is a circle of radius 49.
  let globeCracks = null;
  let globeShards = [];
  const GLOBE_HIT = [64, 30];
  if (xmas) {
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const inGlass = ([x, y]) => Math.hypot(x - 50, y - 50) <= 48;
    // A jagged line from the impact point outward, stopping at the rim.
    const ray = (angle, from, to) => {
      const pts = [];
      for (let r = from; r <= to; r += 3.5) {
        const wobble = (rand() - 0.5) * 0.12;
        const p = [GLOBE_HIT[0] + Math.cos(angle + wobble) * r, GLOBE_HIT[1] + Math.sin(angle + wobble) * r];
        if (!inGlass(p)) break;
        pts.push(p);
      }
      return pts;
    };
    // A broken ring around the impact point, like a spider web.
    const ring = (radius, angles) => angles.map((a) => [GLOBE_HIT[0] + Math.cos(a) * radius * (0.85 + rand() * 0.3), GLOBE_HIT[1] + Math.sin(a) * radius * (0.85 + rand() * 0.3)]).filter(inGlass);
    const toPath = (pts) => (pts.length > 1 ? `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}` : '');
    const angles = Array.from({ length: 9 }, (_, i) => (i / 9) * Math.PI * 2 + rand() * 0.4);
    const blows = [
      angles.slice(0, 6).map((a) => toPath([GLOBE_HIT, ...ray(a, 3, 12)])),
      [...angles.map((a) => toPath(ray(a, 12, 34))), toPath(ring(11, angles.slice(0, 6)))],
      [...angles.map((a) => toPath(ray(a, 34, 120))), toPath(ring(24, angles)), toPath(ring(40, angles.slice(2, 8)))],
    ].map((group) => group.filter(Boolean));
    globeCracks = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    globeCracks.setAttribute('class', 'ice__globe-cracks');
    globeCracks.setAttribute('viewBox', '0 0 100 100');
    stage.append(globeCracks);
    globeParts.push(globeCracks);
    var globeCrackGroups = blows.map((group) => group.flatMap((d) => (
      [['rgb(20 40 55 / .55)', '0.7'], ['#FFFFFF', '0.28']].map(([stroke, width]) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('pathLength', '1');
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', width);
        globeCracks.append(path);
        return path;
      })
    )));

    // The glass breaks into wedges that fan out from the impact point to the rim.
    const rimHit = (angle) => {
      // where a ray from the impact point leaves the glass circle
      const dx = Math.cos(angle), dy = Math.sin(angle);
      const fx = GLOBE_HIT[0] - 50, fy = GLOBE_HIT[1] - 50;
      const b = fx * dx + fy * dy;
      const t = -b + Math.sqrt(b * b - (fx * fx + fy * fy - 49 * 49));
      return [GLOBE_HIT[0] + dx * t, GLOBE_HIT[1] + dy * t];
    };
    const pieces = document.createElement('div');
    pieces.className = 'ice__globe-shards';
    stage.append(pieces);
    globeParts.push(pieces);
    const cuts = [...angles].sort((a, b) => a - b);
    globeShards = cuts.map((a0, i) => {
      const a1 = i === cuts.length - 1 ? cuts[0] + Math.PI * 2 : cuts[i + 1];
      const pts = [GLOBE_HIT];
      const steps = 6;
      for (let k = 0; k <= steps; k++) {
        // follow the rim between the two cut lines, measured round the globe's centre
        const p0 = rimHit(a0 + ((a1 - a0) * k) / steps);
        pts.push(p0);
      }
      const shard = document.createElement('i');
      shard.className = 'ice__globe-shard';
      shard.style.clipPath = `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(',')})`;
      const mid = (a0 + a1) / 2;
      shard.style.transformOrigin = `${(GLOBE_HIT[0] + Math.cos(mid) * 20).toFixed(1)}% ${(GLOBE_HIT[1] + Math.sin(mid) * 20).toFixed(1)}%`;
      pieces.append(shard);
      return { shard, mid };
    });
    ice.classList.add('is-globe'); // the globe is built: now the preloader can show
  }
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
    if (globeCracks) globeCracks.style.visibility = 'hidden';
    // Christmas: the globe's glass wedges fly out from where it was hit, then fall.
    globeShards.forEach(({ shard, mid }) => {
      shard.style.visibility = 'visible';
      const reach = size * between(0.5, 1.0);
      const x = Math.cos(mid) * reach;
      const y = Math.sin(mid) * reach;
      const spin = between(-120, 120);
      shard.animate([
        { transform: 'none', opacity: 1, easing: 'cubic-bezier(.1,.7,.5,1)' },
        { transform: `translate(${x * 0.6}px, ${y * 0.6}px) rotate(${spin * 0.5}deg)`, opacity: 1, offset: 0.4, easing: 'cubic-bezier(.6,0,1,.7)' },
        { transform: `translate(${x}px, ${y + size * 1.2}px) rotate(${spin}deg) scale(.85)`, opacity: 0 },
      ], { duration: 1050, fill: 'forwards' });
    });
    // Christmas: the logo in its Santa hat pops out as the glass bursts and the base drops away.
    if (xmas) {
      logo.style.transform = 'none';
      logo.animate(
        [{ transform: 'translate(-8.82%, 6.42%) scale(.659)' }, { transform: 'scale(1.06) rotate(2deg)', offset: 0.6 }, { transform: 'none' }],
        { duration: 650, easing: 'cubic-bezier(.3,1.4,.5,1)' },
      );
    }
    globeParts.slice(0, 3).forEach((part, i) => part.animate(
      i === 2
        ? [{ transform: 'none', opacity: 1 }, { transform: 'translateY(40%) scale(.9)', opacity: 0 }]
        : [{ transform: 'none', opacity: 1 }, { transform: 'scale(1.3)', opacity: 0, filter: 'blur(4px)' }],
      { duration: 520, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' },
    ));
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
    globeParts.forEach((part) => { part.style.display = 'none'; });
    if (xmas) logo.style.transform = 'none';
    block.style.visibility = 'hidden';
    crackBox.style.visibility = 'hidden';
    logo.style.visibility = 'visible';
    const navF = document.querySelector('.nav__f img');
    const orged = document.querySelector('.nav__orged');
    let target = navF.getBoundingClientRect();
    if (xmas) {
      // The hatted image is bigger than the F, so aim for the F's own square.
      const box = navF.parentElement.getBoundingClientRect();
      const h = box.height;
      target = { left: box.left - 0.0342 * h, top: box.top - 0.0497 * h, width: 1.096 * h, height: 1.096 * h, bottom: box.bottom };
    }
    // At Christmas the logo image is bigger than the F (the hat and holly stick out),
    // so the flight is measured from the F's own square, which is the stage.
    const from = (xmas ? stage : logo).getBoundingClientRect();
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
    strike(1, (xmas ? globeCrackGroups : crackGroups)[0]);
    await wait(420);
    if (finished) return;
    strike(1.6, (xmas ? globeCrackGroups : crackGroups)[1]);
    await Promise.all([wait(420), Promise.race([pageLoaded, wait(1500)])]);
    if (finished) return;
    strike(2.2, (xmas ? globeCrackGroups : crackGroups)[2]);
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
  // Every road layer follows the route's curve; the runner's own shapes (Santa's hat) don't.
  const lines = [...road.querySelectorAll('path')].filter((line) => !line.closest('.route__runner'));
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

  // Christmas: stars twinkle along the trail, and the stretch to the next stop glows gold.
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let twinkles = [];
  let nextLeg = null;
  if (xmas) {
    nextLeg = document.createElementNS(SVG_NS, 'g');
    nextLeg.setAttribute('class', 'route__nextleg');
    nextLeg.innerHTML = '<path class="route__nextleg-glow"/><path class="route__nextleg-line"/>';
    road.insertBefore(nextLeg, runner);
    const stars = document.createElementNS(SVG_NS, 'g');
    stars.setAttribute('class', 'route__twinkles');
    road.insertBefore(stars, runner);
    twinkles = Array.from({ length: 14 }, (_, i) => {
      const star = document.createElementNS(SVG_NS, 'path');
      star.setAttribute('class', 'route__twinkle');
      star.setAttribute('d', 'M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z');
      star.style.setProperty('--t', `${(1.6 + (i % 5) * 0.45).toFixed(2)}s`);
      star.style.setProperty('--d', `${(-i * 0.37).toFixed(2)}s`);
      stars.append(star);
      return star;
    });
  }

  let reached = 1; // share of the road's length covered by the trail
  let roadLength = 0; // in pixels
  let stopLengths = []; // how far along the road each stop sits, in pixels
  let head = [0, 0];
  let runnerAt = null; // pixels along the road while running; null once it's waiting
  let runnerScale = 1;
  // The runner waits just short of the next coin, so the hot coin stays in view.
  // At Christmas, Santa waits right on the coin, under its lifted label.
  const waitAt = () => Math.max(0, stopLengths[stops.indexOf(next)] - (xmas ? 0 : (parseFloat(getComputedStyle(route).getPropertyValue('--coin')) || 24) * 1.7));

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
    if (!w || !h) return; // not laid out yet; the resize watcher below draws it once it is
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

    // Christmas: the stars spread along the poured trail, and the last done stop
    // to the next one (or to the mystery stop) is the glowing "next stop" path.
    twinkles.forEach((star, i) => {
      const p = pointAt(roadLength * reached * ((i + 0.5) / twinkles.length));
      const off = (i % 2 ? 1 : -1) * (width * 0.55 + (i % 3) * 3);
      star.setAttribute('transform', `translate(${p.x.toFixed(1)} ${(p.y + off).toFixed(1)}) scale(${(width / 18).toFixed(2)})`);
    });
    if (nextLeg) {
      const doneCount = stops.filter(isDone).length;
      const from = doneCount ? all[doneCount] : all[0];
      const to = next ? points[nextIndex] : end;
      const leg = from === to ? '' : `M${from[0].toFixed(1)} ${from[1].toFixed(1)} ${sweep(from, to)}`;
      nextLeg.querySelectorAll('path').forEach((path) => path.setAttribute('d', leg));
      nextLeg.style.setProperty('--road', `${width}px`);
    }

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
if (events[0]?.classList.contains('is-past')) {
  const cta = document.getElementById('hero-cta');
  cta.href = 'https://chat.whatsapp.com/GVBxCZZX6PT1FpaxrgBIuQ?mode=gi_t';
  cta.textContent = 'Join the run club on WhatsApp';
}
// A teaser with no date yet keeps its own line.
if (events.length && upcoming.length === 0) {
  nextRun.textContent = 'New dates land in the WhatsApp group first.';
} else if (events[0]?.classList.contains('is-past')) {
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

/* ---------- Christmas: snow, fairy lights and frost glints ---------- */
function startChristmas() {
  const hero = document.getElementById('hero');
  const NS = 'http://www.w3.org/2000/svg';

  // The nav's F wears the Santa hat too.
  const navMark = document.querySelector('.nav__f img');
  navMark.src = 'assets/xmas-logo-178.webp';
  navMark.width = 178;
  navMark.height = 224;
  navMark.classList.add('nav__f--xmas');

  // Glints of light twinkling on the frosted wordmark.
  const mark = document.querySelector('.ingot .wordmark');
  [[6, 26], [15, 62], [22, 20], [31, 46], [40, 16], [47, 70], [55, 30], [63, 22], [72, 54], [80, 18], [88, 42], [95, 26]].forEach(([x, y], i) => {
    const glint = document.createElement('i');
    glint.className = 'xmas-glint';
    glint.style.cssText = `left:${x}%;top:${y}%;--t:${2.2 + (i % 4) * 0.7}s;--d:${(i * 0.45).toFixed(2)}s`;
    mark.append(glint);
  });

  // Fairy lights: a sagging string along the top edge of the hero and each band.
  const COLORS = ['#FF4D4D', '#F5C452', '#4ADE80', '#FFF7E0', '#60A5FA'];
  // Strings off screen stop twinkling.
  const lightsWatcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-off', !entry.isIntersecting);
      // The first time a band's lights show, its snow settles and its icicles grow.
      if (entry.isIntersecting && entry.target.querySelector('.snow')) {
        entry.target.classList.add('is-snowy');
        snowed.add(entry.target.parentElement);
      }
    });
  });
  const snowed = new Set();
  const hosts = [hero, ...document.querySelectorAll('.band')];
  function stringLights() {
    const slant = innerWidth * 0.035;
    hosts.forEach((host) => {
      host.querySelector(':scope > .xmas-lights')?.remove();
      const w = host.clientWidth;
      if (!w) return; // not laid out yet; strung again on the next resize
      // Bands are cut on a slant, high on the right; the hero is flat.
      const fall = host === hero ? 0 : slant;
      let left = fall; // how far down the string starts at the left edge
      // Where a ticker tape lies across the band's top edge, the lights hang just below it.
      const tape = host.previousElementSibling;
      if (tape && tape.classList.contains('tape')) {
        const belt = (tape.querySelector('.tape__belt') || tape).getBoundingClientRect();
        left = Math.max(left, belt.bottom - host.getBoundingClientRect().top + 2);
      }
      const top = left;
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'xmas-lights');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('height', String(Math.ceil(top + 40)));
      svg.setAttribute('viewBox', `0 0 ${w} ${Math.ceil(top + 40)}`);
      const yAt = (x) => left - fall * (x / w) + 3;
      const span = Math.max(110, Math.min(170, w / 8));
      let d = `M0 ${yAt(0).toFixed(1)}`;
      for (let x = 0; x < w; x += span) {
        const x2 = Math.min(w, x + span);
        d += ` Q${((x + x2) / 2).toFixed(1)} ${((yAt(x) + yAt(x2)) / 2 + 22).toFixed(1)} ${x2.toFixed(1)} ${yAt(x2).toFixed(1)}`;
      }
      const rope = document.createElementNS(NS, 'path');
      rope.setAttribute('class', 'rope');
      rope.setAttribute('d', d);
      svg.append(rope);
      host.prepend(svg);
      // Bulbs twinkle in four groups rather than one by one, and their glow is a soft
      // halo shape rather than a live blur, so scrolling stays smooth.
      const groups = [0, 1, 2, 3].map((i) => {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', `bulbs bulbs--${i}`);
        svg.append(g);
        return g;
      });
      const length = rope.getTotalLength();
      const count = Math.round(length / 34);
      for (let i = 0; i < count; i++) {
        const p = rope.getPointAtLength(((i + 0.5) / count) * length);
        const color = COLORS[i % COLORS.length];
        const group = groups[(i * 7) % 4];
        const halo = document.createElementNS(NS, 'circle');
        halo.setAttribute('cx', p.x.toFixed(1));
        halo.setAttribute('cy', (p.y + 6).toFixed(1));
        halo.setAttribute('r', '9');
        halo.setAttribute('fill', color);
        halo.setAttribute('opacity', '.22');
        const bulb = document.createElementNS(NS, 'ellipse');
        bulb.setAttribute('cx', p.x.toFixed(1));
        bulb.setAttribute('cy', (p.y + 6).toFixed(1));
        bulb.setAttribute('rx', '3.6');
        bulb.setAttribute('ry', '5.4');
        bulb.setAttribute('fill', color);
        group.append(halo, bulb);
      }
      // Snow settles along each band's top edge, with icicles hanging from it.
      if (host !== hero) {
        const edge = (x) => yAt(x) - 3;
        let snow = `M0 ${(edge(0) - 1).toFixed(1)} L${w} ${(edge(w) - 1).toFixed(1)}`;
        for (let x = w; x >= 0; x -= 18) {
          const lump = 5 + Math.abs(Math.sin(x * 0.07)) * 4 + Math.abs(Math.sin(x * 0.019)) * 3;
          snow += ` Q${(x - 9).toFixed(1)} ${(edge(x - 9) + lump + 3).toFixed(1)} ${Math.max(0, x - 18).toFixed(1)} ${(edge(x - 18) + lump * 0.7).toFixed(1)}`;
        }
        const drift = document.createElementNS(NS, 'path');
        drift.setAttribute('class', 'snow');
        drift.setAttribute('d', `${snow} Z`);
        svg.insertBefore(drift, rope);
        const ice = document.createElementNS(NS, 'g');
        ice.setAttribute('class', 'icicles');
        for (let x = 14 + (w % 23); x < w - 8; x += 26 + ((x * 7) % 19)) {
          const long = 7 + ((x * 13) % 17);
          const y0 = edge(x) + 6;
          const icicle = document.createElementNS(NS, 'path');
          icicle.setAttribute('class', 'icicle');
          icicle.setAttribute('d', `M${(x - 2.6).toFixed(1)} ${y0.toFixed(1)} L${x.toFixed(1)} ${(y0 + long).toFixed(1)} L${(x + 2.6).toFixed(1)} ${y0.toFixed(1)} Z`);
          icicle.style.setProperty('--d', `${((x / w) * 0.9).toFixed(2)}s`);
          ice.append(icicle);
        }
        svg.insertBefore(ice, rope);
        if (snowed.has(host)) svg.classList.add('is-snowy');
      }
      lightsWatcher.observe(svg);
    });
  }
  stringLights();
  let lightsQueued = 0;
  addEventListener('resize', () => {
    clearTimeout(lightsQueued);
    lightsQueued = setTimeout(stringLights, 200);
  });

  // Once you scroll past the top, the wordmark's shine and glints rest: they'd
  // otherwise be redrawn every frame while the camera flies into the letters.
  let moving = false;
  addEventListener('scroll', () => {
    const now = scrollY > 30;
    if (now !== moving) {
      moving = now;
      document.documentElement.classList.toggle('xmas-moving', moving);
    }
  }, { passive: true });

  // Soft snow falling over the hero, only while it's on screen.
  if (reducedMotion) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'xmas-snow';
  canvas.setAttribute('aria-hidden', 'true');
  hero.append(canvas);
  const ctx = canvas.getContext('2d');
  let flakes = [];
  let scale = 1;
  function fit() {
    scale = 1; // soft round flakes look the same at 1x, and cost far less to draw
    canvas.width = Math.round(hero.clientWidth * scale);
    canvas.height = Math.round(hero.clientHeight * scale);
    const count = Math.round(Math.min(160, (hero.clientWidth * hero.clientHeight) / 9000));
    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: (0.7 + Math.random() * 2) * scale,
      fall: 0.25 + Math.random() * 0.8,
      sway: Math.random() * Math.PI * 2,
    }));
  }
  fit();
  new ResizeObserver(fit).observe(hero);
  let showing = false;
  function snow(now) {
    if (!showing) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    flakes.forEach((f) => {
      f.y += f.fall * scale;
      f.x += Math.sin(now / 1100 + f.sway) * 0.35 * scale;
      if (f.y > canvas.height + 4) { f.y = -4; f.x = Math.random() * canvas.width; }
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(snow);
  }
  new IntersectionObserver(([entry]) => {
    const was = showing;
    showing = entry.isIntersecting;
    if (showing && !was) requestAnimationFrame(snow);
  }).observe(hero);
}
if (xmas) startChristmas();
const admin = document.documentElement.classList.contains('is-admin');
// The present hunt and the HO HO HO sleigh are set aside for now: add ?eggs to see them.
const eggs = /[?&]eggs(?:=1)?(?:&|$)/.test(location.search);
if (xmas && eggs && !admin) startXmasEggs();
if (xmas && !admin) startXmasExtras();
if (admin) startAdmin();

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
      if (xmas) {
        figure.querySelector('canvas').setAttribute('aria-label', 'A 3D FORGED Christmas bauble. Drag it sideways to spin it.');
        figure.querySelector('.medal__hint span').textContent = 'Spin the bauble.';
      }
      if (!startMedal(figure, { reducedMotion, festive: xmas })) figure.hidden = true;
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


/* ---------- Gallery: Chase the Sun in photos, with a full-screen viewer ---------- */
(function startGallery() {
  const gallery = document.getElementById('gallery-chase');
  if (!gallery || !document.documentElement.classList.contains('show-gallery')) return;
  const wall = document.getElementById('gallery-wall');
  const items = [...gallery.querySelectorAll('.gallery__item')];
  const tiles = items.map((item) => item.querySelector('.gallery__open'));
  const filterButtons = [...gallery.querySelectorAll('.gallery__filter')];
  const more = document.getElementById('gallery-more');
  const wide = matchMedia('(min-width: 1000px)');
  const phone = matchMedia('(max-width: 599.98px)');

  // Photos fade in over their own colour once they've loaded.
  tiles.forEach((tile) => {
    const img = tile.querySelector('img');
    if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
    else img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
  });

  /* The sun in the 14 sets as you go through the evening's photos. */
  const sun = document.getElementById('gallery-sun');
  let sunQueued = false;
  let inView = false;
  function setSun() {
    sunQueued = false;
    let share;
    if (wide.matches) {
      // beside the wall: progress through the photos
      const box = wall.getBoundingClientRect();
      share = (innerHeight * 0.55 - box.top) / Math.max(1, box.height - innerHeight * 0.25);
    } else {
      // above the wall: as the numeral rises up the screen
      const box = sun.getBoundingClientRect();
      share = (innerHeight * 0.85 - box.top) / (innerHeight * 0.75);
    }
    sun.style.setProperty('--sun', Math.min(1, Math.max(0, share)).toFixed(3));
  }
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) setSun();
  }).observe(gallery);
  addEventListener('scroll', () => {
    if (inView && !sunQueued) {
      sunQueued = true;
      requestAnimationFrame(setSun);
    }
  }, { passive: true });

  /* Pick a run by its date. Only runs with photos show the wall; the rest say what's coming. */
  const RUNS = {
    '2026-10-25': {
      day: '25', month: 'Oct', title: '5K Social Run',
      intro: "Calangute's first-ever 5K community run, with MC Sammy on the mic at sunrise.",
      photos: true, stamp: "25 10 '26", file: '5k-social-run',
    },
    '2026-10-31': {
      day: '31', month: 'Oct', title: 'Run for Treats',
      intro: 'A Halloween social run with Ninety7: costumes, cupcakes, a ghost on a swing and a spooky little treat.',
      photos: true, stamp: "31 10 '26", file: 'run-for-treats',
    },
    '2026-11-14': {
      day: '14', month: 'Nov', title: 'Chase the Sun',
      intro: 'Warm-up at Paloma, a sunset run along Anjuna beach and a party after dark, on 14\u00A0November.',
      photos: true, chapters: true, stamp: "14 11 '26", file: 'chase-the-sun',
    },
    '2026-11-22': {
      day: '22', month: 'Nov', title: 'Run for the Mind',
      intro: "A free 3K run and rave for men's mental health on the Goa Velha Highway.",
      empty: ["This run hasn't happened yet", 'Photos go up after the run on 22 November. Come and be in them.'],
      link: ["RSVP: I'm in", '#run-for-the-mind'],
      after: ['Photos are coming soon', 'The photos from Run for the Mind are being picked. Check back soon.'],
    },
  };
  const runTabs = [...gallery.querySelectorAll('.gallery__run')];
  const monthEl = document.getElementById('gallery-month');
  const titleEl = document.getElementById('gallery-title');
  const introEl = document.getElementById('gallery-intro');
  const filtersEl = document.getElementById('gallery-filters');
  const hintEl = document.getElementById('gallery-hint');
  const gridEl = document.getElementById('gallery-grid');
  const emptyEl = document.getElementById('gallery-empty');
  let run = '2026-11-14';
  function selectRun(key, focusTab) {
    run = key;
    const data = RUNS[key];
    runTabs.forEach((tab) => {
      const on = tab.dataset.run === key;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focusTab) tab.focus();
    });
    sun.textContent = data.day;
    monthEl.textContent = data.month;
    titleEl.textContent = data.title;
    introEl.textContent = data.intro;
    const has = Boolean(data.photos);
    filter = 'all';
    expanded = false;
    moreRows = 0;
    filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === 'all')));
    filtersEl.hidden = !data.chapters;
    hintEl.hidden = !has;
    gridEl.hidden = !has;
    emptyEl.hidden = has;
    if (has) {
      apply(false);
    } else {
      wall.classList.remove('is-collapsed');
      more.hidden = true;
      const over = data.after && Date.now() > new Date(`${key}T10:00:00+05:30`).getTime();
      const [heading, text] = over ? data.after : data.empty;
      document.getElementById('gallery-empty-title').textContent = heading;
      document.getElementById('gallery-empty-text').textContent = text;
      const link = document.getElementById('gallery-empty-link');
      link.hidden = over || !data.link;
      if (data.link) {
        link.textContent = data.link[0];
        link.href = data.link[1];
        const away = data.link[1].startsWith('http');
        link.target = away ? '_blank' : '';
        link.rel = away ? 'noopener' : '';
      }
    }
    setSun();
  }
  runTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectRun(tab.dataset.run));
    // Arrow keys move between the dates, like any set of tabs.
    tab.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      selectRun(runTabs[(i + step + runTabs.length) % runTabs.length].dataset.run, true);
    });
  });

  /* Chapters and "show all", with the photos sliding to their new places. */
  let filter = 'all';
  let expanded = false;
  let moreRows = 0; // rows added by "Show more", a few at a time
  function apply(animate) {
    const before = new Map();
    if (animate && !reducedMotion) items.forEach((item) => { if (!item.hidden) before.set(item, item.getBoundingClientRect()); });
    items.forEach((item) => { item.hidden = item.dataset.run !== run || !(filter === 'all' || item.dataset.chapter === filter); });
    const showing = items.filter((item) => !item.hidden).length;
    const collapsed = !expanded && Boolean(RUNS[run].photos) && showing > 12;
    gridEl.style.setProperty('--rows-more', String(moreRows));
    wall.classList.toggle('is-collapsed', collapsed);
    more.hidden = !collapsed;
    if (collapsed) {
      // Count the photos still below the cut; if none are, it's all on show.
      const cut = gridEl.getBoundingClientRect().top + gridEl.clientHeight - 4;
      const left = items.filter((item) => !item.hidden && item.getBoundingClientRect().top >= cut).length;
      if (!left) {
        wall.classList.remove('is-collapsed');
        more.hidden = true;
      } else {
        more.textContent = `Show more photos (${left} more)`;
      }
    }
    if (!before.size) return;
    items.forEach((item) => {
      if (item.hidden) return;
      const now = item.getBoundingClientRect();
      const was = before.get(item);
      if (was) {
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (dx || dy) item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else {
        item.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: 140, easing: 'ease-out', fill: 'backwards' });
      }
    });
  }
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    moreRows = 0;
    filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    apply(true);
  }));
  more.addEventListener('click', () => {
    moreRows += phone.matches ? 24 : 16;
    apply(false);
  });
  selectRun(run);

  /* ---------- The viewer ---------- */
  const box = document.getElementById('lightbox');
  const stage = document.getElementById('lightbox-stage');
  const img = document.getElementById('lightbox-img');
  const glow = document.getElementById('lightbox-glow');
  const count = document.getElementById('lightbox-count');
  const caption = document.getElementById('lightbox-caption');
  const strip = document.getElementById('lightbox-strip');
  const progress = document.getElementById('lightbox-progress');
  const playButton = document.getElementById('lightbox-play');
  const toastEl = document.getElementById('lightbox-toast');
  const SLIDE = 3600;
  box.style.setProperty('--slide', `${SLIDE}ms`);
  let pool = tiles; // the photos the arrows move through: the current chapter
  let at = 0;
  let opener = null;
  let playing = false;
  let timer = 0;

  function fit() {
    const tile = pool[at];
    const w = Number(tile.dataset.w);
    const h = Number(tile.dataset.h);
    const room = stage.getBoundingClientRect();
    const scale = Math.min((room.width - 32) / w, (room.height - 8) / h);
    img.style.width = `${Math.floor(w * scale)}px`;
    img.style.height = `${Math.floor(h * scale)}px`;
  }

  function buildStrip() {
    strip.textContent = '';
    pool.forEach((tile, i) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = `lightbox__thumb${Number(tile.dataset.w) > Number(tile.dataset.h) ? ' is-wide' : ''}`;
      thumb.style.setProperty('--tile', tile.style.getPropertyValue('--tile'));
      thumb.setAttribute('aria-label', `Photo ${i + 1}`);
      const small = document.createElement('img');
      small.src = tile.querySelector('img').getAttribute('src');
      small.alt = '';
      small.loading = 'lazy';
      thumb.append(small);
      thumb.addEventListener('click', () => go(i - at));
      strip.append(thumb);
    });
  }

  const warmed = new Set();
  function warm(i) {
    const src = pool[(i + pool.length) % pool.length].dataset.full;
    if (warmed.has(src)) return;
    warmed.add(src);
    new Image().src = src;
  }

  function render(i) {
    at = (i + pool.length) % pool.length;
    const tile = pool[at];
    // Show the small copy at once, then swap in the sharp one when it's ready.
    img.src = tile.querySelector('img').getAttribute('src');
    const sharp = new Image();
    sharp.onload = () => { if (pool[at] === tile) img.src = sharp.src; };
    sharp.src = tile.dataset.full;
    const color = tile.style.getPropertyValue('--tile');
    box.style.setProperty('--glow', color);
    count.textContent = `${at + 1} / ${pool.length}`;
    caption.textContent = tile.dataset.caption || tile.dataset.chapterName;
    img.alt = tile.dataset.caption || `${tile.dataset.chapterName} at ${RUNS[run].title}`;
    fit();
    [...strip.children].forEach((thumb, k) => thumb.classList.toggle('is-on', k === at));
    strip.children[at]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', `${location.pathname}${location.search}#photo-${tile.dataset.slug}`);
    warm(at + 1);
    warm(at - 1);
    glow.animate([{ opacity: 0.25 }, { opacity: 0.6 }], { duration: 500, easing: 'ease-out' });
    schedule();
  }

  function go(step, fromDx = 0) {
    if (!step) return;
    render(at + step);
    if (reducedMotion) return;
    const dir = step > 0 ? 1 : -1;
    img.animate([{ transform: `translateX(${fromDx || dir * 70}px)`, opacity: fromDx ? 1 : 0.2 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  function open(tile, fromTile) {
    pool = tiles.filter((t) => !t.closest('.gallery__item').hidden);
    opener = tile;
    buildStrip();
    box.showModal();
    document.documentElement.classList.add('has-lightbox');
    render(pool.indexOf(tile));
    if (reducedMotion || !fromTile) return;
    // The photo grows out of its tile: same spot, same crop, then the whole picture.
    const from = tile.getBoundingClientRect();
    const to = img.getBoundingClientRect();
    const s = Math.max(from.width / to.width, from.height / to.height);
    const insetX = Math.max(0, (to.width * s - from.width) / 2 / s);
    const insetY = Math.max(0, (to.height * s - from.height) / 2 / s);
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    img.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, clipPath: `inset(${insetY}px ${insetX}px)` },
      { transform: 'none', clipPath: 'inset(0px 0px)' },
    ], { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' });
    box.animate([{ backgroundColor: 'rgb(20 8 20 / 0)' }, { backgroundColor: 'rgb(20 8 20 / 1)' }], { duration: 300, easing: 'ease-out' });
    [...box.querySelectorAll('.lightbox__top, .lightbox__bar, .lightbox__strip, .lightbox__glow')].forEach((part) => {
      part.animate([{ opacity: 0 }, { opacity: getComputedStyle(part).opacity }], { duration: 320, delay: 160, easing: 'ease-out', fill: 'backwards' });
    });
  }

  tiles.forEach((tile) => tile.addEventListener('click', () => open(tile, true)));
  box.addEventListener('close', () => {
    play(false);
    document.documentElement.classList.remove('has-lightbox');
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    opener?.focus({ preventScroll: true });
  });
  document.getElementById('lightbox-close').addEventListener('click', () => box.close());
  document.getElementById('lightbox-prev').addEventListener('click', () => go(-1));
  document.getElementById('lightbox-next').addEventListener('click', () => go(1));
  box.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
  });
  // A click on the dark space around the photo closes the viewer.
  stage.addEventListener('click', (event) => { if (event.target === stage && !dragged) box.close(); });
  addEventListener('resize', () => { if (box.open) fit(); });

  /* Swipe: the photo follows your finger, and a long enough swipe moves on. */
  let drag = null;
  let dragged = false;
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, id: event.pointerId, dx: 0 };
    dragged = false;
  });
  stage.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    drag.dx = event.clientX - drag.x;
    if (!dragged && Math.abs(drag.dx) > 8 && Math.abs(drag.dx) > Math.abs(event.clientY - drag.y)) {
      dragged = true;
      stage.setPointerCapture(event.pointerId);
    }
    if (dragged) img.style.transform = `translateX(${drag.dx}px) rotate(${(drag.dx / 60).toFixed(2)}deg)`;
  });
  const endDrag = () => {
    if (!drag) return;
    const { dx } = drag;
    drag = null;
    if (!dragged) return;
    img.style.transform = '';
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1, dx < 0 ? 90 : -90);
    else img.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 220, easing: 'ease-out' });
    setTimeout(() => { dragged = false; }, 0);
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  /* Slideshow: each photo for a few seconds, drifting gently closer. */
  function schedule() {
    clearTimeout(timer);
    progress.classList.remove('is-running');
    img.classList.remove('is-kb');
    if (!playing) return;
    void progress.offsetWidth;
    progress.classList.add('is-running');
    img.classList.add('is-kb');
    timer = setTimeout(() => go(1), SLIDE);
  }
  function play(on) {
    playing = on;
    box.classList.toggle('is-playing', on);
    playButton.setAttribute('aria-pressed', String(on));
    schedule();
  }
  playButton.addEventListener('click', () => play(!playing));

  /* Save and share: the photo as a JPEG with a little film date stamp and the club's address. */
  const files = new Map();
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  }
  function photoFile(tile) {
    if (files.has(tile)) return files.get(tile);
    const made = new Promise((resolve, reject) => {
      const full = new Image();
      full.onload = async () => {
        if (document.fonts) await document.fonts.ready;
        const c = document.createElement('canvas');
        c.width = full.naturalWidth;
        c.height = full.naturalHeight;
        const g = c.getContext('2d');
        g.drawImage(full, 0, 0);
        const size = Math.round(c.width * 0.03);
        // the orange date an old film camera prints in the corner
        g.font = `600 ${size}px "Martian Mono", monospace`;
        g.textAlign = 'right';
        g.shadowColor = 'rgba(255, 110, 30, .9)';
        g.shadowBlur = size * 0.6;
        g.fillStyle = '#FF9A3C';
        g.fillText(RUNS[run].stamp, c.width - size * 1.2, c.height - size * 1.1);
        // and where to find more
        g.textAlign = 'left';
        g.shadowColor = 'rgba(0, 0, 0, .55)';
        g.shadowBlur = size * 0.5;
        g.fillStyle = 'rgba(255, 248, 240, .9)';
        g.font = `800 ${size}px Anybody, "Arial Black", sans-serif`;
        g.fillText('FORGED  theforged.in', size * 1.2, c.height - size * 1.1);
        c.toBlob((blob) => (blob
          ? resolve(new File([blob], `forged-${RUNS[run].file}-${tile.dataset.slug}.jpg`, { type: 'image/jpeg' }))
          : reject(new Error('no blob'))), 'image/jpeg', 0.9);
      };
      full.onerror = reject;
      full.src = tile.dataset.full;
    });
    files.set(tile, made);
    made.catch(() => files.delete(tile));
    return made;
  }
  // Start making the file as soon as a finger or pointer reaches the button.
  ['lightbox-save', 'lightbox-share'].forEach((id) => {
    const button = document.getElementById(id);
    ['pointerenter', 'pointerdown', 'focus'].forEach((type) => button.addEventListener(type, () => { photoFile(pool[at]).catch(() => {}); }));
  });
  document.getElementById('lightbox-save').addEventListener('click', async () => {
    try {
      const file = await photoFile(pool[at]);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast('Photo saved');
    } catch (error) {
      toast("Couldn't save the photo. Try again.");
    }
  });
  document.getElementById('lightbox-share').addEventListener('click', async () => {
    const tile = pool[at];
    const url = `${location.origin}${location.pathname}${location.search}#photo-${tile.dataset.slug}`;
    try {
      const file = await photoFile(tile);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${RUNS[run].title} with FORGED`, text: `${RUNS[run].title} with FORGED Run Club Goa. theforged.in` });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: `${RUNS[run].title} with FORGED`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch (error) {
      if (error && error.name === 'AbortError') return; // closed the share sheet
      try {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
      } catch (e) {
        toast("Couldn't share the photo. Try Save instead.");
      }
    }
  });

  /* A link to one photo (theforged.in/?gallery#photo-al-24) opens it once the intro is done. */
  const wanted = (location.hash.match(/^#photo-([a-z0-9-]+)$/) || [])[1];
  const target = wanted && tiles.find((tile) => tile.dataset.slug === wanted);
  if (target) {
    selectRun(target.closest('.gallery__item').dataset.run);
    (function waitForIntro() {
      if (document.getElementById('ice')) setTimeout(waitForIntro, 250);
      else open(target, false);
    })();
  }
})();


/* ---------- Christmas easter eggs: Santa's present hunt, and the HO HO HO sleigh ---------- */
function startXmasEggs() {
  const KEY = 'forged-presents-2026';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: the hunt still works, it just isn't remembered */ } };
  const state = { found: [], ...load() };
  const COLORS = { red: ['#D62839', '#F5C452'], green: ['#1E8A4C', '#FFF4EC'], gold: ['#F5C452', '#C91F18'], blue: ['#2F6FDB', '#FFF4EC'] };
  const giftSvg = ([box, ribbon]) => `<svg viewBox="0 0 40 40" aria-hidden="true">
    <g class="gift__box"><rect x="6" y="19" width="28" height="18" rx="1.5" fill="${box}"/><rect x="6" y="19" width="28" height="3" fill="rgb(0 0 0 / .2)"/><rect x="18" y="19" width="4" height="18" fill="${ribbon}"/></g>
    <g class="gift__lid"><rect x="4" y="12" width="32" height="8" rx="1.5" fill="${box}"/><rect x="18" y="12" width="4" height="8" fill="${ribbon}"/><path d="M20 12c-3-7-11-8-11-3 0 3 6 4 11 3zm0 0c3-7 11-8 11-3 0 3-6 4-11 3z" fill="${ribbon}"/></g></svg>`;

  // Five presents, each tucked somewhere on the page.
  const SPOTS = [
    { id: 'wordmark', className: 'gift--hero', color: 'red', host: () => document.getElementById('ingot') },
    { id: 'halloween', className: 'gift--route', color: 'gold', host: () => document.querySelector('.route__stop[data-date="2026-10-31"]') },
    { id: 'founder', className: 'gift--founder', color: 'green', host: () => document.querySelector('.plate__frame') },
    { id: 'gallery', className: 'gift--gallery', color: 'blue', host: () => document.querySelector('.gallery__date'), inline: true },
    { id: 'finish', className: 'gift--finish', color: 'red', host: () => document.querySelector('.finish__actions'), inline: true },
  ];
  const total = SPOTS.length;

  SPOTS.forEach((spot, i) => {
    const host = spot.host();
    if (!host || state.found.includes(spot.id)) return;
    if (!spot.inline && getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const gift = document.createElement('button');
    gift.type = 'button';
    gift.className = `gift ${spot.className}`;
    gift.style.setProperty('--d', `${(i * 1.3).toFixed(1)}s`);
    gift.setAttribute('aria-label', 'A wrapped present. Open it.');
    gift.innerHTML = giftSvg(COLORS[spot.color]);
    gift.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      openGift(gift, spot);
    });
    host.append(gift);
  });

  function confetti(x, y, count, spread) {
    if (reducedMotion) return;
    const tones = ['#F5C452', '#D62839', '#FFF4EC', '#4ADE80', '#60A5FA'];
    for (let i = 0; i < count; i++) {
      const bit = document.createElement('i');
      bit.className = 'gift-bit';
      bit.style.cssText = `left:${x}px;top:${y}px;background:${tones[i % tones.length]}`;
      document.body.append(bit);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const reach = spread * (0.5 + Math.random() * 0.7);
      const dx = Math.cos(angle) * reach;
      const dy = Math.sin(angle) * reach - spread * 0.4;
      bit.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy + spread * 0.9}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => bit.remove());
    }
  }

  function openGift(gift, spot) {
    if (state.found.includes(spot.id)) return;
    state.found.push(spot.id);
    save();
    gift.classList.add('is-open');
    const box = gift.getBoundingClientRect();
    confetti(box.left + box.width / 2, box.top + box.height / 2, 16, 70);
    const lid = gift.querySelector('.gift__lid');
    if (!reducedMotion) lid.animate([{ transform: 'none' }, { transform: 'translate(10px, -26px) rotate(40deg)', opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
    gift.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.6)' }], { duration: 350, delay: reducedMotion ? 0 : 550, fill: 'forwards' }).finished.then(() => gift.remove());
    tally(true);
    if (state.found.length === total) {
      if (!state.code) {
        const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        state.code = `STASH-${Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')}`;
        state.at = Date.now();
        save();
      }
      claim();
      bubble.hidden = true;
      setTimeout(showStash, reducedMotion ? 300 : 900);
    } else {
      const left = total - state.found.length;
      hint(`${state.found.length} of ${total} found. ${left === 1 ? 'One more to go.' : 'Keep looking.'}`, 2600);
    }
  }

  /* The tally, bottom left, appears once the intro is done. */
  const counter = document.createElement('button');
  counter.type = 'button';
  counter.className = 'gifts';
  counter.innerHTML = `${giftSvg(COLORS.red)}<span><b>0</b>/${total}</span>`;
  const bubble = document.createElement('p');
  bubble.className = 'gifts__hint';
  bubble.hidden = true;
  bubble.setAttribute('role', 'status');
  let bubbleTimer = 0;
  function hint(text, ms) {
    bubble.textContent = text;
    bubble.hidden = false;
    clearTimeout(bubbleTimer);
    if (ms) bubbleTimer = setTimeout(() => { bubble.hidden = true; }, ms);
  }
  /* The first five people to find the whole stash win a prize. Supabase hands out the
     places in order (see supabase/stash.sql); the code is the proof at Sleigh the Run. */
  const PRIZES = 5;
  const rpc = async (name, body) => {
    const response = await fetch(`${SUPABASE.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: SUPABASE.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    if (!response.ok) throw new Error(`${name}: ${response.status}`);
    return response.json();
  };
  let claiming = null;
  function claim() {
    if (state.place || !state.code) return Promise.resolve();
    if (!claiming) {
      claiming = rpc('claim_stash', { stash_code: state.code })
        .then((data) => {
          if (data && data.place) {
            state.place = data.place;
            save();
          }
        })
        .catch(() => { /* offline or not set up yet: try again next time the card opens */ })
        .finally(() => { claiming = null; });
    }
    return claiming;
  }
  let prizesLeft = null;
  rpc('stash_left').then((n) => { if (typeof n === 'number') prizesLeft = n; }).catch(() => {});
  const prizeLine = () => {
    if (prizesLeft === 0) return 'All 5 prizes are claimed, but the hunt is still on.';
    if (prizesLeft) return `The first ${PRIZES} to find them all win a prize. ${prizesLeft} left!`;
    return `The first ${PRIZES} to find them all win a prize.`;
  };
  const intro = () => `Santa dropped ${total} presents somewhere on this page. Find them all and tap to open. ${prizeLine()}`;
  function tally(bump) {
    const n = state.found.length;
    counter.querySelector('b').textContent = String(n);
    counter.classList.toggle('is-done', n === total);
    counter.setAttribute('aria-label', n === total ? "You found Santa's stash. Show it again." : `Presents found: ${n} of ${total}. What's this?`);
    if (bump && !reducedMotion) counter.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
  }
  counter.addEventListener('click', () => {
    if (state.found.length === total) showStash();
    else if (bubble.hidden) hint(state.found.length ? `${state.found.length} of ${total} found. ${intro()}` : intro(), 7000);
    else bubble.hidden = true;
  });
  tally(false);
  // First visit: once the snow globe has burst, Santa flies over and drops the presents.
  (function waitForIntro() {
    if (document.getElementById('ice')) { setTimeout(waitForIntro, 300); return; }
    document.body.append(counter, bubble);
    if (state.dropped || state.found.length === total) return;
    state.dropped = true;
    save();
    if (reducedMotion) {
      setTimeout(() => hint(intro(), 8000), 800);
      return;
    }
    setTimeout(() => fly(true).then(() => {
      tally(true);
      hint(intro(), 8000);
    }), 700);
  })();

  /* Santa's stash: the card for finding all five. Screenshot it. */
  let stash = null;
  function showStash() {
    if (!stash) {
      stash = document.createElement('dialog');
      stash.className = 'stash';
      stash.setAttribute('aria-labelledby', 'stash-title');
      stash.innerHTML = `<div class="stash__card">
          <img class="stash__logo" src="assets/xmas-logo-480.webp" alt="" width="445" height="560">
          <p class="stash__count">${total} of ${total} presents</p>
          <h2 class="stash__title" id="stash-title">You found Santa&rsquo;s stash.</h2>
          <p class="stash__text">Show this at Sleigh the Run.</p>
          <p class="stash__code"><b></b><small></small></p>
          <div class="stash__actions">
            <button class="stash__btn stash__btn--share" type="button">Share</button>
            <button class="stash__btn stash__btn--close" type="button">Close</button>
          </div>
          <p class="stash__bonus">Bonus: type HO HO HO, or tap the F in the top corner three times.</p>
          <button class="stash__again" type="button">Hide the presents again</button>
        </div>`;
      document.body.append(stash);
      stash.querySelector('.stash__btn--close').addEventListener('click', () => stash.close());
      stash.addEventListener('click', (event) => { if (event.target === stash) stash.close(); });
      const share = stash.querySelector('.stash__btn--share');
      share.addEventListener('click', async () => {
        const data = { title: "I found Santa's stash", text: "I found all 5 of Santa's presents on the FORGED site. Can you?", url: `${location.origin}/` };
        try {
          if (navigator.share) { await navigator.share(data); return; }
          await navigator.clipboard.writeText(`${data.text} ${data.url}`);
          share.textContent = 'Link copied';
        } catch (error) {
          if (error && error.name === 'AbortError') return;
          share.textContent = 'Screenshot it!';
        }
      });
      stash.querySelector('.stash__again').addEventListener('click', () => {
        // Play the hunt again. A place already won stays won, with the same code.
        state.found = [];
        delete state.dropped;
        if (!state.place) {
          delete state.code;
          delete state.at;
        }
        save();
        location.reload();
      });
    }
    const count = stash.querySelector('.stash__count');
    const text = stash.querySelector('.stash__text');
    const place = () => {
      const n = state.place;
      stash.classList.toggle('is-winner', Boolean(n && n <= PRIZES));
      if (n && n <= PRIZES) {
        count.textContent = `Prize winner #${n}`;
        text.textContent = `You're one of the first ${PRIZES} to find it, so you've won a prize! Show this at Sleigh the Run to collect it.`;
      } else if (n) {
        count.textContent = `${total} of ${total} presents`;
        text.textContent = `You're #${n} to find it. All ${PRIZES} prizes have gone, but show this at Sleigh the Run for bragging rights.`;
      } else {
        count.textContent = `${total} of ${total} presents`;
        text.textContent = 'Show this at Sleigh the Run.';
      }
    };
    place();
    if (!state.place) {
      text.textContent = `Checking if you're one of the first ${PRIZES}…`;
      claim().then(place);
    }
    stash.querySelector('.stash__code b').textContent = state.code;
    const when = new Date(state.at || Date.now());
    stash.querySelector('.stash__code small').textContent = `Found ${when.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${when.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
    stash.showModal();
    const card = stash.querySelector('.stash__card');
    const box = card.getBoundingClientRect();
    confetti(box.left + box.width / 2, box.top + 40, 40, 160);
    if (!reducedMotion) card.animate([{ transform: 'scale(.85) translateY(20px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.2)' });
  }

  /* HO HO HO: a sleigh pulled by runners instead of reindeer flies across the screen. */
  const runner = (x) => `<g class="sr" transform="translate(${x} 48)">
      <line class="sr__leg sr__leg--a" x1="-4" y1="22" x2="-4" y2="40"/><line class="sr__leg sr__leg--b" x1="-4" y1="22" x2="-4" y2="40"/>
      <path class="sr__body" d="M0 6 L-4 22"/>
      <line class="sr__arm sr__arm--a" x1="-1" y1="10" x2="-1" y2="22"/><line class="sr__arm sr__arm--b" x1="-1" y1="10" x2="-1" y2="22"/>
      <circle cx="1" cy="0" r="5.5" fill="#FFF4EC"/>
      <path d="M-5 -2 L7 -3 L-2 -14 Z" fill="#D62839"/><circle cx="-2" cy="-14" r="2.2" fill="#FFF4EC"/>
    </g>`;
  const SLEIGH = `<svg viewBox="0 0 420 120" aria-hidden="true">
      <path d="M174 66 Q206 76 238 70 L384 66" fill="none" stroke="#F5C452" stroke-width="1.6"/>
      ${[240, 288, 336, 384].map(runner).join('')}
      <path d="M30 54 H160 Q184 54 180 76 L174 92 H42 Q22 92 24 72 Z" fill="#C91F18"/>
      <path d="M30 54 H162" stroke="#F5C452" stroke-width="4" stroke-linecap="round"/>
      <path d="M60 92 V104 M140 92 V104" stroke="#F5C452" stroke-width="3"/>
      <path d="M16 104 H172 Q198 104 194 86" fill="none" stroke="#F5C452" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`;
  let flying = false;
  // drop: Santa's first flight, dropping the five presents as he goes.
  function fly(drop) {
    if (flying) return Promise.resolve();
    flying = true;
    const sleigh = document.createElement('div');
    sleigh.className = 'sleigh';
    sleigh.setAttribute('aria-hidden', 'true');
    sleigh.innerHTML = `<img class="sleigh__f" src="assets/xmas-logo-178.webp" alt="" width="178" height="224">${SLEIGH}<span class="sleigh__ho">HO HO HO!</span>`;
    document.body.append(sleigh);
    const { width: w, height: h } = sleigh.getBoundingClientRect();
    const done = () => { sleigh.remove(); flying = false; };
    if (reducedMotion) {
      sleigh.style.transform = `translate(${(innerWidth - w) / 2}px, ${innerHeight * 0.25}px)`;
      return sleigh.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 2600 }).finished.then(done);
    }
    const frames = [];
    const steps = 24;
    const top = innerHeight * 0.34;
    const rise = innerHeight * 0.2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -w - 40 + (innerWidth + w + 80) * t;
      const y = top - rise * t + Math.sin(t * Math.PI * 4) * 12 - h / 2;
      const tilt = -4 - Math.cos(t * Math.PI * 4) * 3;
      frames.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)` });
    }
    const flight = sleigh.animate(frames, { duration: 5200, easing: 'linear' });
    sleigh.querySelector('.sleigh__ho').animate([{ opacity: 0, transform: 'translateY(8px) scale(.8)' }, { opacity: 1, transform: 'none', offset: 0.15 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 5200, fill: 'forwards' });
    // A trail of gold dust falls behind it.
    const tones = ['#F5C452', '#FFF4EC', '#FFE29A'];
    const dust = setInterval(() => {
      const box = sleigh.getBoundingClientRect();
      const bit = document.createElement('i');
      bit.className = 'sleigh-dust';
      bit.style.cssText = `left:${box.left + box.width * 0.05}px;top:${box.top + box.height * 0.75}px;background:${tones[Math.floor(Math.random() * 3)]}`;
      document.body.append(bit);
      bit.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${-20 - Math.random() * 30}px, ${30 + Math.random() * 40}px) scale(.3)`, opacity: 0 }], { duration: 900, easing: 'ease-out' }).finished.then(() => bit.remove());
    }, 45);
    // The presents tumble out of the sleigh one by one and fall away down the page.
    if (drop) {
      SPOTS.forEach((spot, i) => setTimeout(() => {
        const box = sleigh.getBoundingClientRect();
        const present = document.createElement('div');
        present.className = 'gift-fall';
        present.innerHTML = giftSvg(COLORS[spot.color]);
        const x = box.left + box.width * 0.22;
        const y = box.top + box.height * 0.4;
        present.style.cssText = `left:${x}px;top:${y}px`;
        document.body.append(present);
        const drift = (i % 2 ? 1 : -1) * (30 + Math.random() * 70);
        const spin = (i % 2 ? 1 : -1) * (200 + Math.random() * 300);
        present.animate([
          { transform: 'translate(-50%, -50%) scale(.6) rotate(0deg)', opacity: 0 },
          { transform: `translate(calc(-50% + ${drift * 0.25}px), calc(-50% - 34px)) scale(1) rotate(${spin * 0.2}deg)`, opacity: 1, offset: 0.18, easing: 'cubic-bezier(.4,0,1,1)' },
          { transform: `translate(calc(-50% + ${drift}px), ${innerHeight - y + 60}px) scale(1) rotate(${spin}deg)`, opacity: 1 },
        ], { duration: 1500 + i * 60, easing: 'linear' }).finished.then(() => present.remove());
      }, 5200 * (0.24 + i * 0.12)));
    }
    return flight.finished.then(() => { clearInterval(dust); done(); });
  }
  // Laptops: type it anywhere (with or without spaces), except while filling in a form.
  let typed = '';
  addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (event.target.closest && event.target.closest('input, textarea, select, [contenteditable]')) return;
    if (!/^[a-z]$/i.test(event.key)) return;
    typed = (typed + event.key.toLowerCase()).slice(-6);
    if (typed === 'hohoho') {
      typed = '';
      fly();
    }
  });
  // Phones: tap the F in the top corner three times.
  let taps = [];
  document.querySelector('.nav__brand')?.addEventListener('click', (event) => {
    const now = performance.now();
    taps = taps.filter((t) => now - t < 900);
    taps.push(now);
    if (taps.length >= 3) {
      taps = [];
      event.preventDefault();
      fly();
    }
  });
}

/* ---------- ?admin: the team's screen for checking stash codes at Sleigh the Run ---------- */
// Everything is checked by Supabase with the team password; the website itself knows
// nothing about who won. See supabase/stash.sql (stash_admin).
function startAdmin() {
  const PASS_KEY = 'forged-stash-admin';
  const root = document.createElement('div');
  root.className = 'admin';
  root.innerHTML = `<div class="admin__in">
      <header class="admin__head">
        <img src="assets/xmas-logo-178.webp" alt="" width="178" height="224">
        <div><h1 class="admin__title">Santa&rsquo;s stash check</h1><p class="admin__sub">For the FORGED team at Sleigh the Run.</p></div>
      </header>
      <form class="admin__card" id="admin-lock">
        <label class="admin__label" for="admin-pass">Team password</label>
        <div class="admin__row">
          <input class="admin__input" id="admin-pass" type="password" autocomplete="current-password" required>
          <button class="admin__btn" type="submit">Unlock</button>
        </div>
        <p class="admin__error" id="admin-lock-error" role="alert" hidden></p>
      </form>
      <div id="admin-main" hidden>
        <form class="admin__card" id="admin-check">
          <label class="admin__label" for="admin-code">Code on their phone</label>
          <div class="admin__row">
            <span class="admin__prefix" aria-hidden="true">STASH-</span>
            <input class="admin__input admin__input--code" id="admin-code" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="14" placeholder="K7QM2X" required>
            <button class="admin__btn" type="submit">Check</button>
          </div>
        </form>
        <div class="admin__result" id="admin-result" role="status" hidden></div>
        <section class="admin__card">
          <div class="admin__list-head"><h2 class="admin__h2">The first 5</h2><button class="admin__link" id="admin-refresh" type="button">Refresh</button></div>
          <ol class="admin__list" id="admin-list"></ol>
        </section>
        <button class="admin__link" id="admin-out" type="button">Lock this screen</button>
      </div>
    </div>`;
  document.body.append(root);
  document.title = "Santa's stash check | FORGED";

  const $ = (id) => document.getElementById(id);
  let pass = '';
  try { pass = sessionStorage.getItem(PASS_KEY) || ''; } catch (e) { /* nothing remembered */ }
  const call = async (action, code) => {
    const response = await fetch(`${SUPABASE.url}/rest/v1/rpc/stash_admin`, {
      method: 'POST',
      headers: { apikey: SUPABASE.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pass, action, stash_code: code || null }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error((data && data.message) || `Error ${response.status}`);
    return data;
  };
  const when = (iso) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
  };
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function showList() {
    const list = $('admin-list');
    try {
      const rows = await call('list');
      list.innerHTML = rows.length
        ? rows.map((row) => `<li class="${row.collected_at ? 'is-given' : ''}"><b>#${row.place}</b><code>${esc(row.code)}</code><span>Found ${when(row.found_at)}</span><em>${row.collected_at ? `Prize given ${when(row.collected_at)}` : 'Not collected yet'}</em></li>`).join('')
        : '<li class="admin__empty">No one has found the stash yet.</li>';
    } catch (error) {
      list.innerHTML = `<li class="admin__empty">Couldn't load the list: ${esc(error.message)}</li>`;
    }
  }

  async function unlock(entered) {
    pass = entered;
    const error = $('admin-lock-error');
    error.hidden = true;
    try {
      await call('list');
      try { sessionStorage.setItem(PASS_KEY, pass); } catch (e) { /* fine */ }
      $('admin-lock').hidden = true;
      $('admin-main').hidden = false;
      showList();
      $('admin-code').focus();
    } catch (e) {
      error.textContent = e.message === 'not allowed' ? "That password isn't right." : `Couldn't reach Supabase: ${e.message}`;
      error.hidden = false;
      try { sessionStorage.removeItem(PASS_KEY); } catch (err) { /* fine */ }
    }
  }

  function render(result) {
    const box = $('admin-result');
    box.hidden = false;
    box.className = 'admin__result';
    if (!result.found) {
      box.classList.add('is-bad');
      box.innerHTML = `<p class="admin__verdict">Code not found</p><p><code>${esc(result.code)}</code> isn't on the list. Check the letters against their screen: codes never use I, L, O, 0 or 1.</p>`;
    } else if (!result.winner) {
      box.classList.add('is-no');
      box.innerHTML = `<p class="admin__verdict">Not a winner</p><p>They were #${result.place} to find the stash, on ${when(result.found_at)}. All 5 prizes went to quicker hunters, but they did find it!</p>`;
    } else if (result.collected_at) {
      box.classList.add('is-given');
      box.innerHTML = `<p class="admin__verdict">Already collected</p><p>Winner #${result.place}. The prize was given ${when(result.collected_at)}.</p>`;
    } else {
      box.classList.add('is-win');
      box.innerHTML = `<p class="admin__verdict">Winner #${result.place}</p><p>Found the stash ${when(result.found_at)}. Give them their prize!</p><button class="admin__btn admin__btn--give" type="button" id="admin-give">Mark prize as given</button>`;
      $('admin-give').addEventListener('click', async (event) => {
        event.currentTarget.disabled = true;
        try {
          render(await call('collect', result.code));
          showList();
        } catch (e) {
          event.currentTarget.disabled = false;
          box.insertAdjacentHTML('beforeend', `<p class="admin__error">Couldn't save that: ${esc(e.message)}</p>`);
        }
      });
    }
  }

  $('admin-lock').addEventListener('submit', (event) => {
    event.preventDefault();
    unlock($('admin-pass').value.trim());
  });
  $('admin-check').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = $('admin-code');
    const code = input.value.toUpperCase().replace(/\s/g, '').replace(/^STASH-?/, '');
    if (!code) return;
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    try {
      render(await call('check', `STASH-${code}`));
    } catch (e) {
      render({ found: false, code: `STASH-${code}` });
      $('admin-result').insertAdjacentHTML('beforeend', `<p class="admin__error">${esc(e.message)}</p>`);
    }
    button.disabled = false;
    input.select();
  });
  $('admin-code').addEventListener('input', (event) => { event.target.value = event.target.value.toUpperCase(); });
  $('admin-refresh').addEventListener('click', showList);
  $('admin-out').addEventListener('click', () => {
    try { sessionStorage.removeItem(PASS_KEY); } catch (e) { /* fine */ }
    location.reload();
  });
  if (pass) unlock(pass);
  else $('admin-pass').focus();
}

/* ---------- Christmas extras: a welcome card, days to Christmas, and Santa peeking in ---------- */
function startXmasExtras() {
  const WA = 'https://chat.whatsapp.com/GVBxCZZX6PT1FpaxrgBIuQ?mode=gi_t';
  const afterIntro = (fn) => (function wait() {
    if (document.getElementById('ice')) setTimeout(wait, 300);
    else fn();
  })();
  const busy = () => document.hidden || document.documentElement.classList.contains('has-lightbox') || document.querySelector('dialog[open]');

  /* A little burst of stars and snow, for Santa's present. */
  function burst(x, y) {
    if (reducedMotion) return;
    const tones = ['#F5C452', '#D62839', '#FFFFFF', '#4ADE80', '#60A5FA'];
    for (let i = 0; i < 22; i++) {
      const bit = document.createElement('i');
      bit.className = 'xmas-bit';
      bit.style.cssText = `left:${x}px;top:${y}px;background:${tones[i % tones.length]}`;
      document.body.append(bit);
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
      const reach = 40 + Math.random() * 70;
      bit.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * reach}px), calc(-50% + ${Math.sin(angle) * reach + 30}px)) rotate(${Math.random() * 400}deg) scale(.6)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => bit.remove());
    }
  }

  /* 1. Welcome card: once per visit, after the snow globe. */
  let seen = false;
  try { seen = sessionStorage.getItem('forged-welcome') === '1'; } catch (e) { /* show it */ }
  if (!seen) afterIntro(() => setTimeout(() => {
    try { sessionStorage.setItem('forged-welcome', '1'); } catch (e) { /* fine */ }
    const card = document.createElement('aside');
    card.className = 'welcome';
    card.setAttribute('aria-label', 'Merry Christmas from FORGED');
    card.innerHTML = `<img class="welcome__logo" src="assets/xmas-logo-178.webp" alt="" width="178" height="224">
      <div class="welcome__body">
        <p class="welcome__title">Merry Christmas from FORGED <span aria-hidden="true">🎄</span></p>
        <p class="welcome__text">${document.documentElement.classList.contains('is-revealed') ? 'The Recovery Run with YOS: Sun 20 Dec, 6:30 AM, Saligao. Then save 27 Dec for Panjim.' : 'Our 20 Dec Saligao run drops today at 2 PM. Then 27 Dec in Panjim.'}</p>
        <a class="welcome__btn" href="${WA}" target="_blank" rel="noopener">Hear it first</a>
      </div>
      <button class="welcome__close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <i class="welcome__timer" aria-hidden="true"></i>`;
    document.body.append(card);
    const timer = card.querySelector('.welcome__timer');
    const life = timer.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 9000, fill: 'forwards' });
    let gone = false;
    const close = () => {
      if (gone) return;
      gone = true;
      card.classList.add('is-leaving');
      setTimeout(() => card.remove(), 450);
    };
    life.finished.then(close);
    // Hovering or focusing holds it open.
    ['pointerenter', 'focusin'].forEach((type) => card.addEventListener(type, () => life.pause()));
    ['pointerleave', 'focusout'].forEach((type) => card.addEventListener(type, () => { if (!gone) life.play(); }));
    card.querySelector('.welcome__close').addEventListener('click', close);
    card.querySelector('.welcome__btn').addEventListener('click', () => setTimeout(close, 300));
    requestAnimationFrame(() => card.classList.add('is-in'));
  }, 1100));

  /* 2. Days to Christmas, on the next run's card, flipping like a desk calendar. */
  const jingle = document.getElementById('save-the-dates');
  if (jingle) {
    const today = new Date();
    const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.round((new Date(today.getFullYear(), 11, 25) - midnight) / 86400000);
    if (days >= 0) {
      const tag = document.createElement('p');
      tag.className = 'xmas-days';
      if (days === 0) {
        tag.innerHTML = '<span aria-hidden="true">🎄</span> Merry Christmas!';
      } else {
        tag.innerHTML = `<span aria-hidden="true">🎄</span> <span class="xmas-days__page"><b>${days}</b></span> ${days === 1 ? 'day' : 'days'} to Christmas`;
        tag.setAttribute('aria-label', `${days} ${days === 1 ? 'day' : 'days'} to Christmas`);
      }
      jingle.querySelector('.date__kicker').before(tag);
      const page = tag.querySelector('.xmas-days__page b');
      if (page && !reducedMotion) {
        // Yesterday's page is showing; when the card comes into view, it flips over to today.
        page.textContent = String(days + 1);
        new IntersectionObserver((entries, watcher) => {
          if (!entries[0].isIntersecting) return;
          watcher.disconnect();
          setTimeout(() => {
            page.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(-90deg)' }], { duration: 260, easing: 'ease-in' }).finished.then(() => {
              page.textContent = String(days);
              page.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0)' }], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
            });
          }, 500);
        }, { threshold: 0.6 }).observe(tag);
      }
    }
  }

  /* 3. Santa peeks in from the side of the screen now and then. Tap him for a present. */
  if (reducedMotion) return;
  const santa = document.createElement('button');
  santa.type = 'button';
  santa.className = 'santa-peek';
  santa.setAttribute('aria-label', 'Santa is peeking in. Tap him for a present.');
  santa.innerHTML = `<svg viewBox="0 0 130 150" aria-hidden="true">
      <g class="santa-peek__arm"><path d="M34 112 L12 96" stroke="#D62839" stroke-width="13" stroke-linecap="round"/><circle cx="10" cy="93" r="10" fill="#FFFFFF"/><path d="M28 112 L40 104" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/></g>
      <path d="M30 150 Q34 118 64 114 Q96 118 100 150 Z" fill="#D62839"/>
      <path d="M58 114 L58 150 M70 114 L70 150" stroke="#FFFFFF" stroke-width="6"/>
      <circle cx="64" cy="80" r="30" fill="#F6C7A8"/>
      <path d="M33 84 Q30 112 46 126 Q56 140 64 141 Q72 140 82 126 Q98 112 95 84 Q88 104 64 104 Q40 104 33 84 Z" fill="#FFFFFF"/>
      <ellipse cx="54" cy="76" rx="3.2" ry="4" fill="#2A1A14"/><ellipse cx="74" cy="76" rx="3.2" ry="4" fill="#2A1A14"/>
      <circle cx="44" cy="88" r="6" fill="#F29A9A" opacity=".75"/><circle cx="84" cy="88" r="6" fill="#F29A9A" opacity=".75"/>
      <path d="M48 98 Q56 92 64 97 Q72 92 80 98 Q72 104 64 100 Q56 104 48 98 Z" fill="#F4F1EE"/>
      <circle cx="64" cy="90" r="6" fill="#E8836F"/>
      <path d="M30 58 Q44 6 104 14 Q86 26 98 60 Z" fill="#D62839"/>
      <circle cx="106" cy="15" r="10" fill="#FFFFFF"/>
      <rect x="26" y="52" width="78" height="15" rx="7.5" fill="#FFFFFF"/>
    </svg>
    <span class="santa-peek__ho" aria-hidden="true">Ho ho ho!</span>`;
  document.body.append(santa);
  let shows = 0;
  let side = 'right';
  let out = false;
  let gave = false;
  function peek() {
    if (shows >= 8) return;
    if (busy()) { setTimeout(peek, 8000); return; }
    shows += 1;
    side = side === 'right' ? 'left' : 'right';
    gave = false;
    santa.classList.toggle('is-left', side === 'left');
    santa.style.top = `${Math.round(innerHeight * (0.28 + Math.random() * 0.38))}px`;
    santa.classList.add('is-out');
    out = true;
    setTimeout(() => santa.classList.add('is-waving'), 650);
    setTimeout(hide, 4600);
  }
  function hide() {
    santa.classList.remove('is-out', 'is-waving', 'is-ho');
    out = false;
    setTimeout(peek, 30000 + Math.random() * 25000);
  }
  santa.addEventListener('click', () => {
    if (!out || gave) return;
    gave = true;
    santa.classList.add('is-ho');
    // He tosses a present, which bursts into confetti where it lands.
    const box = santa.getBoundingClientRect();
    const fromX = side === 'right' ? box.left + 10 : box.right - 10;
    const fromY = box.top + box.height * 0.6;
    const gift = document.createElement('i');
    gift.className = 'santa-gift';
    gift.style.cssText = `left:${fromX}px;top:${fromY}px`;
    gift.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="19" width="28" height="18" rx="1.5" fill="#1E8A4C"/><rect x="18" y="19" width="4" height="18" fill="#F5C452"/><rect x="4" y="12" width="32" height="8" rx="1.5" fill="#1E8A4C"/><rect x="18" y="12" width="4" height="8" fill="#F5C452"/><path d="M20 12c-3-7-11-8-11-3 0 3 6 4 11 3zm0 0c3-7 11-8 11-3 0 3-6 4-11 3z" fill="#F5C452"/></svg>';
    document.body.append(gift);
    const dx = (side === 'right' ? -1 : 1) * (70 + Math.random() * 60);
    gift.animate([
      { transform: 'translate(-50%, -50%) rotate(0deg) scale(.7)' },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% - 60px)) rotate(${dx * 1.5}deg) scale(1)`, offset: 0.4, easing: 'cubic-bezier(.4,0,1,1)' },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + 40px)) rotate(${dx * 3}deg) scale(1)` },
    ], { duration: 800, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }).finished.then(() => {
      const at = gift.getBoundingClientRect();
      gift.remove();
      burst(at.left + at.width / 2, at.top + at.height / 2);
    });
  });
  afterIntro(() => setTimeout(peek, 12000));
}


/* ---------- Save the dates: how long to go on each ticket, and a landing when they show ---------- */
(function startTickets() {
  const tickets = document.querySelector('.tickets');
  if (!tickets) return;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  tickets.querySelectorAll('[data-days-to]').forEach((when) => {
    const days = Math.round((new Date(`${when.dataset.daysTo}T00:00:00`) - today) / 86400000);
    when.textContent = days > 1 ? `In ${days} days` : days === 1 ? 'Tomorrow!' : days === 0 ? 'Today!' : 'Done';
  });
  new IntersectionObserver((entries, watcher) => {
    if (!entries[0].isIntersecting) return;
    watcher.disconnect();
    tickets.classList.add('is-in');
  }, { threshold: 0.35 }).observe(tickets);

  const cards = [...tickets.querySelectorAll('.ticket')];
  const tilt = (card, x, y) => {
    // x and y run 0 to 1 across the ticket.
    card.classList.add('is-tilting');
    card.style.setProperty('--rx', `${((0.5 - y) * 16).toFixed(1)}deg`);
    card.style.setProperty('--ry', `${((x - 0.5) * 20).toFixed(1)}deg`);
    card.style.setProperty('--fx', `${(x * 100).toFixed(0)}%`);
    card.style.setProperty('--fy', `${(y * 100).toFixed(0)}%`);
  };
  const settle = (card) => {
    card.classList.remove('is-tilting');
    ['--rx', '--ry', '--fx', '--fy'].forEach((name) => card.style.removeProperty(name));
  };
  if (!reducedMotion) {
    // A mouse tilts the ticket under it, like holding it up to the light.
    cards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        const box = card.getBoundingClientRect();
        tilt(card, (event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
      });
      card.addEventListener('pointerleave', () => settle(card));
    });
    // Phones that share their tilt without asking (Android) tilt both tickets.
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function' && matchMedia('(hover: none)').matches) {
      let visible = false;
      let queued = false;
      let last = null;
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) cards.forEach(settle);
      }).observe(tickets);
      addEventListener('deviceorientation', (event) => {
        if (!visible || event.gamma === null) return;
        last = event;
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          const x = Math.max(0, Math.min(1, 0.5 + last.gamma / 50));
          const y = Math.max(0, Math.min(1, 0.5 + (last.beta - 45) / 50));
          cards.forEach((card) => tilt(card, x, y));
        });
      });
    }
  }

  // Tear off the stub: it flutters away, and the date goes into your calendar.
  const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  const tornKey = (card) => `forged-torn-${card.dataset.date}`;
  cards.forEach((card) => {
    const stub = card.querySelector('.ticket__stub');
    const when = card.querySelector('.ticket__when');
    let torn = false;
    try { torn = localStorage.getItem(tornKey(card)) === '1'; } catch (e) { /* fine */ }
    const mark = () => {
      card.classList.add('is-torn');
      if (when && !when.dataset.saved) {
        when.dataset.saved = '1';
        when.textContent = `\u2713 In your calendar \u00B7 ${when.textContent}`;
      }
    };
    if (torn) mark();
    stub.addEventListener('click', () => {
      // Apple devices take the calendar file; everyone else gets Google Calendar.
      if (apple) location.href = card.dataset.ics;
      else window.open(card.dataset.gcal, '_blank', 'noopener');
      try { localStorage.setItem(tornKey(card), '1'); } catch (e) { /* fine */ }
      if (!reducedMotion) {
        const box = stub.getBoundingClientRect();
        const fly = document.createElement('div');
        fly.className = 'ticket-stub-fly';
        fly.innerHTML = stub.innerHTML;
        fly.style.cssText = `transform-origin:0 0;left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;background:${getComputedStyle(card).backgroundColor};color:${getComputedStyle(card).color}`;
        document.body.append(fly);
        // A tug, a rip from the top down, then it tumbles away.
        card.animate([{ transform: getComputedStyle(card).transform }, { transform: `${getComputedStyle(card).transform} translateX(-5px)` }, { transform: getComputedStyle(card).transform }], { duration: 220, easing: 'ease-out' });
        fly.animate([
          { transform: 'none', opacity: 1 },
          { transform: 'translate(3px, 0) rotate(4deg)', opacity: 1, offset: 0.12 },
          { transform: 'translate(14px, 6px) rotate(22deg)', opacity: 1, offset: 0.3 },
          { transform: `translate(${70 + Math.random() * 50}px, ${innerHeight * 0.35}px) rotate(${200 + Math.random() * 160}deg) scale(.9)`, opacity: 1, offset: 0.8 },
          { transform: `translate(${90 + Math.random() * 50}px, ${innerHeight * 0.5}px) rotate(${300 + Math.random() * 160}deg) scale(.85)`, opacity: 0 },
        ], { duration: 1300, easing: 'cubic-bezier(.3,0,.7,1)' }).finished.then(() => fly.remove());
        // Paper bits spray from the tear line.
        for (let i = 0; i < 12; i++) {
          const bit = document.createElement('i');
          bit.className = 'ticket-bit';
          bit.style.cssText = `left:${box.left}px;top:${box.top + Math.random() * box.height}px;background:${getComputedStyle(card).backgroundColor}`;
          document.body.append(bit);
          bit.animate([
            { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
            { transform: `translate(${(Math.random() - 0.3) * 60}px, ${30 + Math.random() * 90}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
          ], { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.2,.6,.4,1)' }).finished.then(() => bit.remove());
        }
      }
      mark();
    });
  });
})();


/* ---------- The Recovery Run: a countdown until 2 PM on 28 Nov (India time), then the reveal ---------- */
(function startRecoveryReveal() {
  const card = document.getElementById('recovery-run');
  if (!card) return;
  const root = document.documentElement;
  // ?reveal=soon previews the reveal: it happens 22 seconds after the page loads.
  const preview = /[?&]reveal=soon(?:&|$)/.test(location.search);
  const at = preview ? Date.now() + 22000 : Date.parse('2026-11-28T14:00:00+05:30');
  if (preview) root.classList.remove('is-revealed');
  const nextRun = document.getElementById('next-run');
  const ticket = document.querySelector('.ticket--1');
  const soonPop = document.querySelector('#route-soon .route__pop b');
  const soonSmall = document.querySelector('#route-soon .route__pop small');
  const finalLine = nextRun.textContent;

  // Everything that says "Saligao, 20 Dec" picks up the real details once it's revealed.
  function dressUp() {
    nextRun.textContent = finalLine;
    if (soonPop) soonPop.textContent = 'The Recovery Run';
    if (soonSmall) soonSmall.textContent = '20 Dec, 6:30 AM, YOS Saligao';
    if (ticket) {
      ticket.querySelector('.ticket__run').textContent = 'The Recovery Run';
      ticket.querySelector('.ticket__date span').textContent = 'Dec \u00B7 Sun \u00B7 6:30 AM';
      ticket.dataset.ics = 'assets/recovery-run.ics';
      ticket.dataset.gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=The%20Recovery%20Run%20%C2%B7%20FORGED%20%C3%97%20YOS&dates=20261220T010000Z/20261220T040000Z&location=YOS%20Stays%20%26%20Atelier%2C%20Saligao%2C%20Goa&details=Come%20run%2C%20recharge%20and%20reconnect.%20Free%20to%20join%2C%20limited%20spots.%20Registrations%20in%20the%20FORGED%20WhatsApp%20group.';
      ticket.querySelector('.ticket__stub').setAttribute('aria-label', 'Tear off the stub to save The Recovery Run, Sunday 20 December at 6:30 AM, to your calendar');
    }
  }
  if (root.classList.contains('is-revealed')) {
    dressUp();
    return;
  }
  nextRun.textContent = 'Our 20 Dec Saligao run announcement drops today at 2 PM \u{1F440}';

  const count = card.querySelector('[data-reveal-count]');
  const pad = (n) => String(n).padStart(2, '0');
  let timer = 0;
  function tick() {
    const left = Math.max(0, Math.ceil((at - Date.now()) / 1000));
    // The last ten seconds: the clock becomes one big number and the card starts to shake.
    if (left <= 10 && left > 0) {
      card.classList.add('is-final');
      card.style.setProperty('--shake', `${((11 - left) * 0.35).toFixed(2)}px`);
      count.textContent = String(left);
      if (!reducedMotion) count.animate([{ transform: 'scale(1.6)', opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
    } else {
      // Three tiles: hours, minutes and seconds.
      if (!count.querySelector('.rc-tile')) {
        count.innerHTML = ['hrs', 'min', 'sec'].map((unit, i) => `${i ? '<span class="rc-colon">:</span>' : ''}<span class="rc-tile"><b>00</b><small>${unit}</small></span>`).join('');
        count.setAttribute('aria-label', 'Time until the reveal');
      }
      const values = [Math.floor(left / 3600), Math.floor(left / 60) % 60, left % 60];
      count.querySelectorAll('.rc-tile b').forEach((b, i) => {
        const text = pad(values[i]);
        if (b.textContent === text) return;
        b.textContent = text;
        if (!reducedMotion && i === 2) b.animate([{ transform: 'translateY(-30%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'ease-out' });
      });
    }
    if (left === 0) {
      clearInterval(timer);
      reveal();
    }
  }
  // Confetti cannons from both sides of the screen, plus a burst from the card.
  function burst() {
    if (reducedMotion) return;
    const box = card.getBoundingClientRect();
    const tones = ['#F5C452', '#F7E9E1', '#FFFFFF', '#E8A87C', '#D62839', '#3FC52B'];
    const shoot = (x, y, dirX, count) => {
      for (let i = 0; i < count; i++) {
        const bit = document.createElement('i');
        bit.className = 'rec-bit';
        if (i % 3 === 0) bit.style.borderRadius = '50%';
        bit.style.cssText += `;left:${x}px;top:${y}px;background:${tones[i % tones.length]};width:${6 + Math.random() * 6}px;height:${4 + Math.random() * 8}px`;
        document.body.append(bit);
        const vx = dirX ? dirX * (180 + Math.random() * innerWidth * 0.45) : (Math.random() - 0.5) * 500;
        const vy = -(innerHeight * (0.35 + Math.random() * 0.4));
        bit.animate([
          { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
          { transform: `translate(${vx * 0.7}px, ${vy}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${vx}px, ${vy * 0.2 + innerHeight * 0.5}px) rotate(${Math.random() * 1080}deg)`, opacity: 0 },
        ], { duration: 2200 + Math.random() * 1200, easing: 'cubic-bezier(.15,.6,.4,1)' }).finished.then(() => bit.remove());
      }
    };
    shoot(10, innerHeight - 10, 1, 70);
    shoot(innerWidth - 10, innerHeight - 10, -1, 70);
    shoot(box.left + box.width / 2, Math.max(60, box.top + 80), 0, 50);
  }
  // The frosted poster shatters into pieces that fly out from the middle.
  function shatter() {
    const frost = card.querySelector('.recovery__frost');
    const box = frost.getBoundingClientRect();
    const src = frost.querySelector('img').currentSrc;
    const cols = 4;
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const shard = document.createElement('i');
        shard.className = 'rec-shard';
        const w = box.width / cols;
        const h = box.height / rows;
        shard.style.cssText = `left:${box.left + c * w}px;top:${box.top + r * h}px;width:${w + 1}px;height:${h + 1}px;background-image:url("${src}");background-size:${box.width}px ${box.height}px;background-position:${-c * w}px ${-r * h}px`;
        document.body.append(shard);
        const dx = (c - (cols - 1) / 2) * (60 + Math.random() * 90);
        const dy = (r - (rows - 1) / 2) * (50 + Math.random() * 80) + 120;
        shard.animate([
          { transform: 'none', opacity: 1 },
          { transform: `translate(${dx * 0.4}px, ${dy * 0.2 - 40}px) rotate(${(Math.random() - 0.5) * 40}deg)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${dx}px, ${dy + 260}px) rotate(${(Math.random() - 0.5) * 220}deg) scale(.7)`, opacity: 0 },
        ], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.3,.1,.7,1)' }).finished.then(() => shard.remove());
      }
    }
    frost.style.visibility = 'hidden';
  }
  function reveal() {
    if (reducedMotion) {
      root.classList.add('is-revealed');
      dressUp();
      return;
    }
    card.classList.remove('is-final');
    card.classList.add('is-revealing');
    // The lock bursts off; then a flash, the glass breaks, and the card builds itself in.
    setTimeout(() => {
      const flash = document.createElement('i');
      flash.className = 'rec-flash';
      document.body.append(flash);
      flash.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' }).finished.then(() => flash.remove());
      shatter();
      setTimeout(() => {
        card.classList.remove('is-revealing');
        card.classList.add('just-revealed');
        root.classList.add('is-revealed');
        dressUp();
        burst();
      }, 380);
    }, 900);
  }
  tick();
  timer = setInterval(tick, 1000);
})();


/* ---------- The Recovery Run: countdown to registrations opening (10 Dec, 12 PM, India time) ---------- */
(function startRegCountdown() {
  const out = document.querySelector('[data-reg-count]');
  if (!out) return;
  const opens = Date.parse('2026-12-10T12:00:00+05:30');
  const box = out.closest('.recovery__reg');
  function tick() {
    const left = opens - Date.now();
    if (left <= 0) {
      box.classList.add('is-open');
      box.querySelector('.recovery__reg-label').textContent = 'Registrations are open!';
      out.textContent = 'Grab your spot in the WhatsApp group before they fill up.';
      return;
    }
    const mins = Math.floor(left / 60000);
    const d = Math.floor(mins / 1440);
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    out.textContent = d > 0 ? `In ${d} day${d === 1 ? '' : 's'}, ${h} hr${h === 1 ? '' : 's'}` : `In ${h} hr${h === 1 ? '' : 's'}, ${m} min`;
    setTimeout(tick, 30000);
  }
  tick();
})();
