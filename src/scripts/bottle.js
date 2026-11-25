import * as THREE from 'three';

/**
 * Botella de aceite de oliva construida con geometría procedural.
 * Sin modelos externos: pesa poco y se adapta a cualquier pantalla.
 */
export function initBottle(canvas) {
  const stage = canvas.parentElement;
  if (!stage) return;

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    canvas.style.display = 'none';
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);

  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.1, 7.4);
  camera.lookAt(0, 0.05, 0);

  /* ---------- Entorno (reflejos suaves, sin HDR externo) ---------- */

  const envCanvas = document.createElement('canvas');
  envCanvas.width = 64;
  envCanvas.height = 32;
  const envCtx = envCanvas.getContext('2d');
  const envGradient = envCtx.createLinearGradient(0, 0, 0, 32);
  envGradient.addColorStop(0, '#e6d3a8');
  envGradient.addColorStop(0.45, '#5f5f3c');
  envGradient.addColorStop(1, '#0a0c07');
  envCtx.fillStyle = envGradient;
  envCtx.fillRect(0, 0, 64, 32);

  const envTexture = new THREE.CanvasTexture(envCanvas);
  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  envTexture.colorSpace = THREE.SRGBColorSpace;
  scene.environment = envTexture;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.6;

  /* ---------- Luces ---------- */

  scene.add(new THREE.HemisphereLight(0xfff1d4, 0x1a2210, 0.65));

  const key = new THREE.DirectionalLight(0xfff2d4, 2.8);
  key.position.set(3.6, 5.2, 4.2);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xb7c980, 1.9);
  rim.position.set(-4.2, 2.4, -2.8);
  scene.add(rim);

  const fill = new THREE.PointLight(0xffc978, 9, 12);
  fill.position.set(-2.4, 0.4, 3.2);
  scene.add(fill);

  /* ---------- Botella ---------- */

  const world = new THREE.Group();
  world.scale.setScalar(1.08);
  world.position.y = -1.28;
  scene.add(world);

  const bottle = new THREE.Group();
  world.add(bottle);

  const profile = [
    [0, 0],
    [0.46, 0],
    [0.54, 0.03],
    [0.56, 0.1],
    [0.56, 1.4],
    [0.545, 1.48],
    [0.47, 1.6],
    [0.35, 1.74],
    [0.25, 1.88],
    [0.215, 2.0],
    [0.215, 2.16],
    [0.25, 2.18],
    [0.25, 2.26],
    [0, 2.26],
  ].map(([x, y]) => new THREE.Vector2(x, y));

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x33421d,
    metalness: 0.06,
    roughness: 0.32,
    clearcoat: 0.75,
    clearcoatRoughness: 0.24,
    envMapIntensity: 0.7,
  });

  const glass = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), glassMaterial);
  bottle.add(glass);

  // Base levemente más oscura, para que apoye.
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.535, 0.535, 0.06, 96),
    new THREE.MeshStandardMaterial({ color: 0x1d2711, roughness: 0.55 })
  );
  base.position.y = 0.03;
  bottle.add(base);

  /* ---------- Etiqueta ---------- */

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 2048;
  labelCanvas.height = 640;
  const ctx = labelCanvas.getContext('2d');

  const paper = ctx.createLinearGradient(0, 0, 0, 640);
  paper.addColorStop(0, '#f7f1e1');
  paper.addColorStop(1, '#e6dcc2');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 2048, 640);

  ctx.strokeStyle = '#b9a06a';
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 42, 1936, 556);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#77683a';
  ctx.font = '500 19px Inter, Arial, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
  ctx.fillText('ACEITE DE OLIVA EXTRA VIRGEN', 1024, 132);

  ctx.fillStyle = '#1b2112';
  ctx.font = '300 112px Georgia, "Times New Roman", serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.fillText('ORIGEN 34°', 1024, 320);

  ctx.strokeStyle = '#b9a06a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(854, 372);
  ctx.lineTo(1194, 372);
  ctx.stroke();

  ctx.fillStyle = '#77683a';
  ctx.font = '500 22px Inter, Arial, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '8px';
  ctx.fillText('COLONIA · URUGUAY', 1024, 438);

  ctx.fillStyle = '#1b2112';
  ctx.font = '500 24px Inter, Arial, sans-serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
  ctx.fillText('500 ml', 1024, 510);

  // Ramitas de olivo a los costados.
  const drawSprig = (cx, mirror) => {
    ctx.save();
    ctx.translate(cx, 460);
    if (mirror) ctx.scale(-1, 1);
    ctx.strokeStyle = '#8b8f4c';
    ctx.fillStyle = '#8b8f4c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-40, 46);
    ctx.quadraticCurveTo(12, 8, 52, -44);
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
      const t = i / 3;
      const x = -40 + 92 * t;
      const y = 46 - 90 * t;
      ctx.beginPath();
      ctx.ellipse(x + 10, y - 10, 16, 7, -0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(56, -48, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#5c672c';
    ctx.fill();
    ctx.restore();
  };

  drawSprig(430, false);
  drawSprig(1618, true);

  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  labelTexture.wrapS = THREE.RepeatWrapping;
  labelTexture.repeat.x = 1;

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.567, 0.567, 0.95, 96, 1, true),
    new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.82,
      metalness: 0,
      envMapIntensity: 0.4,
    })
  );
  label.position.y = 0.92;
  label.rotation.y = Math.PI;
  bottle.add(label);

  /* ---------- Cápsula dorada ---------- */

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9a457,
    metalness: 0.92,
    roughness: 0.28,
    envMapIntensity: 1.4,
  });

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.262, 0.262, 0.27, 64), goldMaterial);
  cap.position.y = 2.33;
  bottle.add(cap);

  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.262, 0.262, 0.02, 64), goldMaterial);
  capTop.position.y = 2.475;
  bottle.add(capTop);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.226, 0.012, 8, 64), goldMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 2.17;
  bottle.add(ring);

  /* ---------- Aceitunas y hojas ---------- */

  const decor = new THREE.Group();
  world.add(decor);

  const oliveMaterial = new THREE.MeshStandardMaterial({ color: 0x4d5a21, roughness: 0.5 });
  const oliveDark = new THREE.MeshStandardMaterial({ color: 0x39441a, roughness: 0.6 });

  const olives = [
    { p: [-1.38, 0.4, 0.2], r: 0.13, s: 1.25 },
    { p: [-1.08, 1.02, -0.3], r: 0.1, s: 1.1 },
    { p: [1.34, 0.68, -0.1], r: 0.12, s: 1.2 },
    { p: [0.98, -0.22, 0.44], r: 0.09, s: 1.1 },
    { p: [-0.72, 1.74, 0.2], r: 0.08, s: 1.15 },
  ];

  const oliveMeshes = olives.map(({ p, r, s }, index) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 24),
      index % 2 === 0 ? oliveMaterial : oliveDark
    );
    mesh.position.set(p[0], p[1], p[2]);
    mesh.scale.set(1, s, 1);
    mesh.userData.base = mesh.position.clone();
    mesh.userData.phase = index * 0.9;
    decor.add(mesh);
    return mesh;
  });

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.17, 0.1, 0.52, 0);
  leafShape.quadraticCurveTo(0.17, -0.1, 0, 0);

  const leafGeometry = new THREE.ShapeGeometry(leafShape, 12);
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d7c34,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });

  const leaves = [
    { p: [-1.5, -0.58, 0.14], r: [0.2, 0.7, 2.4], s: 0.66 },
    { p: [1.5, 1.16, 0.04], r: [0.3, -0.5, -0.7], s: 0.6 },
    { p: [1.2, -0.98, 0.24], r: [0.2, 0.9, 1.5], s: 0.55 },
  ];

  leaves.forEach(({ p, r, s }) => {
    const mesh = new THREE.Mesh(leafGeometry, leafMaterial);
    mesh.position.set(p[0], p[1], p[2]);
    mesh.rotation.set(r[0], r[1], r[2]);
    mesh.scale.setScalar(s);
    decor.add(mesh);
  });

  /* ---------- Interacción y render ---------- */

  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  let running = false;
  let visible = true;
  let frame = 0;

  const onPointerMove = (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  const resize = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if (!running) render();
  };

  const render = () => {
    renderer.render(scene, camera);
  };

  const clock = new THREE.Clock();

  const tick = () => {
    if (!running) return;

    frame = requestAnimationFrame(tick);

    const t = clock.getElapsedTime();
    smooth.x += (pointer.x - smooth.x) * 0.045;
    smooth.y += (pointer.y - smooth.y) * 0.045;

    bottle.rotation.y = Math.sin(t * 0.34) * 0.22 + smooth.x * 0.34;
    bottle.rotation.x = Math.sin(t * 0.26) * 0.02 + smooth.y * 0.07;
    bottle.position.y = Math.sin(t * 0.62) * 0.025;

    decor.rotation.y = Math.sin(t * 0.2) * 0.24 + smooth.x * 0.14;

    oliveMeshes.forEach((mesh) => {
      const base = mesh.userData.base;
      mesh.position.y = base.y + Math.sin(t * 0.7 + mesh.userData.phase) * 0.06;
      mesh.rotation.y = t * 0.18 + mesh.userData.phase;
    });

    render();
  };

  const start = () => {
    if (running) return;
    running = true;
    clock.start();
    tick();
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  resize();

  if (reduceMotion) {
    render();
  } else {
    start();

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0.05 }
    );
    io.observe(stage);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (visible) start();
    });

    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(stage);
  } else {
    window.addEventListener('resize', resize);
  }

  // Primer frame antes de mostrarlo, para evitar el flash del canvas vacío.
  render();
  requestAnimationFrame(() => {
    canvas.classList.add('is-ready');
    stage.classList.add('is-ready');
  });

  return () => {
    stop();
    renderer.dispose();
  };
}
