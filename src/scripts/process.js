import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * "Así lo hacemos" — narrativa de scroll.
 *
 * Un solo mundo continuo: seis estaciones separadas sobre el eje X. La cámara
 * hace una panorámica con el progreso del scroll y el producto (semilla →
 * aceituna → aceite → botella) se transforma delante de ella. No hay cortes
 * ni cross-fades de escena: el usuario arrastra la historia.
 */

const S = [0, 7, 14, 21, 28, 35];

const CAM_KEYS = [
  { p: 0, x: S[0] - 2.8 },
  { p: 0.02, x: S[0] - 1.3 },
  { p: 0.083, x: S[0] },
  { p: 0.25, x: S[1] },
  { p: 0.417, x: S[2] },
  { p: 0.583, x: S[3] },
  { p: 0.75, x: S[4] },
  { p: 0.917, x: S[5] },
  { p: 1, x: S[5] + 1.2 },
];

const Y_KEYS = [
  { p: 0.0, x: 0.42 },
  { p: 0.1, x: 0.6 },
  { p: 0.19, x: 1.1 },
  { p: 0.3, x: 1.02 },
  { p: 0.38, x: 0.9 },
  { p: 0.46, x: 0.84 },
  { p: 0.54, x: 0.7 },
  { p: 0.62, x: 0.72 },
  { p: 0.7, x: 0.86 },
  { p: 0.78, x: 0.86 },
  { p: 0.88, x: 1.04 },
  { p: 1.0, x: 1.04 },
];

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const range = (p, a, b) => clamp01((p - a) / (b - a || 1));
const smooth = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

function sampleKey(keys, p) {
  if (p <= keys[0].p) return keys[0].x;
  for (let i = 1; i < keys.length; i += 1) {
    if (p <= keys[i].p) {
      const prev = keys[i - 1];
      const next = keys[i];
      return mix(prev.x, next.x, smooth((p - prev.p) / (next.p - prev.p || 1)));
    }
  }
  return keys[keys.length - 1].x;
}

/* --------------------------------------------------------------------------
   Materiales y geometrías compartidas
   -------------------------------------------------------------------------- */

const flat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.84, metalness: 0, ...extra });

const M = {
  sand: flat(0xe9dab7),
  sandDeep: flat(0xdac7a0),
  road: flat(0xd2c4a2),
  hill: flat(0xc2caa0),
  hillFar: flat(0xd6dabf),
  olive: flat(0x7d8c46),
  oliveDeep: flat(0x5c6a31),
  leaf: flat(0x94a358),
  trunk: flat(0x8b6a46),
  trunkDeep: flat(0x735539),
  terracotta: flat(0xc47e54),
  terracottaDeep: flat(0xa96641),
  cream: flat(0xf4ecd8),
  paper: flat(0xfaf5e8),
  steel: flat(0xb9c2bf),
  steelDeep: flat(0x8f9a97),
  stone: flat(0xd3cab2),
  stoneDeep: flat(0xb7ac91),
  gold: flat(0xd7a845),
  goldDeep: flat(0xb8892f),
  glass: flat(0x37431f, { roughness: 0.42 }),
  wood: flat(0xa9744a),
  woodDeep: flat(0x875a38),
  ink: flat(0x2b3020),
  bread: flat(0xd9b374),
  crust: flat(0xb07f49),
  skin: flat(0xd3a173),
  straw: flat(0xd9bd78),
  white: flat(0xf8f3e7),
};

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 12, 10),
  ico: new THREE.IcosahedronGeometry(1, 0),
  ico1: new THREE.IcosahedronGeometry(1, 1),
  plane: new THREE.PlaneGeometry(1, 1),
};

function box(parent, w, h, d, material, x = 0, y = 0, z = 0, ry = 0) {
  const m = new THREE.Mesh(G.box, material);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  parent.add(m);
  return m;
}

function ico(parent, r, material, x = 0, y = 0, z = 0, detail = 0) {
  const m = new THREE.Mesh(detail ? G.ico1 : G.ico, material);
  m.scale.setScalar(r);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function cyl(parent, rTop, rBottom, h, seg, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function cone(parent, r, h, seg, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/* Sombra de contacto: degradado radial en canvas, sin shadow maps. */
function makeShadowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(74, 60, 32, 0.42)');
  g.addColorStop(0.55, 'rgba(74, 60, 32, 0.18)');
  g.addColorStop(1, 'rgba(74, 60, 32, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let shadowTexture = null;
let shadowMaterial = null;

function contact(parent, size, x, z, opacity = 0.5) {
  if (!shadowMaterial) {
    shadowTexture = makeShadowTexture();
    shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
  }
  const m = new THREE.Mesh(G.plane, shadowMaterial.clone());
  m.material.opacity = opacity;
  m.scale.set(size, size, 1);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.014, z);
  parent.add(m);
  return m;
}

/* --------------------------------------------------------------------------
   Props reutilizables
   -------------------------------------------------------------------------- */

function tree(parent, x, z, s = 1, tone = M.olive) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  parent.add(g);

  cyl(g, 0.13, 0.21, 1.5, 6, M.trunk, 0, 0.75, 0);

  const c1 = ico(g, 1.06, tone, 0, 2.02, 0, 1);
  c1.scale.set(1.12, 0.88, 1.0);
  const c2 = ico(g, 0.82, M.oliveDeep, -0.56, 2.36, 0.16, 1);
  const c3 = ico(g, 0.76, tone, 0.62, 2.28, -0.18, 1);
  ico(g, 0.62, M.leaf, 0.04, 2.72, 0.1, 1);

  return g;
}

function sapling(parent, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);

  cyl(g, 0.028, 0.042, 0.52, 5, M.oliveDeep, 0, 0.26, 0);

  const leaf = new THREE.SphereGeometry(1, 6, 4);
  const a = new THREE.Mesh(leaf, M.leaf);
  a.scale.set(0.17, 0.028, 0.07);
  a.position.set(-0.13, 0.5, 0);
  a.rotation.z = 0.55;
  g.add(a);

  const b = new THREE.Mesh(leaf, M.leaf);
  b.scale.set(0.15, 0.026, 0.065);
  b.position.set(0.13, 0.4, 0);
  b.rotation.z = -0.55;
  g.add(b);

  return g;
}

function basket(parent, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);

  cyl(g, 0.44, 0.33, 0.42, 10, M.terracotta, 0, 0.21, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 6, 14), M.terracottaDeep);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.42;
  g.add(rim);

  const oliveGeo = new THREE.SphereGeometry(1, 8, 6);
  for (let i = 0; i < 6; i += 1) {
    const o = new THREE.Mesh(oliveGeo, i % 2 ? M.olive : M.oliveDeep);
    const a = (i / 6) * Math.PI * 2;
    o.scale.setScalar(0.072);
    o.position.set(Math.cos(a) * 0.2, 0.44, Math.sin(a) * 0.2);
    g.add(o);
  }

  contact(parent, 1.4, x, z, 0.32);
  return g;
}

function crate(parent, x, z, material = M.wood) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);

  box(g, 0.8, 0.44, 0.62, material, 0, 0.22, 0);
  box(g, 0.84, 0.05, 0.66, M.woodDeep, 0, 0.46, 0);

  contact(parent, 1.3, x, z, 0.28);
  return g;
}

function farmer(parent, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = -0.5;
  parent.add(g);

  box(g, 0.17, 0.68, 0.17, M.oliveDeep, -0.13, 0.34, 0);
  box(g, 0.17, 0.68, 0.17, M.oliveDeep, 0.13, 0.34, 0);

  cyl(g, 0.25, 0.33, 0.86, 6, M.cream, 0, 1.03, 0);

  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.62, 5), M.cream);
  armL.position.set(-0.29, 1.02, 0.06);
  armL.rotation.z = 0.62;
  armL.rotation.x = -0.3;
  g.add(armL);

  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.62, 5), M.cream);
  armR.position.set(0.29, 1.02, 0.06);
  armR.rotation.z = -0.62;
  armR.rotation.x = -0.3;
  g.add(armR);

  ico(g, 0.17, M.skin, 0, 1.6, 0, 1);

  cone(g, 0.34, 0.2, 8, M.straw, 0, 1.74, 0);
  cyl(g, 0.42, 0.42, 0.035, 12, M.straw, 0, 1.66, 0);

  contact(parent, 1.1, x, z, 0.35);
  return g;
}

function branch(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);

  const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.038, 1.7, 5), M.trunk);
  wood.rotation.z = Math.PI / 2 - 0.08;
  wood.position.set(-0.55, 0, 0);
  g.add(wood);

  const leaf = new THREE.SphereGeometry(1, 6, 4);
  const spots = [
    [-0.15, 0.12, 0.02, 0.7],
    [-0.55, -0.14, -0.02, -0.6],
    [-0.95, 0.1, 0.03, 0.5],
    [0.1, -0.16, 0.0, -0.55],
  ];
  spots.forEach(([lx, ly, lz, rz]) => {
    const l = new THREE.Mesh(leaf, M.leaf);
    l.scale.set(0.19, 0.03, 0.075);
    l.position.set(lx, ly, lz);
    l.rotation.z = rz;
    g.add(l);
  });

  return g;
}

/* --------------------------------------------------------------------------
   Estaciones
   -------------------------------------------------------------------------- */

function buildOrigin(parent, x) {
  const g = new THREE.Group();
  g.position.x = x;
  parent.add(g);

  cyl(g, 2.05, 2.55, 0.18, 12, M.sandDeep, 0, 0.09, -0.6);
  cyl(g, 1.45, 1.95, 0.16, 12, M.sand, 0, 0.24, -0.6);
  cyl(g, 0.98, 1.42, 0.14, 10, M.terracotta, 0, 0.37, -0.6);

  ico(g, 0.2, M.stoneDeep, -1.9, 0.16, 0.5);
  ico(g, 0.12, M.stone, 1.7, 0.1, 0.2);

  tree(g, -3.2, -3.0, 1.25);
  tree(g, 3.0, -4.4, 0.9, M.oliveDeep);
  tree(g, 1.7, -5.8, 0.7, M.hill);
  sapling(g, 2.3, -0.4);

  contact(g, 3.6, 0, -0.6, 0.4);
}

function buildCultivo(parent, x) {
  const g = new THREE.Group();
  g.position.x = x;
  parent.add(g);

  tree(g, -3.0, -3.2, 1.45);
  tree(g, 3.1, -4.7, 1.0, M.oliveDeep);
  tree(g, -1.1, -6.2, 0.8, M.hill);

  farmer(g, 2.55, -1.5);
  basket(g, 1.5, -0.45);
  crate(g, -1.95, 0.15, M.wood);
  crate(g, -2.5, -0.95, M.woodDeep);

  branch(g, 0, 1.06, 0.2);

  contact(g, 3.2, 0, -0.6, 0.32);
}

function buildMill(parent, x) {
  const g = new THREE.Group();
  g.position.x = x;
  parent.add(g);

  box(g, 0.55, 3.1, 0.5, M.cream, -3.7, 1.55, -3.0);
  box(g, 0.55, 3.1, 0.5, M.cream, 3.7, 1.55, -3.0);
  box(g, 8.0, 0.5, 0.5, M.cream, 0, 3.35, -3.0);

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.7, 0.2, 12), M.stone);
  floor.position.set(0, 0.1, -1.0);
  g.add(floor);

  // Molino de piedra
  const mill = new THREE.Group();
  mill.position.set(-1.95, 0, -1.5);
  g.add(mill);

  box(mill, 1.55, 0.26, 1.55, M.stoneDeep, 0, 0.23, 0);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.28, 16), M.stone);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 1.28, 0.02);
  mill.add(wheel);

  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.9, 8), M.steelDeep);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(0, 1.28, 0.02);
  mill.add(axle);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 10), M.woodDeep);
  hub.rotation.z = Math.PI / 2;
  hub.position.set(0.9, 1.28, 0.02);
  mill.add(hub);

  // Tolva
  cyl(mill, 0.18, 0.95, 0.95, 9, M.steel, 0, 2.42, 0.25);
  cyl(mill, 0.97, 0.97, 0.06, 12, M.steelDeep, 0, 2.9, 0.25);
  box(mill, 0.3, 0.5, 0.3, M.steelDeep, 0, 1.88, 0.25);

  // Prensa
  const press = new THREE.Group();
  press.position.set(1.95, 0, -1.5);
  g.add(press);

  box(press, 1.5, 0.25, 1.2, M.stoneDeep, 0, 0.22, 0);
  box(press, 0.16, 1.75, 0.16, M.steelDeep, -0.58, 1.1, 0);
  box(press, 0.16, 1.75, 0.16, M.steelDeep, 0.58, 1.1, 0);
  box(press, 1.4, 0.2, 0.34, M.steel, 0, 2.05, 0);
  cyl(press, 0.18, 0.18, 0.8, 10, M.steel, 0, 1.45, 0);
  box(press, 0.72, 0.16, 0.6, M.steel, 0, 0.95, 0);

  // Tanque de acero
  const tank = new THREE.Group();
  tank.position.set(3.05, 0, -1.9);
  g.add(tank);
  cyl(tank, 0.55, 0.55, 1.5, 14, M.steel, 0, 0.75, 0);
  cyl(tank, 0.58, 0.58, 0.06, 14, M.steelDeep, 0, 1.53, 0);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.565, 0.565, 0.09, 14), M.gold);
  band.position.y = 1.05;
  tank.add(band);

  crate(g, -0.35, 0.5, M.wood);
  crate(g, 0.45, 0.35, M.woodDeep);

  contact(g, 3.8, 0, -1.0, 0.34);
}

function buildTransport(parent, x) {
  const g = new THREE.Group();
  g.position.x = x;
  parent.add(g);

  box(g, 13.5, 0.05, 2.9, M.road, 0, 0.03, -0.4);
  for (let i = 0; i < 9; i += 1) {
    box(g, 0.7, 0.06, 0.12, M.cream, -5.6 + i * 1.4, 0.07, -0.4);
  }

  // Camión
  const truck = new THREE.Group();
  truck.position.set(-2.7, 0, -0.8);
  g.add(truck);

  box(truck, 2.5, 1.66, 1.36, M.olive, -0.35, 1.55, 0);
  box(truck, 2.54, 0.12, 1.4, M.gold, -0.35, 2.4, 0);
  box(truck, 1.2, 1.12, 1.36, M.cream, 1.5, 1.22, 0);
  box(truck, 0.06, 0.5, 0.95, M.ink, 2.11, 1.42, 0);
  box(truck, 2.4, 0.26, 1.4, M.steelDeep, 0, 0.62, 0);
  box(truck, 1.15, 0.16, 1.42, M.terracottaDeep, 1.5, 0.6, 0);

  const wheel = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 12);
  [
    [-1.4, 0.36, 0.72],
    [-1.4, 0.36, -0.72],
    [1.45, 0.36, 0.72],
    [1.45, 0.36, -0.72],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheel, M.ink);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, wy, wz);
    truck.add(w);
  });

  // Bidones
  const drum = (dx, dz) => {
    cyl(g, 0.4, 0.4, 1.05, 12, M.steel, dx, 0.55, dz);
    cyl(g, 0.42, 0.42, 0.05, 12, M.steelDeep, dx, 1.09, dz);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.08, 12), M.gold);
    b.position.set(dx, 0.8, dz);
    g.add(b);
    contact(g, 1.2, dx, dz, 0.3);
  };
  drum(2.35, -1.5);
  drum(3.15, -1.15);

  // Cajón de embarque: el producto se apoya arriba.
  box(g, 1.15, 0.66, 1.0, M.wood, 0, 0.35, 0.35);
  box(g, 1.2, 0.06, 1.05, M.woodDeep, 0, 0.7, 0.35);

  crate(g, -0.25, 1.6, M.woodDeep);

  contact(g, 4.6, -2.4, -0.8, 0.42);
  contact(g, 3.2, 0, 0.3, 0.3);
}

function buildShop(parent, x) {
  const g = new THREE.Group();
  g.position.x = x;
  parent.add(g);

  box(g, 9.2, 4.8, 0.24, M.cream, 0, 2.4, -3.5);
  box(g, 9.3, 0.16, 0.3, M.woodDeep, 0, 0.08, -3.5);

  // Estantería
  const shelf = new THREE.Group();
  shelf.position.set(0, 0, -2.6);
  g.add(shelf);

  box(shelf, 0.14, 2.7, 0.42, M.woodDeep, -2.35, 1.35, 0);
  box(shelf, 0.14, 2.7, 0.42, M.woodDeep, 2.35, 1.35, 0);
  [0.7, 1.45, 2.2].forEach((py) => box(shelf, 4.85, 0.09, 0.46, M.wood, 0, py, 0));

  const bottleGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.52, 8);
  const neckGeo = new THREE.CylinderGeometry(0.045, 0.06, 0.2, 6);
  const shelfTones = [M.glass, M.goldDeep, M.oliveDeep, M.terracottaDeep];
  [0.7, 1.45, 2.2].forEach((py, row) => {
    for (let i = 0; i < 5; i += 1) {
      if (row === 2 && i > 1) break;
      const bx = -1.8 + i * 0.9;
      const tone = shelfTones[(i + row) % shelfTones.length];
      const b = new THREE.Mesh(bottleGeo, tone);
      b.position.set(bx, py + 0.31, 0);
      shelf.add(b);
      const n = new THREE.Mesh(neckGeo, tone);
      n.position.set(bx, py + 0.65, 0);
      shelf.add(n);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 6), M.gold);
      cap.position.set(bx, py + 0.77, 0);
      shelf.add(cap);
    }
  });

  // Mostrador
  box(g, 2.0, 0.95, 1.05, M.wood, 2.75, 0.48, 0.2);
  box(g, 2.1, 0.08, 1.15, M.woodDeep, 2.75, 0.99, 0.2);
  box(g, 0.55, 0.3, 0.4, M.ink, 0.5, 0.15, 1.1);

  // Pedestal del producto
  cyl(g, 0.42, 0.5, 0.86, 10, M.terracotta, 0, 0.43, 0.7);
  cyl(g, 0.46, 0.46, 0.05, 10, M.terracottaDeep, 0, 0.88, 0.7);

  // Lámparas
  const lamp = (lx) => {
    cyl(g, 0.012, 0.012, 1.4, 4, M.ink, lx, 3.35, -0.6);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.36, 10, 1, true), M.terracottaDeep);
    shade.material = M.terracottaDeep.clone();
    shade.material.side = THREE.DoubleSide;
    shade.position.set(lx, 2.55, -0.6);
    g.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M.gold);
    bulb.position.set(lx, 2.48, -0.6);
    g.add(bulb);
    const light = new THREE.PointLight(0xffc978, 6, 7, 2);
    light.position.set(lx, 2.4, -0.4);
    g.add(light);
  };
  lamp(-1.4);
  lamp(1.6);

  contact(g, 4.2, 0, 0.1, 0.3);
}

function buildTable(parent, x) {
  const g = new THREE.Group();
  g.position.x = x;
  parent.add(g);

  box(g, 10, 4.6, 0.24, M.cream, 0, 2.3, -4.2);
  box(g, 10, 0.14, 0.3, M.woodDeep, 0, 0.07, -4.2);

  // Mesa
  box(g, 4.4, 0.14, 1.6, M.wood, 0, 1.0, 0.3);
  box(g, 4.5, 0.05, 1.7, M.woodDeep, 0, 0.92, 0.3);
  [
    [-1.9, -0.35],
    [1.9, -0.35],
    [-1.9, 0.95],
    [1.9, 0.95],
  ].forEach(([lx, lz]) => box(g, 0.16, 0.92, 0.16, M.woodDeep, lx, 0.46, lz));

  // Plato y pan
  cyl(g, 0.62, 0.66, 0.06, 16, M.white, -1.35, 1.1, 0.35);
  cyl(g, 0.5, 0.5, 0.02, 16, M.paper, -1.35, 1.14, 0.35);
  const bread = ico(g, 0.3, M.crust, -1.35, 1.26, 0.35, 1);
  bread.scale.set(1.25, 0.62, 0.9);
  bread.material = M.crust.clone();
  const cut = ico(g, 0.24, M.bread, -1.35, 1.29, 0.38, 1);
  cut.scale.set(1.3, 0.4, 0.85);

  // Bowl de aceitunas
  cyl(g, 0.34, 0.28, 0.16, 10, M.terracotta, 1.45, 1.16, 0.3);
  const oliveGeo = new THREE.SphereGeometry(1, 8, 6);
  for (let i = 0; i < 5; i += 1) {
    const o = new THREE.Mesh(oliveGeo, i % 2 ? M.olive : M.oliveDeep);
    const a = (i / 5) * Math.PI * 2;
    o.scale.setScalar(0.07);
    o.position.set(1.45 + Math.cos(a) * 0.16, 1.26, 0.3 + Math.sin(a) * 0.16);
    g.add(o);
  }

  // Vaso
  cyl(g, 0.15, 0.13, 0.4, 10, M.paper, 0.65, 1.32, 0.5);

  // Lámpara
  cyl(g, 0.012, 0.012, 1.5, 4, M.ink, 0.3, 3.3, 0.2);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 10, 1, true), M.cream);
  shade.material = M.cream.clone();
  shade.material.side = THREE.DoubleSide;
  shade.position.set(0.3, 2.5, 0.2);
  g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), M.gold);
  bulb.position.set(0.3, 2.43, 0.2);
  g.add(bulb);
  const light = new THREE.PointLight(0xffc37a, 7, 8, 2);
  light.position.set(0.3, 2.3, 0.6);
  g.add(light);

  contact(g, 5.4, 0, 0.3, 0.3);
}

/* --------------------------------------------------------------------------
   Producto: semilla → aceituna → aceite → botella
   -------------------------------------------------------------------------- */

function buildProductBottle() {
  const g = new THREE.Group();
  const k = 0.6;

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
  ].map(([px, py]) => new THREE.Vector2(px * k, py * k));

  const glass = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), M.glass);
  g.add(glass);

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.344, 0.344, 0.52, 48, 1, true),
    M.paper
  );
  label.position.y = 0.56;
  g.add(label);

  const line = new THREE.Mesh(
    new THREE.CylinderGeometry(0.347, 0.347, 0.035, 48, 1, true),
    M.gold
  );
  line.position.y = 0.83;
  g.add(line);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.17, 24), M.gold);
  cap.position.y = 1.36;
  g.add(cap);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.332, 0.332, 0.03, 32), M.oliveDeep);
  base.position.y = 0.015;
  g.add(base);

  return g;
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */

export function initProcess(section) {
  const sceneEl = section.querySelector('.process__scene');
  const canvas = section.querySelector('[data-process-canvas]');
  const hint = section.querySelector('[data-process-hint]');
  const count = section.querySelector('[data-process-count]');
  const ticks = [...section.querySelectorAll('.process__ticks span')];
  const beats = [...section.querySelectorAll('.beat')];

  if (!sceneEl || !canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    return;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduce) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 140);

  scene.add(new THREE.AmbientLight(0xfff4e2, 1.45));

  const key = new THREE.DirectionalLight(0xfff3dc, 1.55);
  key.position.set(6, 11, 8);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc9d8a4, 0.55);
  fill.position.set(-7, 5, -5);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);

  /* Suelo y paisaje continuo */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(96, 48), M.sand);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(17.5, 0, -8);
  world.add(ground);

  for (let i = 0; i < 10; i += 1) {
    const hx = -13 + i * 7.6;
    const scale = 5.5 + (i % 3) * 1.6;
    const hill = new THREE.Mesh(G.ico1, i % 2 ? M.hill : M.hillFar);
    hill.scale.set(scale, 1.9 + (i % 2) * 0.7, 4.2);
    hill.position.set(hx, -0.9, -20 - (i % 3) * 2.5);
    hill.rotation.y = i * 0.7;
    world.add(hill);
  }

  for (let i = 0; i < 9; i += 1) {
    const tx = -11 + i * 6.4 + (i % 2) * 1.4;
    tree(world, tx, -12 - (i % 3) * 2.2, 0.7 + (i % 2) * 0.22, i % 2 ? M.oliveDeep : M.olive);
  }

  buildOrigin(world, S[0]);
  buildCultivo(world, S[1]);
  buildMill(world, S[2]);
  buildTransport(world, S[3]);
  buildShop(world, S[4]);
  buildTable(world, S[5]);

  /* Producto */
  const product = new THREE.Group();
  product.position.set(S[0], 0.42, 0.5);
  world.add(product);

  const fruitMat = flat(0x44501f);
  const fruit = new THREE.Mesh(G.sphere, fruitMat);
  product.add(fruit);

  const cluster = new THREE.Group();
  product.add(cluster);
  [
    [-0.27, 0.17, 0.08, 0.15],
    [0.25, 0.21, -0.05, 0.13],
    [-0.19, -0.2, -0.1, 0.12],
    [0.22, -0.15, 0.13, 0.11],
  ].forEach(([cx, cy, cz, cs], i) => {
    const o = new THREE.Mesh(G.sphere, i % 2 ? M.olive : M.oliveDeep);
    o.position.set(cx, cy, cz);
    o.scale.setScalar(cs);
    cluster.add(o);
  });

  const oilMat = flat(0xd7a845, { roughness: 0.35 });
  const oil = new THREE.Mesh(G.sphere, oilMat);
  product.add(oil);

  const bottle = buildProductBottle();
  bottle.scale.setScalar(0.0001);
  product.add(bottle);

  // Destello dorado en el momento del envasado.
  const flash = new THREE.PointLight(0xffca78, 0, 9, 2);
  flash.position.set(0, 0.9, 0);
  product.add(flash);

  // Halo final detrás de la botella.
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xd7a845,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.02, 8, 40), glowMat);
  glow.position.set(0, 0.72, -0.35);
  product.add(glow);

  /* Partículas de aceite en la almazara */
  const particleCount = 34;
  const particlePos = new Float32Array(particleCount * 3);
  const particleSeed = [];
  for (let i = 0; i < particleCount; i += 1) {
    particleSeed.push({
      x: S[2] + (Math.random() - 0.5) * 0.7,
      z: -1.4 + (Math.random() - 0.5) * 0.5,
      off: Math.random(),
      speed: 0.7 + Math.random() * 0.5,
    });
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

  function makeDotTexture() {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
    grd.addColorStop(0, 'rgba(255, 220, 140, 1)');
    grd.addColorStop(0.5, 'rgba(231, 176, 70, 0.9)');
    grd.addColorStop(1, 'rgba(231, 176, 70, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }

  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      color: 0xffd27a,
      size: 0.12,
      map: makeDotTexture(),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
      opacity: 0,
    })
  );
  world.add(particles);

  /* ------------------------------------------------------------------
     Layout
     ------------------------------------------------------------------ */

  let narrow = false;
  let lookOffset = -1.5;

  function layout() {
    const w = sceneEl.clientWidth;
    const h = sceneEl.clientHeight;
    if (!w || !h) return;

    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    camera.fov = aspect < 0.9 ? 34 : 32;
    camera.updateProjectionMatrix();
    camera.position.z = THREE.MathUtils.clamp((12.6 / Math.min(aspect, 1.35)) * 0.92, 11.6, 26);
    narrow = aspect < 0.95;
    lookOffset = narrow ? -0.15 : -1.5;
  }

  /* ------------------------------------------------------------------
     Estado y update
     ------------------------------------------------------------------ */

  const pointer = { x: 0, y: 0 };
  const smoothPointer = { x: 0, y: 0 };
  let targetP = 0;
  let currentP = 0;
  let lastBeat = -1;

  const seedColor = new THREE.Color(0x3d471d);
  const ripeColor = new THREE.Color(0x5c6a2c);

  function apply(p, time) {
    const camX = sampleKey(CAM_KEYS, p);

    smoothPointer.x += (pointer.x - smoothPointer.x) * 0.06;
    smoothPointer.y += (pointer.y - smoothPointer.y) * 0.06;

    camera.position.x = camX + smoothPointer.x * 0.5;
    camera.position.y = 2.6 + smoothPointer.y * 0.16;
    camera.lookAt(camX + lookOffset, 1.14, 0.35);

    product.position.x = camX;
    product.position.y = sampleKey(Y_KEYS, p);

    /* Semilla → aceituna */
    const grow = smooth(range(p, 0.03, 0.17));
    const ripe = smooth(range(p, 0.14, 0.27));
    const fruitOut = 1 - smooth(range(p, 0.295, 0.365));
    const fr = mix(0.17, 0.275, grow) * fruitOut;
    fruit.scale.set(fr * 0.92, fr * 1.06, fr * 0.92);
    fruit.rotation.set(0.25, time * 0.22, 0.12);
    fruit.visible = fr > 0.004;
    fruitMat.color.copy(seedColor).lerp(ripeColor, ripe);

    const clIn = smooth(range(p, 0.125, 0.2));
    const clOut = 1 - smooth(range(p, 0.29, 0.355));
    const clusterScale = clIn * clOut;
    cluster.scale.setScalar(clusterScale);
    cluster.visible = clusterScale > 0.01;
    cluster.rotation.y = time * 0.3;

    /* Aceituna → aceite */
    const oilIn = smooth(range(p, 0.305, 0.395));
    const oilOut = 1 - smooth(range(p, 0.465, 0.53));
    const os = oilIn * oilOut;
    oil.scale.set(0.27 * os * 0.86, 0.34 * os, 0.27 * os * 0.86);
    oil.position.y = Math.sin(time * 2.2) * 0.02;
    oil.visible = os > 0.004;

    /* Aceite → botella */
    const bottleIn = smooth(range(p, 0.465, 0.555));
    const bs = Math.max(0.0001, bottleIn);
    bottle.scale.setScalar(bs);
    bottle.visible = bottleIn > 0.002;
    bottle.rotation.y = 0.16;

    const flashP = range(p, 0.45, 0.62);
    flash.intensity = Math.sin(flashP * Math.PI) * 5.5;

    const glowIn = smooth(range(p, 0.88, 0.99));
    glow.material.opacity = glowIn * 0.55;
    glow.scale.setScalar(mix(0.35, 1.05, glowIn));
    glow.rotation.z = time * 0.12;

    /* Partículas de la almazara */
    const partWindow = range(p, 0.3, 0.47);
    particles.material.opacity = Math.sin(partWindow * Math.PI) * 0.95;
    if (particles.material.opacity > 0.002) {
      for (let i = 0; i < particleCount; i += 1) {
        const s = particleSeed[i];
        const t = clamp01(partWindow * 1.7 - s.off * 0.7);
        const idx = i * 3;
        particlePos[idx] = s.x + Math.sin((t + s.off) * 9) * 0.08;
        particlePos[idx + 1] = mix(2.35, 0.72, t);
        particlePos[idx + 2] = s.z;
      }
      particleGeo.attributes.position.needsUpdate = true;
    }

    /* Textos: la opacidad sigue al progreso, no a un temporizador. */
    const span = 1 / 6;
    beats.forEach((el, i) => {
      const local = p / span - i;
      let opacity;
      if (i === 0) {
        opacity = 1 - smooth(range(local, 0.74, 0.99));
      } else if (i === beats.length - 1) {
        opacity = smooth(range(local, 0.0, 0.2));
      } else {
        opacity = smooth(range(local, -0.24, -0.02)) * (1 - smooth(range(local, 0.74, 0.99)));
      }
      const shift = (0.5 - clamp01(local)) * 22;
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    });

    const active = Math.min(5, Math.max(0, Math.floor(p * 6 + 0.0001)));
    if (active !== lastBeat) {
      lastBeat = active;
      if (count) count.textContent = `0${active + 1} / 06`;
      ticks.forEach((tick, i) => tick.classList.toggle('is-active', i === active));
    }

    if (hint) hint.style.opacity = String(1 - smooth(range(p, 0.012, 0.06)));
  }

  /* ------------------------------------------------------------------
     Loop
     ------------------------------------------------------------------ */

  const clock = new THREE.Clock();
  let frame = 0;
  let running = false;
  let visible = false;

  function render() {
    renderer.render(scene, camera);
  }

  function tick() {
    if (!running) return;
    frame = requestAnimationFrame(tick);
    currentP += (targetP - currentP) * 0.115;
    if (Math.abs(targetP - currentP) < 0.00025) currentP = targetP;
    apply(currentP, clock.getElapsedTime());
    render();
  }

  function start() {
    if (running) return;
    running = true;
    clock.start();
    tick();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  function onPointer(event) {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }

  /* ------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------ */

  section.classList.add('is-live');
  layout();
  apply(0, 0);
  render();

  if (!coarse) {
    window.addEventListener('pointermove', onPointer, { passive: true });
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      targetP = self.progress;
    },
    onRefresh: (self) => {
      targetP = self.progress;
    },
  });

  ScrollTrigger.refresh();
  currentP = targetP;
  apply(currentP, 0);

  if ('ResizeObserver' in window) {
    let resizeTimer = 0;
    new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layout();
        render();
        ScrollTrigger.refresh();
      }, 120);
    }).observe(sceneEl);
  } else {
    window.addEventListener('resize', () => {
      layout();
      render();
    });
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden) start();
      else stop();
    },
    { rootMargin: '20% 0px' }
  );
  io.observe(section);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());

  return () => {
    stop();
    io.disconnect();
    renderer.dispose();
  };
}
