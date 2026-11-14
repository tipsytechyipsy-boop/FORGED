/* The FORGED medal: a real 3D medal in the finish section.
   It drops in hot, cools to steel, and heats up again if you spin it hard.
   Loaded by main.js only when the finish section is close to the screen. */
import * as THREE from './assets/vendor/three.module.min.js';

export function startMedal(figure, { reducedMotion = false } = {}) {
  const canvas = figure.querySelector('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (error) {
    return false; // No WebGL: the medal just isn't shown.
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 4.6);

  // Reflections come from a little forge built out of glowing panels:
  // a white skylight, the orange mouth of the furnace, and a cool fill.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x1a1210, side: THREE.BackSide })));
  const panel = (w, h, color, x, y, z, ry = 0, rx = 0) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, 0);
    room.add(mesh);
  };
  panel(8, 2.4, new THREE.Color(6, 6, 5.6), 0, 5.5, 0, 0, Math.PI / 2);
  panel(4, 5, new THREE.Color(9, 2.6, 0.5), -5.8, -0.5, 1, Math.PI / 2);
  panel(3, 4, new THREE.Color(2.4, 2.6, 3.2), 5.8, 1, -1, -Math.PI / 2);
  panel(5, 1.2, new THREE.Color(5, 3.2, 1.4), 0, -1.5, 5.8, Math.PI);
  scene.environment = pmrem.fromScene(room, 0.03).texture;

  const key = new THREE.DirectionalLight(0xfff1dd, 1.6);
  key.position.set(2, 3, 4);
  scene.add(key);

  // The medal's edge: a lathe profile with a raised, rounded rim.
  const R = 1;
  const profile = [
    [0, 0.055], [0.84, 0.055], [0.86, 0.075], [0.9, 0.095], [0.96, 0.095], [0.995, 0.07], [1, 0.03],
    [1, -0.03], [0.995, -0.07], [0.96, -0.095], [0.9, -0.095], [0.86, -0.075], [0.84, -0.055], [0, -0.055],
  ].map(([x, y]) => new THREE.Vector2(x * R, y * R));
  const bodyGeometry = new THREE.LatheGeometry(profile, 96);
  bodyGeometry.rotateX(Math.PI / 2);
  const steel = new THREE.MeshStandardMaterial({
    color: 0xd8d2ca, metalness: 1, roughness: 0.24, emissive: 0xff5a10, emissiveIntensity: 0,
  });
  const medal = new THREE.Group();
  medal.add(new THREE.Mesh(bodyGeometry, steel));

  // Each face is drawn on a canvas: polished raised letters on dark, worked iron.
  const art = new Image();
  art.src = 'assets/wordmark.svg';

  function face(ringText, middle) {
    const S = 1024;
    const make = () => {
      const c = document.createElement('canvas');
      c.width = c.height = S;
      return c;
    };
    const relief = make(); // white = raised
    const r = relief.getContext('2d');
    r.fillStyle = '#000';
    r.fillRect(0, 0, S, S);
    r.translate(S / 2, S / 2);
    r.fillStyle = '#fff';
    r.strokeStyle = '#fff';
    // Two thin rings frame the lettering.
    r.lineWidth = 10;
    [0.94, 0.7].forEach((k) => { r.beginPath(); r.arc(0, 0, (S / 2) * k, 0, Math.PI * 2); r.stroke(); });
    // Lettering round the ring.
    r.font = `800 ${S * 0.058}px Anybody, "Arial Black", sans-serif`;
    r.textAlign = 'center';
    r.textBaseline = 'middle';
    const radius = (S / 2) * 0.82;
    const letters = [...ringText];
    letters.forEach((ch, i) => {
      r.save();
      r.rotate((i / letters.length) * Math.PI * 2);
      r.fillText(ch, 0, -radius);
      r.restore();
    });
    middle(r, S);
    r.setTransform(1, 0, 0, 1, 0, 0);

    // Colour: bright steel where it's raised, dark iron in the hollows.
    const color = make();
    const c = color.getContext('2d');
    const iron = c.createRadialGradient(S * 0.4, S * 0.35, 0, S / 2, S / 2, S * 0.6);
    iron.addColorStop(0, '#8d8580');
    iron.addColorStop(1, '#4a423e');
    c.fillStyle = iron;
    c.fillRect(0, 0, S, S);
    // Hammer marks in the hollows.
    for (let i = 0; i < 900; i++) {
      c.fillStyle = `rgba(${Math.random() < 0.5 ? '255,240,225' : '0,0,0'},${(Math.random() * 0.07).toFixed(3)})`;
      c.beginPath();
      c.arc(Math.random() * S, Math.random() * S, 6 + Math.random() * 22, 0, Math.PI * 2);
      c.fill();
    }
    c.globalCompositeOperation = 'screen';
    c.drawImage(relief, 0, 0);
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = '#f2ece4';
    c.fillRect(0, 0, S, S);

    // Heat glows in the hollows first, like a groove full of molten metal.
    const glow = make();
    const g = glow.getContext('2d');
    g.fillStyle = '#ff7a1e';
    g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(relief, 0, 0);
    g.globalCompositeOperation = 'destination-over';
    g.fillStyle = '#000';
    g.fillRect(0, 0, S, S);

    const texture = (source, srgb) => {
      const t = new THREE.CanvasTexture(source);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    };
    const roughness = make();
    const rr = roughness.getContext('2d');
    // Raised letters are polished smooth, the hollows stay rough.
    rr.fillStyle = '#a8a8a8';
    rr.fillRect(0, 0, S, S);
    rr.globalCompositeOperation = 'difference';
    rr.drawImage(relief, 0, 0);
    return new THREE.MeshStandardMaterial({
      map: texture(color, true),
      bumpMap: texture(relief, false),
      bumpScale: 3,
      roughnessMap: texture(roughness, false),
      roughness: 1,
      metalness: 1,
      emissive: 0xffffff,
      emissiveMap: texture(glow, true),
      emissiveIntensity: 0,
    });
  }

  const drawF = (r, S) => {
    // The F from the wordmark, as big as the inner ring allows.
    if (art.complete && art.naturalWidth) {
      // Draw the whole word, then find where the F ends: the first empty column.
      const word = document.createElement('canvas');
      word.height = 300;
      word.width = Math.round(300 * (3847 / 622));
      const wc = word.getContext('2d', { willReadFrequently: true });
      wc.drawImage(art, 0, 0, word.width, word.height);
      const alpha = wc.getImageData(0, 0, word.width, word.height).data;
      const filled = (x) => {
        for (let y = 0; y < word.height; y += 2) if (alpha[(y * word.width + x) * 4 + 3] > 40) return true;
        return false;
      };
      let end = 0;
      while (end < word.width && !filled(end)) end++;
      while (end < word.width && filled(end)) end++;
      const h = S * 0.46;
      const w = h * (end / word.height);
      const off = document.createElement('canvas');
      off.width = Math.round(w);
      off.height = Math.round(h);
      const o = off.getContext('2d');
      o.drawImage(word, 0, 0, end, word.height, 0, 0, w, h);
      o.globalCompositeOperation = 'source-in';
      o.fillStyle = '#fff';
      o.fillRect(0, 0, w, h);
      r.drawImage(off, -w / 2, -h / 2 - S * 0.015);
    } else {
      r.font = `900 ${S * 0.42}px Anybody, "Arial Black", sans-serif`;
      r.fillText('F', 0, 0);
    }
  };
  const drawBack = (r, S) => {
    r.font = `900 ${S * 0.1}px Anybody, "Arial Black", sans-serif`;
    r.fillText('MILES', 0, -S * 0.12);
    r.fillText('PEOPLE', 0, 0);
    r.font = `800 ${S * 0.062}px Anybody, "Arial Black", sans-serif`;
    r.fillText('EXPERIENCES', 0, S * 0.11);
  };

  const faceGeometry = new THREE.CircleGeometry(0.842 * R, 96);
  let front;
  let back;
  function buildFaces() {
    [front, back].forEach((mesh) => { if (mesh) { medal.remove(mesh); mesh.material.dispose(); } });
    front = new THREE.Mesh(faceGeometry, face('FORGED RUN CLUB  ·  GOA  ·  EST 2026  ·  ', drawF));
    front.position.z = 0.0565 * R;
    back = new THREE.Mesh(faceGeometry, face('RUNNING GOA DIFFERENTLY  ·  FORGED  ·  ', drawBack));
    back.position.z = -0.0565 * R;
    back.rotation.y = Math.PI;
    medal.add(front, back);
  }
  buildFaces();
  // Redraw once the logo and fonts have arrived.
  Promise.all([art.decode().catch(() => {}), document.fonts ? document.fonts.ready : null]).then(buildFaces);

  medal.rotation.x = -0.12;
  scene.add(medal);

  // Sparks thrown off the rim when it's spinning hot.
  const SPARKS = 90;
  const sparkPositions = new Float32Array(SPARKS * 3);
  const sparkLife = new Float32Array(SPARKS);
  const sparkVelocity = Array.from({ length: SPARKS }, () => new THREE.Vector3());
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparks = new THREE.Points(sparkGeometry, new THREE.PointsMaterial({
    color: 0xffb347, size: 0.075, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(sparks);
  let nextSpark = 0;
  function throwSpark() {
    const i = nextSpark;
    nextSpark = (nextSpark + 1) % SPARKS;
    const angle = Math.random() * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(angle) * R, Math.sin(angle) * R, 0).applyEuler(medal.rotation).add(medal.position);
    sparkPositions.set([p.x, p.y, p.z], i * 3);
    sparkVelocity[i].set((Math.random() - 0.5) * 3, Math.random() * 2.2 + 0.4, (Math.random() - 0.5) * 3);
    sparkLife[i] = 0.4 + Math.random() * 0.5;
  }

  // Size
  function fit() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(fit).observe(canvas);
  fit();

  // Spin: idle drift, drag to throw it, and it keeps going with some drag.
  const IDLE = reducedMotion ? 0 : 0.55;
  let spin = reducedMotion ? 0 : 9; // drops in spinning
  let heat = reducedMotion ? 0 : 1; // and glowing
  let tilt = -0.12;
  let dragging = null;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = { x: event.clientX, y: event.clientY, t: performance.now() };
    canvas.setPointerCapture(event.pointerId);
    figure.classList.add('is-touched');
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = event.clientX - dragging.x;
    const dy = event.clientY - dragging.y;
    const dt = Math.max(8, now - dragging.t) / 1000;
    medal.rotation.y += dx * 0.012;
    tilt = Math.max(-0.6, Math.min(0.6, tilt + dy * 0.006));
    spin = (dx * 0.012) / dt;
    dragging = { x: event.clientX, y: event.clientY, t: now };
    wake();
  });
  const release = () => { dragging = null; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // Only draw while it's on screen.
  const onScreen = () => {
    const box = figure.getBoundingClientRect();
    return box.bottom > 0 && box.top < innerHeight && box.width > 0;
  };
  addEventListener('scroll', () => { if (onScreen()) wake(); }, { passive: true });

  let running = false;
  let last = 0;
  const clock = { t: 0 };
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock.t += dt;

    if (!dragging) {
      // Ease back toward the idle drift.
      spin += (IDLE - spin) * Math.min(1, dt * 0.9);
      medal.rotation.y += spin * dt;
      tilt += (-0.12 - tilt) * Math.min(1, dt * 2);
    }
    medal.rotation.x = tilt + (reducedMotion ? 0 : Math.sin(clock.t * 1.3) * 0.05);
    medal.position.y = reducedMotion ? 0 : Math.sin(clock.t * 1.1) * 0.06;

    // Fast spinning heats the metal; it cools on its own.
    const speed = Math.abs(spin);
    heat = Math.min(1.15, Math.max(0, heat + (speed > 5 ? (speed - 5) * 0.05 * dt * 6 : 0) - dt * 0.28));
    const glow = Math.min(1, heat);
    steel.emissiveIntensity = glow * glow * 0.55;
    steel.color.setRGB(0.85 + 0.15 * glow, 0.82 - 0.2 * glow, 0.79 - 0.4 * glow);
    [front, back].forEach((mesh) => { mesh.material.emissiveIntensity = glow * 2.4; });
    figure.style.setProperty('--heat', glow.toFixed(3));

    if (!reducedMotion && heat > 0.35 && Math.random() < heat * 0.9) throwSpark();
    for (let i = 0; i < SPARKS; i++) {
      if (sparkLife[i] <= 0) { sparkPositions[i * 3 + 1] = 99; continue; }
      sparkLife[i] -= dt;
      sparkVelocity[i].y -= 6 * dt;
      sparkPositions[i * 3] += sparkVelocity[i].x * dt;
      sparkPositions[i * 3 + 1] += sparkVelocity[i].y * dt;
      sparkPositions[i * 3 + 2] += sparkVelocity[i].z * dt;
    }
    sparkGeometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    const settled = reducedMotion && !dragging && heat === 0;
    if (onScreen() && !settled) requestAnimationFrame(frame);
    else running = false;
  }
  function wake() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  wake();
  return true;
}
