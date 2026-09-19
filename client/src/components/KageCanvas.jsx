import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export default function KageCanvas({ onProgress, onLoaded }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId;
    let isDisposed = false;

    // --- Math & Noise Helpers ---
    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
    const sat = v => clamp(v, 0, 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (e0, e1, x) => { const t = sat((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
    const TAU = Math.PI * 2;

    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    function noise2D(seed) {
      const rnd = mulberry32(seed), p = new Uint8Array(256), perm = new Uint8Array(512);
      for (let i = 0; i < 256; i++) p[i] = i;
      for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0, t = p[i]; p[i] = p[j]; p[j] = t; }
      for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
      const G = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
      const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
      return function (x, y) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const X = xi & 255, Y = yi & 255, xf = x - xi, yf = y - yi;
        const u = fade(xf), v = fade(yf);
        const g = (h, dx, dy) => { const q = G[h & 7]; return q[0] * dx + q[1] * dy; };
        const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
        const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
        return lerp(lerp(g(aa, xf, yf), g(ba, xf - 1, yf), u),
                    lerp(g(ab, xf, yf - 1), g(bb, xf - 1, yf - 1), u), v);
      };
    }

    function fbm(n, x, y, oct, lac, gain) {
      let a = .5, f = 1, s = 0, m = 0;
      for (let i = 0; i < (oct || 4); i++) { s += a * n(x * f, y * f); m += a; a *= (gain || .5); f *= (lac || 2); }
      return s / m;
    }

    function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    const hex = (r, g, b) => 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';

    function fbmCanvas(W, H, seed, octaves, baseCells, contrast) {
      const out = cvs(W, H), o = out.getContext('2d');
      o.fillStyle = '#808080'; o.fillRect(0, 0, W, H);
      let cells = baseCells || 3, alpha = 1;
      for (let i = 0; i < (octaves || 5); i++) {
        const n = cvs(cells, cells), nx = n.getContext('2d');
        const im = nx.createImageData(cells, cells), d = im.data, r = mulberry32(seed + i * 977);
        for (let k = 0; k < cells * cells; k++) {
          const v = 128 + (r() - .5) * 255 * (contrast || 1);
          d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = clamp(v, 0, 255); d[k * 4 + 3] = 255;
        }
        nx.putImageData(im, 0, 0);
        o.globalAlpha = alpha;
        o.globalCompositeOperation = i === 0 ? 'source-over' : 'overlay';
        o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high';
        o.drawImage(n, 0, 0, W, H);
        cells *= 2; alpha *= .62;
      }
      o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
      return out;
    }

    function normalFromHeight(hc, strength) {
      const W = hc.width, H = hc.height;
      const b = cvs(W, H), bx = b.getContext('2d');
      bx.drawImage(hc, 0, 0);
      const src = bx.getImageData(0, 0, W, H).data;
      const out = cvs(W, H), ox = out.getContext('2d');
      const im = ox.createImageData(W, H), d = im.data;
      const at = (x, y) => src[(((y + H) % H) * W + ((x + W) % W)) * 4] / 255;
      const s = strength || 2.4;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const gx = (at(x + 1, y) - at(x - 1, y)) * s;
        const gy = (at(x, y + 1) - at(x, y - 1)) * s;
        let nx = -gx, ny = gy, nz = 1;
        const il = 1 / Math.hypot(nx, ny, nz);
        const i = (y * W + x) * 4;
        d[i]     = (nx * il * .5 + .5) * 255;
        d[i + 1] = (ny * il * .5 + .5) * 255;
        d[i + 2] = (nz * il * .5 + .5) * 255;
        d[i + 3] = 255;
      }
      ox.putImageData(im, 0, 0);
      return out;
    }

    // --- Texture Generators ---
    function texFloor() {
      const W = 512, H = 512;
      const c = cvs(W, H), x = c.getContext('2d');
      const rnd = mulberry32(23);
      x.fillStyle = '#0a0f12'; x.fillRect(0, 0, W, H);
      const N = 4, S = W / N;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const t = .82 + rnd() * .36;
        x.fillStyle = hex(12 * t, 17 * t, 20 * t);
        x.fillRect(i * S + 1.5, j * S + 1.5, S - 3, S - 3);
      }
      x.globalCompositeOperation = 'overlay'; x.globalAlpha = .55;
      x.drawImage(fbmCanvas(W, H, 63, 5, 4, 1), 0, 0);
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      x.strokeStyle = 'rgba(0,0,0,.72)'; x.lineWidth = 3;
      for (let i = 0; i <= N; i++) {
        x.beginPath(); x.moveTo(i * S, 0); x.lineTo(i * S, H); x.stroke();
        x.beginPath(); x.moveTo(0, i * S); x.lineTo(W, i * S); x.stroke();
      }
      const h = cvs(W, H), hx = h.getContext('2d');
      hx.fillStyle = '#8c8c8c'; hx.fillRect(0, 0, W, H);
      hx.globalAlpha = .35; hx.drawImage(fbmCanvas(W, H, 63, 4, 8, 1), 0, 0); hx.globalAlpha = 1;
      const r = cvs(256, 256), rx = r.getContext('2d');
      rx.fillStyle = '#1c1c1c'; rx.fillRect(0, 0, 256, 256);
      rx.globalAlpha = .95; rx.globalCompositeOperation = 'lighten';
      rx.drawImage(fbmCanvas(256, 256, 77, 3, 3, 1.5), 0, 0);
      return { map: c, normal: normalFromHeight(h, 1.5), rough: r };
    }

    function texWood(seed, opt = {}) {
      const W = 256, H = 256;
      const c = cvs(W, H), x = c.getContext('2d');
      const h = cvs(W, H), hx = h.getContext('2d');
      const r = cvs(W, H), rx = r.getContext('2d');
      const base = opt.base || [30, 23, 19];
      x.fillStyle = hex(base[0], base[1], base[2]); x.fillRect(0, 0, W, H);
      hx.fillStyle = '#808080'; hx.fillRect(0, 0, W, H);
      rx.fillStyle = opt.rough || '#d6d6d6'; rx.fillRect(0, 0, W, H);
      return { map: c, normal: normalFromHeight(h, opt.relief || 2.4), rough: r };
    }

    function texStone() {
      const W = 256, H = 256;
      const c = cvs(W, H), x = c.getContext('2d');
      const h = cvs(W, H), hx = h.getContext('2d');
      const r = cvs(W, H), rx = r.getContext('2d');
      x.fillStyle = '#2e3335'; x.fillRect(0, 0, W, H);
      hx.fillStyle = '#808080'; hx.fillRect(0, 0, W, H);
      rx.fillStyle = '#e8e8e8'; rx.fillRect(0, 0, W, H);
      return { map: c, normal: normalFromHeight(h, 2.8), rough: r };
    }

    function texLacquer() {
      const W = 256, H = 256;
      const c = cvs(W, H), x = c.getContext('2d');
      const h = cvs(W, H), hx = h.getContext('2d');
      const r = cvs(W, H), rx = r.getContext('2d');
      x.fillStyle = '#7c1610'; x.fillRect(0, 0, W, H);
      hx.fillStyle = '#808080'; hx.fillRect(0, 0, W, H);
      rx.fillStyle = '#8c8c8c'; rx.fillRect(0, 0, W, H);
      return { map: c, normal: normalFromHeight(h, 2.2), rough: r };
    }

    function texShoji() {
      const W = 512, H = 384, c = cvs(W, H), x = c.getContext('2d');
      x.clearRect(0, 0, W, H);
      x.fillStyle = 'rgba(228,222,206,.07)'; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(10,8,7,.88)';
      const cols = 12, rows = 9;
      x.lineWidth = 4;
      for (let i = 1; i < cols; i++) { x.beginPath(); x.moveTo(W / cols * i, 0); x.lineTo(W / cols * i, H); x.stroke(); }
      for (let j = 1; j < rows; j++) { x.beginPath(); x.moveTo(0, H / rows * j); x.lineTo(W, H / rows * j); x.stroke(); }
      x.lineWidth = 10; x.strokeStyle = 'rgba(8,6,5,.95)';
      x.strokeRect(0, 0, W, H);
      return c;
    }

    function texSky() {
      const W = 256, H = 256, c = cvs(W, H), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgb(6,10,15)');    g.addColorStop(.34, 'rgb(13,22,31)');
      g.addColorStop(.66, 'rgb(17,26,34)'); g.addColorStop(.88, 'rgb(24,35,42)');
      g.addColorStop(1, 'rgb(14,22,28)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      return c;
    }

    function texRoof() {
      const W = 256, H = 256, c = cvs(W, H), x = c.getContext('2d');
      const h = cvs(W, H), hx = h.getContext('2d');
      x.fillStyle = '#151c20'; x.fillRect(0, 0, W, H);
      hx.fillStyle = '#606060'; hx.fillRect(0, 0, W, H);
      const ribs = 10, s = W / ribs;
      for (let i = 0; i < ribs; i++) {
        const g = x.createLinearGradient(i * s, 0, (i + 1) * s, 0);
        g.addColorStop(0, 'rgba(0,0,0,.62)');  g.addColorStop(.30, 'rgba(148,178,192,.13)');
        g.addColorStop(.66, 'rgba(84,110,124,.05)'); g.addColorStop(1, 'rgba(0,0,0,.62)');
        x.fillStyle = g; x.fillRect(i * s, 0, s, H);
      }
      return { map: c, normal: normalFromHeight(h, 2.0) };
    }

    function texMoon() {
      const S = 256, c = cvs(S, S), x = c.getContext('2d');
      const R = S / 2 - 1;
      x.beginPath(); x.arc(S / 2, S / 2, R, 0, TAU); x.closePath();
      x.save(); x.clip();

      // Deep Crimson Blood Moon Base Gradient
      const g = x.createRadialGradient(S * .44, S * .42, S * .06, S / 2, S / 2, R);
      g.addColorStop(0, 'rgb(240, 50, 35)');
      g.addColorStop(0.35, 'rgb(200, 28, 20)');
      g.addColorStop(0.70, 'rgb(140, 15, 10)');
      g.addColorStop(0.95, 'rgb(85, 8, 6)');
      g.addColorStop(1, 'rgb(60, 4, 3)');
      x.fillStyle = g;
      x.fillRect(0, 0, S, S);

      // Lunar Maria (Dark Mare patches across surface)
      x.fillStyle = 'rgba(40, 4, 2, 0.45)';
      const rnd = mulberry32(108);
      for (let i = 0; i < 18; i++) {
        const mx = S * (0.2 + rnd() * 0.6);
        const my = S * (0.2 + rnd() * 0.6);
        const mr = S * (0.06 + rnd() * 0.16);
        x.beginPath();
        x.arc(mx, my, mr, 0, TAU);
        x.fill();
      }

      // Atmospheric Limb Glow Rim
      const rim = x.createRadialGradient(S / 2, S / 2, R * 0.78, S / 2, S / 2, R);
      rim.addColorStop(0, 'rgba(255, 60, 40, 0)');
      rim.addColorStop(0.8, 'rgba(255, 80, 50, 0.35)');
      rim.addColorStop(1, 'rgba(255, 120, 80, 0.75)');
      x.fillStyle = rim;
      x.fillRect(0, 0, S, S);

      x.restore();
      return c;
    }

    function texGlow(inner, mid) {
      const S = 128, c = cvs(S, S), x = c.getContext('2d');
      const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      g.addColorStop(0, inner || 'rgba(255,255,255,1)');
      g.addColorStop(.28, mid || 'rgba(255,255,255,.36)');
      g.addColorStop(.62, 'rgba(255,255,255,.07)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      return c;
    }

    // --- Three.js Scene Setup ---
    const vpW = () => window.innerWidth;
    const vpH = () => window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(vpW(), vpH(), true);
    renderer.setClearColor(0x05070a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050a0e, 0.0165);
    scene.background = new THREE.Color(0x060a0d);

    const camera = new THREE.PerspectiveCamera(48, vpW() / vpH(), 0.35, 250);
    camera.position.set(0, 2.2, 9.5);
    scene.add(camera);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    function tx(canvasEl, o = {}) {
      const t = new THREE.CanvasTexture(canvasEl);
      t.wrapS = t.wrapT = o.wrap || THREE.ClampToEdgeWrapping;
      if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
      t.anisotropy = Math.min(o.aniso || 8, maxAniso);
      t.needsUpdate = true;
      return t;
    }

    const hdr = (r, g, b) => new THREE.Color().setRGB(r, g, b);

    function surface(t, rep, o = {}) {
      const wrap = THREE.RepeatWrapping;
      const m = new THREE.MeshStandardMaterial({
        map: tx(t.map, { wrap, repeat: rep }),
        normalMap: tx(t.normal, { wrap, repeat: rep }),
        normalScale: new THREE.Vector2(o.normal ?? .8, o.normal ?? .8),
        color: o.color ?? 0xffffff,
        roughness: o.roughness ?? 0.8,
        metalness: o.metalness ?? 0.05
      });
      if (t.rough) m.roughnessMap = tx(t.rough, { wrap, repeat: rep });
      return m;
    }

    // Directional Moonlight & Ambient Lights
    const ambientLight = new THREE.AmbientLight(0x18222c, 1.6);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xa3c2db, 2.4);
    moonLight.position.set(0, 24, 6);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    scene.add(moonLight);

    // --- World Building ---
    const PODIUM = 2.8;
    const STEPS = 28;
    const STAIR_Z0 = -10.5;
    const STAIR_RUN = 0.65;
    const STAIR_W = 8.8;
    const TEMPLE_Z = -34.0;

    // Sky backdrop
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(360, 190),
      new THREE.MeshBasicMaterial({ color: hdr(.60, .70, .80), map: tx(texSky()), depthWrite: false, fog: false }));
    sky.position.set(0, 52, -108);
    scene.add(sky);

    // Floor & Podium
    // --- Master Materials & Textures ---
    const fT = texFloor();
    const floorMat = surface(fT, [7, 7], { roughness: 0.65, metalness: 0.15, color: 0x69757a });
    const platMat = surface(fT, [3, 1.2], { roughness: 0.9, metalness: 0.02, color: 0x58636a });

    const stoneMat = surface(texStone(), [1.5, 1.5], { color: 0x9aa5a5 });
    const woodT = texWood(3, { boards: 7 });
    const timberMat = surface(woodT, [4, 1.6], { color: 0x565150 });
    const postMat = surface(woodT, [1, 3], { roughness: 0.85, metalness: 0.05, color: 0x24201e });
    const lacMat = surface(texLacquer(), [2, 2], { color: hdr(1.72, 1.02, .94), roughness: 0.88 });

    const roofT = texRoof();
    const tileMat = surface(roofT, [8, 4], { roughness: 0.72, metalness: 0.22, color: 0x222a30 });
    const paperMat = new THREE.MeshBasicMaterial({ color: hdr(1.6, 0.65, 0.26), fog: true });
    const shojiGridMat = new THREE.MeshBasicMaterial({
      map: tx(texShoji()),
      transparent: true,
      depthWrite: false,
      fog: true
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a040,
      metalness: 0.88,
      roughness: 0.28,
      emissive: 0x664411,
      emissiveIntensity: 0.35
    });

    // --- Geometry Helpers ---
    function mergeGeos(list) {
      let vN = 0, iN = 0;
      list.forEach(g => { vN += g.attributes.position.count; iN += g.index.count; });
      const pos = new Float32Array(vN * 3), nor = new Float32Array(vN * 3), uv = new Float32Array(vN * 2);
      const idx = vN > 65535 ? new Uint32Array(iN) : new Uint16Array(iN);
      let vo = 0, io = 0;
      list.forEach(g => {
        pos.set(g.attributes.position.array, vo * 3);
        nor.set(g.attributes.normal.array, vo * 3);
        uv.set(g.attributes.uv.array, vo * 2);
        const gi = g.index.array;
        for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
        io += gi.length; vo += g.attributes.position.count;
        g.dispose();
      });
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      out.setIndex(new THREE.BufferAttribute(idx, 1));
      return out;
    }

    function sweepPoly(points, profile) {
      const segs = points.length, np = profile.length;
      const pos = [], nor = [], uv = [], idx = [];
      const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < segs; i++) {
        const p = points[i], a = points[Math.max(0, i - 1)], b = points[Math.min(segs - 1, i + 1)];
        T.subVectors(b, a).normalize();
        B.crossVectors(T, up).normalize();
        N.crossVectors(B, T).normalize();
        for (let j = 0; j < np; j++) {
          const u = profile[j][0], v = profile[j][1], l = Math.hypot(u, v) || 1;
          pos.push(p.x + B.x * u + N.x * v, p.y + B.y * u + N.y * v, p.z + B.z * u + N.z * v);
          nor.push(B.x * u / l + N.x * v / l, B.y * u / l + N.y * v / l, B.z * u / l + N.z * v / l);
          uv.push(j / np, i / (segs - 1));
        }
      }
      for (let i = 0; i < segs - 1; i++) for (let j = 0; j < np; j++) {
        const j2 = (j + 1) % np, a = i * np + j, b = i * np + j2, c = (i + 1) * np + j2, d = (i + 1) * np + j;
        idx.push(a, b, c, a, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      return g;
    }

    function roofGeo(A, B, R, Hr, thick, flare) {
      const segX = 24, segZ = 20;
      const pos = [], nor = [], uvs = [], idx = [];

      function evalSurf(u, v, isBottom) {
        const xAbs = Math.abs(u) * A;
        const tz = 1 - Math.abs(v);
        let txRatio = 1;
        if (xAbs > R) {
          txRatio = 1 - (xAbs - R) / Math.max(0.001, A - R);
        }
        const t = Math.max(0, Math.min(txRatio, tz));
        let y = Hr * Math.pow(t, 1.25);
        const eaveDist = 1 - t;
        const cornerFlare = Math.pow(Math.abs(u), 3) * Math.pow(Math.abs(v), 3) * 1.8;
        const edgeFlare = Math.pow(eaveDist, 2.8) * flare * Hr;
        y += (edgeFlare + cornerFlare * flare * Hr);

        if (isBottom) {
          y -= thick * (1.0 - t * 0.4);
        }

        return [u * A, y, v * B];
      }

      // Top Surface
      for (let j = 0; j <= segZ; j++) {
        const v = (j / segZ) * 2 - 1;
        for (let i = 0; i <= segX; i++) {
          const u = (i / segX) * 2 - 1;
          const [x, y, z] = evalSurf(u, v, false);
          pos.push(x, y, z);
          nor.push(0, 1, 0);
          uvs.push((i / segX) * 8, (j / segZ) * 6);
        }
      }
      const stride = segX + 1;
      for (let j = 0; j < segZ; j++) {
        for (let i = 0; i < segX; i++) {
          const a = j * stride + i;
          const b = j * stride + (i + 1);
          const c = (j + 1) * stride + (i + 1);
          const d = (j + 1) * stride + i;
          idx.push(a, b, c, a, c, d);
        }
      }

      // Bottom Surface (Soffit)
      const botVertsStart = pos.length / 3;
      for (let j = 0; j <= segZ; j++) {
        const v = (j / segZ) * 2 - 1;
        for (let i = 0; i <= segX; i++) {
          const u = (i / segX) * 2 - 1;
          const [x, y, z] = evalSurf(u, v, true);
          pos.push(x, y, z);
          nor.push(0, -1, 0);
          uvs.push((i / segX) * 4, (j / segZ) * 3);
        }
      }
      for (let j = 0; j < segZ; j++) {
        for (let i = 0; i < segX; i++) {
          const a = botVertsStart + j * stride + i;
          const b = botVertsStart + j * stride + (i + 1);
          const c = botVertsStart + (j + 1) * stride + (i + 1);
          const d = botVertsStart + (j + 1) * stride + i;
          idx.push(a, c, b, a, d, c);
        }
      }

      // Eaves Fascia Perimeter
      for (let i = 0; i < segX; i++) {
        // North
        idx.push(i, i + 1, botVertsStart + i + 1, i, botVertsStart + i + 1, botVertsStart + i);
        // South
        const tA = segZ * stride + i, tB = segZ * stride + i + 1;
        const bA = botVertsStart + segZ * stride + i, bB = botVertsStart + segZ * stride + i + 1;
        idx.push(tB, tA, bA, tB, bA, bB);
      }
      for (let j = 0; j < segZ; j++) {
        // West
        const tA = j * stride, tB = (j + 1) * stride;
        const bA = botVertsStart + j * stride, bB = botVertsStart + (j + 1) * stride;
        idx.push(tB, tA, bA, tB, bA, bB);
        // East
        const tAe = j * stride + segX, tBe = (j + 1) * stride + segX;
        const bAe = botVertsStart + j * stride + segX, bBe = botVertsStart + (j + 1) * stride + segX;
        idx.push(tAe, tBe, bBe, tAe, bBe, bAe);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    }

    // --- World Elements ---
    // Floor & Podium
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -18);
    floor.receiveShadow = true;
    scene.add(floor);

    const plat = new THREE.Mesh(new THREE.BoxGeometry(42, PODIUM, 26), platMat);
    plat.position.set(0, PODIUM / 2, -42);
    plat.receiveShadow = true;
    scene.add(plat);

    // 28-Step Sanctuary Flight
    const treads = [], cheeks = [];
    for (let i = 0; i < STEPS; i++) {
      const y = (i + 1) * (PODIUM / STEPS), z = STAIR_Z0 - (i + .5) * STAIR_RUN;
      const w = STAIR_W + (STEPS - i) * .045;
      treads.push(new THREE.BoxGeometry(w, PODIUM / STEPS + .04, STAIR_RUN + .04).translate(0, y - (PODIUM / STEPS) / 2, z));
      [-1, 1].forEach(s => cheeks.push(new THREE.BoxGeometry(.9, 1.2, STAIR_RUN + .06).translate(s * (w / 2 + .45), y - .25, z)));
    }
    const stair = new THREE.Mesh(mergeGeos(treads), platMat);
    stair.receiveShadow = true;
    scene.add(stair);

    const cheekMesh = new THREE.Mesh(mergeGeos(cheeks), platMat);
    cheekMesh.receiveShadow = true;
    scene.add(cheekMesh);

    // Majestic Vermilion Blood Moon (Centered Directly Above the Temple on the X-Axis, Raised High in Y)
    const MOON = { x: 0.0, y: 25.5, z: -62, r: 7.8 };
    const moonDisc = new THREE.Mesh(new THREE.PlaneGeometry(MOON.r * 2, MOON.r * 2),
      new THREE.MeshBasicMaterial({ map: tx(texMoon()), color: hdr(2.2, 0.45, 0.35), transparent: true, depthWrite: false, fog: false }));
    moonDisc.position.set(MOON.x, MOON.y, MOON.z);
    scene.add(moonDisc);

    const moonHalo = new THREE.Mesh(new THREE.PlaneGeometry(MOON.r * 5.5, MOON.r * 5.5),
      new THREE.MeshBasicMaterial({ map: tx(texGlow('rgba(255,40,25,.95)', 'rgba(180,15,10,.35)')), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: .65 }));
    moonHalo.position.set(MOON.x, MOON.y, MOON.z - .3);
    scene.add(moonHalo);

    // Weathered Vermilion Torii Gate
    const toriiGroup = new THREE.Group();
    const TORII_BASE = 0.78, TORII_H = 7.6, TORII_SPAN = 3.55;

    // 1. Vertical Pillars (Hashira) with Top Capitals (Daiwa) and Base Collars (Nemawashi)
    [-1, 1].forEach(s => {
      // Main Pillar
      const col = new THREE.Mesh(new THREE.CylinderGeometry(.32, .40, TORII_H, 20), lacMat);
      col.position.set(s * TORII_SPAN, TORII_BASE + TORII_H / 2, 0);
      col.castShadow = true;
      toriiGroup.add(col);

      // Base Protective Plinth / Collar (Nemawashi)
      const nemawashi = new THREE.Mesh(new THREE.CylinderGeometry(.42, .46, 1.2, 20), postMat);
      nemawashi.position.set(s * TORII_SPAN, TORII_BASE + 0.6, 0);
      nemawashi.castShadow = true;
      toriiGroup.add(nemawashi);

      // Top Capital Ring (Daiwa) Connecting Directly to Lintel
      const daiwa = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, 0.24, 20), lacMat);
      daiwa.position.set(s * TORII_SPAN, TORII_BASE + TORII_H + 0.10, 0);
      daiwa.castShadow = true;
      toriiGroup.add(daiwa);
    });

    // 2. Lower Crossbeam (Nuki) Penetrating the Pillars
    const nukiBeam = new THREE.Mesh(new THREE.BoxGeometry(9.4, .48, .44), lacMat);
    nukiBeam.position.set(0, TORII_BASE + TORII_H - 1.6, 0);
    nukiBeam.castShadow = true;
    toriiGroup.add(nukiBeam);

    // Locking Wedges (Kusabi) on either side of pillars
    [-1, 1].forEach(s => {
      const kusabi = new THREE.Mesh(new THREE.BoxGeometry(.12, .64, .52), lacMat);
      kusabi.position.set(s * (TORII_SPAN + (s > 0 ? .38 : -.38)), TORII_BASE + TORII_H - 1.6, 0);
      toriiGroup.add(kusabi);
    });

    // 3. Central Vertical Strut (Gakuzuka) Supporting the Plaque & Shimaki
    const gakuzuka = new THREE.Mesh(new THREE.BoxGeometry(.50, 1.6, .38), lacMat);
    gakuzuka.position.set(0, TORII_BASE + TORII_H - 0.75, 0);
    gakuzuka.castShadow = true;
    toriiGroup.add(gakuzuka);

    // 4. Sub-Lintel Beam (Shimaki) Resting Directly on Pillar Capitals
    const shimakiBeam = new THREE.Mesh(new THREE.BoxGeometry(9.8, .46, .64), lacMat);
    shimakiBeam.position.set(0, TORII_BASE + TORII_H + 0.35, 0);
    shimakiBeam.castShadow = true;
    toriiGroup.add(shimakiBeam);

    // 5. Sweeping Flared Top Lintel (Kasagi) Attached Flush Atop the Shimaki
    function beamPath(half, rise, power) {
      const p = [];
      for (let i = 0; i <= 20; i++) {
        const u = i / 20 * 2 - 1;
        p.push(new THREE.Vector3(u * half, Math.pow(Math.abs(u), power) * rise, 0));
      }
      return p;
    }
    const kasagiBeam = new THREE.Mesh(sweepPoly(beamPath(5.4, .48, 2.2),
      [[-.44, -.16], [.44, -.16], [.48, .12], [.32, .34], [-.32, .34], [-.48, .12]]), lacMat);
    kasagiBeam.position.set(0, TORII_BASE + TORII_H + 0.72, 0);
    kasagiBeam.castShadow = true;
    toriiGroup.add(kasagiBeam);

    const GS = 0.72;
    toriiGroup.position.set(0, -TORII_BASE * GS, -8.6);
    toriiGroup.scale.setScalar(GS);
    scene.add(toriiGroup);

    // 6 Sculpted Japanese Stone Lanterns (Tōrō) with Glowing Firebox Cores
    const lanternLights = [];
    const lanternGlows = [];

    function buildLantern(x, z, s = 1, y = 0) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.44, .52, .26, 16), stoneMat);
      base.position.y = .13; g.add(base);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.15, .18, 1.02, 12), stoneMat);
      post.position.y = .77; g.add(post);
      const shelf = new THREE.Mesh(new THREE.CylinderGeometry(.42, .34, .13, 16), stoneMat);
      shelf.position.y = 1.34; g.add(shelf);

      const box = new THREE.Mesh(new THREE.BoxGeometry(.50, .50, .50), timberMat);
      box.position.y = 1.66; g.add(box);

      const paneMat = new THREE.MeshBasicMaterial({ color: hdr(2.3, .30, .085), fog: false });
      [[0, 0, .256, 0], [0, 0, -.256, Math.PI], [.256, 0, 0, Math.PI / 2], [-.256, 0, 0, -Math.PI / 2]].forEach(p => {
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), paneMat);
        pane.position.set(p[0], 1.66, p[2]); pane.rotation.y = p[3]; g.add(pane);
      });

      const roof = new THREE.Mesh(new THREE.CylinderGeometry(.10, .62, .34, 4, 1), stoneMat);
      roof.position.y = 2.06; roof.rotation.y = Math.PI / 4; g.add(roof);

      const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4),
        new THREE.MeshBasicMaterial({ map: tx(texGlow('rgba(255,120,60,.9)', 'rgba(255,60,24,.28)')),
          transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: .5 }));
      glow.position.y = 1.66; g.add(glow);
      lanternGlows.push(glow);

      const lt = new THREE.PointLight(0xff5a24, 3.4, 12, 1.8);
      lt.position.set(0, 1.66, 0); g.add(lt);
      lanternLights.push(lt);

      g.position.set(x, y, z);
      g.scale.setScalar(s);
      scene.add(g);
    }

    buildLantern(-3.8, -1.8, 0.95);
    buildLantern(3.8, -1.8, 0.95);
    buildLantern(-4.8, -11.0, 1.15, 0.2);
    buildLantern(4.8, -11.0, 1.15, 0.2);
    buildLantern(-6.2, -22.0, 1.25, 1.6);
    buildLantern(6.2, -22.0, 1.25, 1.6);

    // ==============================================================
    // ⛩️ MAJESTIC KYOTO TEMPLE SANCTUARY (SANMON WORSHIP HALL)
    // ==============================================================
    const templeGroup = new THREE.Group();

    // 1. Ground Sanctuary Hall
    const groundHall = new THREE.Mesh(new THREE.BoxGeometry(16.4, 4.8, 10.0), timberMat);
    groundHall.position.set(0, PODIUM + 2.4, 0);
    groundHall.castShadow = true;
    groundHall.receiveShadow = true;
    templeGroup.add(groundHall);

    // 2. 5 Glowing Shoji Window & Sliding Screen Bays
    const shojiXs = [-4.8, -2.4, 0, 2.4, 4.8];
    shojiXs.forEach(sx => {
      // Warm Paper Backing
      const paperMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 3.2), paperMat);
      paperMesh.position.set(sx, PODIUM + 2.2, 5.03);
      templeGroup.add(paperMesh);

      // Shoji Lattice Overlay
      const gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 3.2), shojiGridMat);
      gridMesh.position.set(sx, PODIUM + 2.2, 5.06);
      templeGroup.add(gridMesh);
    });

    // 3. 6 Charred Cedar Porch Columns (Entasis)
    const colXs = [-6.0, -3.6, -1.2, 1.2, 3.6, 6.0];
    colXs.forEach(cx => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 4.6, 16), postMat);
      col.position.set(cx, PODIUM + 2.3, 5.25);
      col.castShadow = true;
      templeGroup.add(col);

      // Stone Base Plinth
      const colBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.3, 14), stoneMat);
      colBase.position.set(cx, PODIUM + 0.15, 5.25);
      templeGroup.add(colBase);
    });

    // 4. Bracket Complex & Lintel Beams (Kumimono / Dougong)
    const lintelBeam = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.44, 0.65), lacMat);
    lintelBeam.position.set(0, PODIUM + 4.65, 5.25);
    lintelBeam.castShadow = true;
    templeGroup.add(lintelBeam);

    const subBeam = new THREE.Mesh(new THREE.BoxGeometry(17.2, 0.32, 0.5), postMat);
    subBeam.position.set(0, PODIUM + 4.3, 5.25);
    templeGroup.add(subBeam);

    // 5. Lower Flared Pagoda Roof
    const lowerRoof = new THREE.Mesh(roofGeo(10.2, 6.8, 3.4, 2.7, 0.40, 0.28), tileMat);
    lowerRoof.position.set(0, PODIUM + 4.8, 0);
    lowerRoof.castShadow = true;
    templeGroup.add(lowerRoof);

    // 6. Upper Hall Storey & Balcony Gallery
    const upperHall = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.0, 5.8), timberMat);
    upperHall.position.set(0, PODIUM + 7.6, 0);
    upperHall.castShadow = true;
    templeGroup.add(upperHall);

    // Upper Balcony Railing
    const rail = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.6, 6.6), lacMat);
    rail.position.set(0, PODIUM + 6.3, 0);
    rail.castShadow = true;
    templeGroup.add(rail);

    // Upper 3 Shoji Bays
    [-2.4, 0, 2.4].forEach(ux => {
      const upPaper = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.0), paperMat);
      upPaper.position.set(ux, PODIUM + 7.6, 2.93);
      templeGroup.add(upPaper);

      const upGrid = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.0), shojiGridMat);
      upGrid.position.set(ux, PODIUM + 7.6, 2.96);
      templeGroup.add(upGrid);
    });

    // Golden Sanctuary Calligraphy Plaque (額 Gaku)
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.14), goldMat);
    plaque.position.set(0, PODIUM + 8.4, 3.02);
    templeGroup.add(plaque);

    const plaqueBorder = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 0.1), lacMat);
    plaqueBorder.position.set(0, PODIUM + 8.4, 2.97);
    templeGroup.add(plaqueBorder);

    // 7. Grand Crowning Flared Hip-and-Gable Roof (Irimoya)
    const upperRoof = new THREE.Mesh(roofGeo(11.2, 7.4, 3.8, 4.4, 0.50, 0.28), tileMat);
    upperRoof.position.set(0, PODIUM + 9.2, 0);
    upperRoof.castShadow = true;
    templeGroup.add(upperRoof);

    // 8. Top Ridge Cap & Onigawara Finials
    const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.42, 0.48), lacMat);
    ridgeCap.position.set(0, PODIUM + 13.6, 0);
    templeGroup.add(ridgeCap);

    [-3.9, 3.9].forEach(rx => {
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 4), lacMat);
      finial.position.set(rx, PODIUM + 14.0, 0);
      finial.rotation.z = rx > 0 ? -0.4 : 0.4;
      templeGroup.add(finial);
    });

    // 9. Warm Amber Sanctuary Light & Volumetric Radiance Spill
    const templeInteriorLight = new THREE.PointLight(0xff7a28, 5.2, 28, 1.6);
    templeInteriorLight.position.set(0, PODIUM + 2.8, 2.5);
    templeGroup.add(templeInteriorLight);

    const templeAura = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 7.5),
      new THREE.MeshBasicMaterial({
        map: tx(texGlow('rgba(255,140,50,0.85)', 'rgba(255,70,20,0.18)')),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        opacity: 0.65
      })
    );
    templeAura.position.set(0, PODIUM + 2.6, 5.2);
    templeGroup.add(templeAura);

    // Place Temple on the Upper Sacred Terrace
    templeGroup.position.set(0, 0, TEMPLE_Z);
    scene.add(templeGroup);

    // ==============================================================
    // 🌲 STYLIZED NATURE GLB 3D MODEL LOADER INTEGRATION & CACHING
    // ==============================================================
    const loadingManager = new THREE.LoadingManager();
    const phaseCaptions = [
      'AWAKENING THE SACRED SANCTUARY',
      'FORGING THE BLOOD MOON',
      'RAISING THE MOUNTAIN TEMPLE',
      'GATHERING SAKURA BLOSSOMS',
      'TUNING THE SKYLINE GT-R',
      'ILLUMINATING STONE LANTERNS',
      'PREPARING THE PATH'
    ];

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const pct = Math.round((itemsLoaded / itemsTotal) * 100);
      const phaseIdx = Math.min(Math.floor((itemsLoaded / itemsTotal) * phaseCaptions.length), phaseCaptions.length - 1);
      if (onProgress) onProgress(pct, phaseCaptions[phaseIdx]);
    };

    loadingManager.onLoad = () => {
      if (onProgress) onProgress(100, 'ENTERING THE SANCTUARY');
      if (onLoaded) onLoaded();
    };

    const gltfLoader = new GLTFLoader(loadingManager);
    const swayMeshes = [];
    const modelCache = new Map();

    const loadGLBModel = (path, x, y, z, scale = 1, rotY = 0, canSway = false, emissiveColor = null) => {
      const applyInstance = (baseScene) => {
        if (isDisposed) return;
        const model = baseScene.clone(true);
        model.position.set(x, y, z);
        model.scale.setScalar(scale);
        model.rotation.y = rotY;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (emissiveColor && child.material) {
              child.material = child.material.clone();
              child.material.emissive = new THREE.Color(emissiveColor);
              child.material.emissiveIntensity = 0.6;
            }
          }
        });

        scene.add(model);

        if (canSway) {
          swayMeshes.push({
            model,
            origRotZ: model.rotation.z,
            speed: 1.0 + Math.random() * 0.8,
            phase: Math.random() * TAU,
            amp: 0.025 + Math.random() * 0.02
          });
        }
      };

      if (modelCache.has(path)) {
        applyInstance(modelCache.get(path));
      } else {
        gltfLoader.load(
          path,
          (gltf) => {
            modelCache.set(path, gltf.scene);
            applyInstance(gltf.scene);
          },
          undefined,
          (err) => console.warn('GLB load error for:', path, err)
        );
      }
    };

    // ==============================================================
    // 🏎️ NISSAN SKYLINE R34 GT-R 3D CAR (HIGH-PERFORMANCE BINARY GLB)
    // ==============================================================
    gltfLoader.load(
      '/models/custom/skyline.glb',
      (gltf) => {
        if (isDisposed) return;
        const carObj = gltf.scene;
        // Positioned prominently on the left courtyard next to the sacred path
        carObj.position.set(-5.6, 0.08, -1.8);
        carObj.scale.setScalar(1.16);
        carObj.rotation.set(0, 0.38, 0);

        carObj.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mtlName = (child.material && child.material.name) ? child.material.name.toLowerCase() : '';
            const meshName = child.name.toLowerCase();

            // Headlights & Crystal Front Lamps
            if (mtlName.includes('fara.001') || mtlName.includes('fara_pered') || mtlName.includes('fara.005') || meshName.includes('fara')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xdbeafe,
                emissiveIntensity: 4.0,
                roughness: 0.1,
                metalness: 0.2
              });
            }
            // Taillights (Glowing Ruby LED rings)
            else if (mtlName.includes('fara.003') || mtlName.includes('fara.004') || mtlName.includes('fara.006')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x880005,
                emissive: 0xff0022,
                emissiveIntensity: 3.5,
                roughness: 0.1,
                metalness: 0.1
              });
            }
            // Glass & Tinted Windshield
            else if (mtlName.includes('glass') || mtlName.includes('steklo')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x060c18,
                roughness: 0.08,
                metalness: 0.95,
                opacity: 0.78,
                transparent: true
              });
            }
            // Wheels / Rims / Chrome Badges / Mirror
            else if (mtlName.includes('disk') || mtlName.includes('mirror') || mtlName.includes('nissan')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xd4d4d8,
                metalness: 0.95,
                roughness: 0.18
              });
            }
            // Tires / Vulcanized Rubber
            else if (mtlName.includes('shina') || mtlName.includes('rezinka')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x18181b,
                roughness: 0.92,
                metalness: 0.05
              });
            }
            // Japanese Sakura Vinyl & Livery Decals
            else if (mtlName.includes('сакура') || mtlName.includes('ичиго') || mtlName.includes('bukvi')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xf472b6,
                emissive: 0xec4899,
                emissiveIntensity: 0.45,
                roughness: 0.35,
                metalness: 0.15
              });
            }
            // High Gloss Obsidian Midnight Lacquer Body with subtle metallic sheen
            else {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x111827,
                metalness: 0.88,
                roughness: 0.2
              });
            }
          }
        });

        // Car Headlights Casting Xenon Light onto stone courtyard
        const headlightLeft = new THREE.SpotLight(0xdbeafe, 6.0, 20, Math.PI / 5, 0.4, 1.2);
        headlightLeft.position.set(-4.2, 0.8, 2.2);
        headlightLeft.target.position.set(-1.5, 0, 8.0);
        scene.add(headlightLeft);
        scene.add(headlightLeft.target);

        const headlightRight = new THREE.SpotLight(0xdbeafe, 6.0, 20, Math.PI / 5, 0.4, 1.2);
        headlightRight.position.set(-3.6, 0.8, 1.2);
        headlightRight.target.position.set(-0.5, 0, 7.5);
        scene.add(headlightRight);
        scene.add(headlightRight.target);

        // Subtle Ruby Taillight Ambient Glow behind the car
        const taillightGlow = new THREE.PointLight(0xff1e2e, 2.5, 8);
        taillightGlow.position.set(-5.8, 0.9, -2.2);
        scene.add(taillightGlow);

        // Underglow neon reflection on the ground
        const underglow = new THREE.PointLight(0xec4899, 2.5, 6);
        underglow.position.set(-5.0, 0.25, 0.2);
        scene.add(underglow);

        scene.add(carObj);
      },
      undefined,
      (err) => console.warn('Car GLB load error:', err)
    );

    // ==============================================================
    // ⚔️ LEGENDARY SAMURAI WARRIOR (POSITIONED ON TEMPLE TERRACE)
    // ==============================================================
    gltfLoader.load(
      '/models/custom/samurai.glb',
      (gltf) => {
        if (isDisposed) return;
        const samurai = gltf.scene;

        // Dynamic Stance Posing Algorithm (Converts T-Pose to Cinematic Katana Warrior Stance)
        const poseArmVertex = (x, y, z) => {
          // Left Arm -> Hand Resting on Katana Hilt
          if (x > 0.42 && z > 3.0 && z < 4.15) {
            const shX = 0.45, shY = 0.35, shZ = 3.68;
            const elX = 1.35, elY = 0.35, elZ = 3.65;
            
            if (x > elX) {
              const dx = x - elX, dy = y - elY, dz = z - elZ;
              const newElX = 0.76, newElY = 0.52, newElZ = 3.05;
              const rx = -dx * 0.45 - dz * 0.15;
              const ry = dx * 0.52 + dy;
              const rz = -dx * 0.72 + dz;
              return [newElX + rx, newElY + ry, newElZ + rz];
            } else {
              const dx = x - shX, dy = y - shY, dz = z - shZ;
              const targetX = shX + dx * 0.40;
              const targetY = shY + dy + dx * 0.25;
              const targetZ = shZ + dz - dx * 0.78;
              return [targetX, targetY, targetZ];
            }
          }
          
          // Right Arm -> Relaxed Ready Stance along the flank
          if (x < -0.42 && z > 3.0 && z < 4.15) {
            const shX = -0.45, shY = 0.35, shZ = 3.68;
            const elX = -1.35, elY = 0.35, elZ = 3.65;
            
            if (x < elX) {
              const dx = Math.abs(x - elX), dy = y - elY, dz = z - elZ;
              const newElX = -0.66, newElY = 0.38, newElZ = 2.85;
              const rx = -dx * 0.15;
              const ry = dy + dx * 0.22;
              const rz = dz - dx * 0.88;
              return [newElX + rx, newElY + ry, newElZ + rz];
            } else {
              const dx = Math.abs(x - shX), dy = y - shY, dz = z - shZ;
              const targetX = shX - dx * 0.25;
              const targetY = shY + dy + dx * 0.05;
              const targetZ = shZ + dz - dx * 0.90;
              return [targetX, targetY, targetZ];
            }
          }

          return [x, y, z];
        };

        const armMeshes = ['lp', 'lowpolyshirt', 'forearmprotection', 'forearmprotection001'];

        // Positioned centrally on the temple terrace in front of the illuminated Shoji screens
        samurai.position.set(0.0, PODIUM + 0.05, TEMPLE_Z + 5.6);
        samurai.scale.setScalar(0.58);
        samurai.rotation.set(-Math.PI / 2, 0, 0);

        samurai.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const name = child.name.toLowerCase();

            // Transform arm vertices from T-pose into folded warrior stance
            if (armMeshes.some(m => name.includes(m)) && child.geometry && child.geometry.attributes.position) {
              const pos = child.geometry.attributes.position;
              for (let i = 0; i < pos.count; i++) {
                const [nx, ny, nz] = poseArmVertex(pos.getX(i), pos.getY(i), pos.getZ(i));
                pos.setXYZ(i, nx, ny, nz);
              }
              pos.needsUpdate = true;
              child.geometry.computeVertexNormals();
            }

            // Gold Helmet Crest & Ornaments
            if (name.includes('helmetdeko') || name.includes('deko')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xeab308,
                metalness: 0.92,
                roughness: 0.18,
                emissive: 0x854d0e,
                emissiveIntensity: 0.3
              });
            }
            // Kabuto Helmet & Iron Armor Plates
            else if (name.includes('helmet') || name.includes('chestplate') || name.includes('plateholder') || name.includes('protection')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x18181b, // Jet Black Lacquered Armor
                metalness: 0.85,
                roughness: 0.22
              });
            }
            // Katana Blade & Edge
            else if (name.includes('nurbspath') || name.includes('plane') || name.includes('sword') || name.includes('blade')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                metalness: 0.98,
                roughness: 0.1,
                emissive: 0xffffff,
                emissiveIntensity: 0.15
              });
            }
            // Glowing Focused Warrior Eyes
            else if (name.includes('eye')) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xffedd5,
                emissive: 0xf97316,
                emissiveIntensity: 2.2,
                roughness: 0.1
              });
            }
            // Kimono / Robes / Fabric
            else {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x0f172a, // Deep Indigo Midnight Silk
                roughness: 0.85,
                metalness: 0.08
              });
            }
          }
        });

        // Dedicated Cinematic Silhouette Rim Light for Samurai
        const samuraiRimLight = new THREE.PointLight(0xffedd5, 3.8, 12, 1.4);
        samuraiRimLight.position.set(0.0, PODIUM + 2.8, TEMPLE_Z + 6.8);
        scene.add(samuraiRimLight);

        // Subtle Backlight from Shoji screen highlighting armor contours
        const samuraiBacklight = new THREE.PointLight(0xff6b2b, 4.2, 8, 1.2);
        samuraiBacklight.position.set(0.0, PODIUM + 2.2, TEMPLE_Z + 4.2);
        scene.add(samuraiBacklight);

        // Dramatic Face & Kabuto Helmet Key Light
        const samuraiFaceLight = new THREE.PointLight(0xffecc8, 2.8, 7, 1.5);
        samuraiFaceLight.position.set(0.0, 5.35, TEMPLE_Z + 7.8);
        scene.add(samuraiFaceLight);

        scene.add(samurai);
      },
      undefined,
      (err) => console.warn('Samurai GLB load error:', err)
    );

    // ==============================================================
    // 🌸 MAJESTIC SAKURA CHERRY BLOSSOM TREES (CACHED PRELOADING)
    // ==============================================================
    const loadSakuraTree = (x, y, z, scale = 1.4, rotY = 0) => {
      const applySakuraInstance = (baseTree) => {
        if (isDisposed) return;
        const tree = baseTree.clone(true);
        tree.position.set(x, y, z);
        tree.scale.setScalar(scale);
        tree.rotation.y = rotY;

        scene.add(tree);

        swayMeshes.push({
          model: tree,
          origRotZ: tree.rotation.z,
          speed: 0.8 + Math.random() * 0.5,
          phase: Math.random() * TAU,
          amp: 0.02 + Math.random() * 0.015
        });
      };

      const path = '/models/custom/sakura.glb';
      if (modelCache.has(path)) {
        applySakuraInstance(modelCache.get(path));
      } else {
        gltfLoader.load(
          path,
          (gltf) => {
            const tree = gltf.scene;
            tree.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  if (child.name.toLowerCase().includes('brunch') || child.name.toLowerCase().includes('leaf') || child.name.toLowerCase().includes('plane')) {
                    child.material = child.material.clone();
                    child.material.emissive = new THREE.Color(0xf472b6);
                    child.material.emissiveIntensity = 0.32;
                  }
                }
              }
            });
            modelCache.set(path, tree);
            applySakuraInstance(tree);
          },
          undefined,
          (err) => console.warn('Sakura GLB load error:', err)
        );
      }
    };

    // Flanking Sakura Trees across the Courtyard & Sanctuary
    // Left side:
    loadSakuraTree(-8.2, 0, -4.5, 1.6, 0.35);   // Behind the Skyline car
    loadSakuraTree(-6.6, 0, 2.8, 1.4, -0.6);    // Left foreground framing
    loadSakuraTree(-9.2, 1.6, -17.5, 1.75, 0.8); // Mid-sanctuary stone stairway

    // Right side:
    loadSakuraTree(7.6, 0, -4.5, 1.5, -0.4);    // Right courtyard framing the Blood Moon
    loadSakuraTree(6.6, 0, 2.4, 1.35, 0.5);     // Right foreground
    loadSakuraTree(9.0, 1.6, -18.5, 1.7, -0.7);  // Right terrace framing the Sanmon temple

    // 1. Majestic Stylized Twisted Trees & Pines (Flanking the Courtyard & Framing the Sanctuary)
    loadGLBModel('/models/nature/Twisted Tree.glb', -8.8, 0, -1.0, 1.25, 0.4, true);
    loadGLBModel('/models/nature/Twisted Tree-GVTsMmuzv7.glb', 8.6, 0, -2.8, 1.15, -0.6, true);
    loadGLBModel('/models/nature/Pine.glb', -9.6, 0.2, -14.0, 1.35, 0.2, true);
    loadGLBModel('/models/nature/Pine-699sFuLCN2.glb', 10.2, 0.2, -16.0, 1.35, 1.1, true);
    loadGLBModel('/models/nature/Pine-79gmlLnweB.glb', -10.2, 1.8, -26.0, 1.45, -0.4, true);
    loadGLBModel('/models/nature/Pine-rfnxJv0Rqa.glb', 10.8, 1.8, -28.0, 1.45, 0.8, true);

    // 2. Stylized Flowering Bushes, Ferns & Foliage (Framing & Plinths)
    loadGLBModel('/models/nature/Bush with Flowers.glb', -7.2, 0, -1.2, 0.95, 0.3, true);
    loadGLBModel('/models/nature/Bush with Flowers.glb', 5.4, 0, -1.2, 0.95, -0.5, true);
    loadGLBModel('/models/nature/Bush.glb', -6.8, 0, -2.8, 0.8, 0.7, true);
    loadGLBModel('/models/nature/Bush.glb', 3.6, 0, -3.2, 0.8, -0.4, true);
    loadGLBModel('/models/nature/Fern.glb', -6.5, 0, -0.8, 1.0, 0.5, true);
    loadGLBModel('/models/nature/Fern.glb', 4.2, 0, -1.4, 1.0, -0.8, true);
    loadGLBModel('/models/nature/Plant Big.glb', -5.6, 0.2, -11.5, 0.95, 0.2, true);
    loadGLBModel('/models/nature/Plant Big.glb', 5.6, 0.2, -11.5, 0.95, -0.3, true);
    loadGLBModel('/models/nature/Tall Grass.glb', -6.2, 0, 1.2, 1.1, 0.1, true);
    loadGLBModel('/models/nature/Tall Grass.glb', 3.6, 0, 0.2, 1.1, -0.2, true);

    // 3. Mossy Boulders & Stepping Stones
    loadGLBModel('/models/nature/Rock Medium.glb', -7.0, 0, -0.6, 1.1, 0.5);
    loadGLBModel('/models/nature/Rock Medium.glb', 6.0, 0, -0.6, 1.1, -0.9);
    loadGLBModel('/models/nature/Rock Path Round Small.glb', -2.4, 0.05, 1.2, 1.2, 0.4);
    loadGLBModel('/models/nature/Rock Path Round Small.glb', 2.4, 0.05, 1.2, 1.2, -0.3);
    loadGLBModel('/models/nature/Pebble Round.glb', -3.2, 0.02, -0.2, 1.3, 0.6);
    loadGLBModel('/models/nature/Pebble Round.glb', 3.2, 0.02, -0.2, 1.3, -0.5);

    // 4. Bioluminescent Glowing Mushrooms & Sacred Flower Clusters
    loadGLBModel('/models/nature/Mushroom.glb', -3.4, 0, -1.2, 1.2, 0.4, false, 0x34d399);
    loadGLBModel('/models/nature/Mushroom Laetiporus.glb', 3.5, 0, -1.2, 1.2, -0.6, false, 0xff7043);
    loadGLBModel('/models/nature/Flower Group.glb', -4.5, 0, -2.4, 1.0, 0.2, true);
    loadGLBModel('/models/nature/Flower Group.glb', 4.5, 0, -2.4, 1.0, -0.4, true);

    // 🌸 Falling Sakura Petals Particle Cloud
    const petalCount = 180;
    const petalPos = new Float32Array(petalCount * 3);
    const petalSeed = new Float32Array(petalCount * 3);
    const rndPetal = mulberry32(108);

    for (let i = 0; i < petalCount; i++) {
      petalPos[i * 3] = (rndPetal() - .5) * 30;
      petalPos[i * 3 + 1] = rndPetal() * 12;
      petalPos[i * 3 + 2] = -24 + rndPetal() * 34;
      petalSeed[i * 3] = 0.4 + rndPetal() * 0.6; // fall speed
      petalSeed[i * 3 + 1] = rndPetal() * TAU;  // rotation phase
      petalSeed[i * 3 + 2] = 0.5 + rndPetal() * 0.8; // drift speed
    }
    const petalGeo = new THREE.BufferGeometry();
    petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
    const petalMat = new THREE.PointsMaterial({
      size: 0.2,
      map: tx(texGlow('rgba(255,182,193,1)', 'rgba(244,114,182,0.4)')),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffb7c5
    });
    const petalsMesh = new THREE.Points(petalGeo, petalMat);
    scene.add(petalsMesh);

    // Rising Embers Particle Cloud
    const emberCount = 260;
    const emberPos = new Float32Array(emberCount * 3);
    const emberSeed = new Float32Array(emberCount);
    const rndEmber = mulberry32(66);

    for (let i = 0; i < emberCount; i++) {
      emberPos[i * 3] = (rndEmber() - .5) * 32;
      emberPos[i * 3 + 1] = rndEmber() * 12;
      emberPos[i * 3 + 2] = -28 + rndEmber() * 38;
      emberSeed[i] = rndEmber();
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const emberMat = new THREE.PointsMaterial({
      size: 0.17,
      map: tx(texGlow('rgba(255,190,140,1)', 'rgba(255,120,60,.35)')),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffaa55
    });
    const embersMesh = new THREE.Points(emberGeo, emberMat);
    scene.add(embersMesh);

    // Mouse & Smooth Scroll Inertia Listeners
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetScrollProgress = 0;
    let smoothScrollProgress = 0;

    const onMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onScroll = () => {
      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      const curScroll = window.scrollY || document.documentElement.scrollTop;
      targetScrollProgress = sat(curScroll / maxScroll);
    };

    const onResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = vpW() / vpH();
      camera.updateProjectionMatrix();
      renderer.setSize(vpW(), vpH(), true);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Initial scroll position calculation
    onScroll();
    smoothScrollProgress = targetScrollProgress;

    // Dynamic Multi-Movement Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // High-precision exponential damping for silky-smooth camera inertia
      const scrollDamping = 1.0 - Math.exp(-3.8 * dt);
      smoothScrollProgress += (targetScrollProgress - smoothScrollProgress) * scrollDamping;

      const mouseDamping = 1.0 - Math.exp(-3.2 * dt);
      mouseX += (targetMouseX - mouseX) * mouseDamping;
      mouseY += (targetMouseY - mouseY) * mouseDamping;

      const p = smoothScrollProgress;

      // Subtle organic floating drone breathing (gentle hover on hero)
      const idleFloatY = Math.sin(elapsed * 0.45) * 0.05 * (1.0 - p * 0.7);
      const idleFloatX = Math.sin(elapsed * 0.35) * 0.06 * (1.0 - p * 0.7);

      // Multi-Act Choreographed Camera Path (Z: 9.5 -> -25.2)
      // Act 0: Wide establishing -> Act 1: Torii passage & Skyline glance -> Act 2: Staircase ascent -> Act 3: Samurai Face Confrontation
      const curveX = Math.sin(p * Math.PI) * -0.65 * (1.0 - p * 0.5); // subtle sweeping curve toward car then centering
      const camX = mouseX * (0.42 - p * 0.2) + idleFloatX + curveX;
      
      // Vertical flight climbing the 28 stairs and elevating to the Samurai's face level
      const stairElevation = smooth(0.35, 0.90, p) * 2.95;
      const camY = 2.30 + stairElevation - mouseY * 0.16 + idleFloatY;
      
      // Smooth continuous forward flight along the sacred avenue to face level
      const camZ = 9.5 - p * 34.6; // arrives directly in front of Samurai's face at z: -25.1
      camera.position.set(camX, camY, camZ);

      // Dynamic Look-At Target (Smoothly tracks along path -> locks squarely onto Samurai's face and eyes)
      const lookTargetX = mouseX * 0.12 * (1.0 - p * 0.6);
      const lookTargetY = 3.5 + smooth(0.28, 0.92, p) * 1.82; // locks right at Y: 5.32 (eyes/Kabuto crest)
      const lookTargetZ = -18.0 - p * 10.4; // locks onto temple center / Samurai at -28.4
      camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

      // Dynamic Focal Length (50 deg wide angle -> 40 deg compressed heroic portrait perspective on top)
      camera.fov = 50.0 - p * 10.0;
      camera.updateProjectionMatrix();

      // Lantern Flame Flickering
      lanternLights.forEach((lt, i) => {
        const flick = Math.sin(elapsed * 5.4 + i * 1.9) * 0.45 + Math.cos(elapsed * 11.7 + i * 3.1) * 0.25;
        lt.intensity = 3.2 + flick;
        if (lanternGlows[i]) {
          lanternGlows[i].lookAt(camera.position);
          lanternGlows[i].scale.setScalar(1 + flick * 0.08);
        }
      });

      // 🌸 Sakura Blossom Petal Drift Animation
      const petArr = petalGeo.attributes.position.array;
      for (let i = 0; i < petalCount; i++) {
        petArr[i * 3 + 1] -= (petalSeed[i * 3] * 0.7) * dt; // gentle fall
        petArr[i * 3] += Math.sin(elapsed * 0.7 + petalSeed[i * 3 + 1]) * dt * 0.45 - (dt * 0.2); // wind drift left
        petArr[i * 3 + 2] += Math.cos(elapsed * 0.5 + petalSeed[i * 3 + 1]) * dt * 0.35;

        if (petArr[i * 3 + 1] < 0.05) {
          petArr[i * 3 + 1] = 11.5;
          petArr[i * 3] = (Math.random() - 0.5) * 30;
          petArr[i * 3 + 2] = -24 + Math.random() * 34;
        }
      }
      petalGeo.attributes.position.needsUpdate = true;

      // Ember Particle Float Turbulence
      const pArr = emberGeo.attributes.position.array;
      for (let i = 0; i < emberCount; i++) {
        pArr[i * 3 + 1] += (0.22 + emberSeed[i] * 0.38) * dt * 2.2;
        pArr[i * 3] += Math.sin(elapsed * 0.9 + emberSeed[i] * 14.0) * dt * 0.35;
        pArr[i * 3 + 2] += Math.cos(elapsed * 0.7 + emberSeed[i] * 12.0) * dt * 0.25;

        if (pArr[i * 3 + 1] > 14.0) {
          pArr[i * 3 + 1] = 0.1;
          pArr[i * 3] = (Math.random() - 0.5) * 32;
          pArr[i * 3 + 2] = -28 + Math.random() * 38;
        }
      }
      emberGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      id="gl" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
        pointerEvents: 'none'
      }} 
    />
  );
}
