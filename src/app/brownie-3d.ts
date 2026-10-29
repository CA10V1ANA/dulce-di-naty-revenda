import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Modelo 3D do brownie embalado da Dulce di Naty:
 * bloco de brownie + filme plástico + cinta de rótulo (frente, topo, verso e base),
 * com as laterais abertas mostrando o brownie, como na embalagem real.
 */

// Medidas aproximadas (em cm) do brownie de 100 g
const WIDTH = 7.4; // eixo X (laterais abertas)
const HEIGHT = 7.8; // eixo Y
const DEPTH = 3.8; // eixo Z (espessura)
const BAND_WIDTH = WIDTH * 0.9;
const BAND_RADIUS = 0.55;

const LABEL_BLUE = '#bce4e9';
const LABEL_PINK = '#f6c9d6';
const LABEL_PINK_DEEP = '#ee9fbc';
const TEXT_DARK = '#2e2624';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function sprinkleStars(ctx: CanvasRenderingContext2D, width: number, height: number, count: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    if (Math.random() > 0.5) {
      const s = 5 + Math.random() * 5;
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x + s, y);
      ctx.moveTo(x, y - s);
      ctx.lineTo(x, y + s);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Desenha a face principal do rótulo (em pé), igual à etiqueta real. */
function drawLabelFace(logo: HTMLImageElement, width: number, height: number, isBack = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = LABEL_BLUE;
  ctx.fillRect(0, 0, width, height);
  sprinkleStars(ctx, width, height, 70);

  // Ondas rosas nos cantos
  ctx.fillStyle = LABEL_PINK;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.48);
  ctx.bezierCurveTo(width * 0.16, height * 0.52, width * 0.12, height * 0.78, width * 0.02, height * 0.9);
  ctx.lineTo(0, height * 0.9);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(width, height * 0.62);
  ctx.bezierCurveTo(width * 0.86, height * 0.66, width * 0.88, height * 0.86, width, height * 0.95);
  ctx.closePath();
  ctx.fill();

  // Faixa rosa na base
  ctx.fillStyle = LABEL_PINK;
  ctx.fillRect(0, height * 0.955, width, height * 0.045);
  ctx.fillStyle = LABEL_PINK_DEEP;
  ctx.fillRect(0, height * 0.955, width, height * 0.008);

  // Selo com o logo (recorte circular do logo oficial)
  const radius = width * (isBack ? 0.3 : 0.36);
  const cx = width / 2;
  const cy = height * (isBack ? 0.4 : 0.36);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  const scale = (radius * 2) / (logo.width * 0.9);
  const drawW = logo.width * scale;
  const drawH = logo.height * scale;
  ctx.drawImage(logo, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
  ctx.restore();

  ctx.fillStyle = TEXT_DARK;
  ctx.textBaseline = 'alphabetic';
  if (!isBack) {
    ctx.font = `600 ${Math.round(width * 0.04)}px Arial, sans-serif`;
    ctx.fillText('Peso líq', width * 0.07, height * 0.73);
    ctx.font = `700 ${Math.round(width * 0.055)}px Arial, sans-serif`;
    ctx.fillText('100g', width * 0.07, height * 0.785);
  } else {
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(width * 0.05)}px Georgia, serif`;
    ctx.fillText('Brownie artesanal', width / 2, height * 0.8);
    ctx.font = `500 ${Math.round(width * 0.036)}px Arial, sans-serif`;
    ctx.fillText('Feito com carinho • 100 g', width / 2, height * 0.86);
  }

  return canvas;
}

/** Faixa estreita (topo/base) rosa com o nome da marca. */
function drawStripFace(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = LABEL_PINK;
  ctx.fillRect(0, 0, width, height);
  sprinkleStars(ctx, width, height, 25);
  ctx.fillStyle = TEXT_DARK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(height * 0.22)}px Georgia, serif`;
  ctx.fillText('Dulce di Naty', width / 2, height / 2);
  return canvas;
}

/** Perímetro da cinta (perfil retangular arredondado no plano YZ). */
function bandProfile(halfY: number, halfZ: number, r: number) {
  const straightY = 2 * (halfY - r);
  const straightZ = 2 * (halfZ - r);
  const arc = (Math.PI * r) / 2;
  const segments = [
    { kind: 'front', length: straightY },
    { kind: 'arc', length: arc },
    { kind: 'top', length: straightZ },
    { kind: 'arc', length: arc },
    { kind: 'back', length: straightY },
    { kind: 'arc', length: arc },
    { kind: 'bottom', length: straightZ },
    { kind: 'arc', length: arc },
  ] as const;
  const total = segments.reduce((sum, s) => sum + s.length, 0);

  // Ponto e normal em função da distância percorrida s (começa na base da frente, subindo)
  const pointAt = (s: number) => {
    let d = ((s % total) + total) % total;
    const corners = [
      { cy: halfY - r, cz: halfZ - r, start: 0 },
      { cy: halfY - r, cz: -(halfZ - r), start: Math.PI / 2 },
      { cy: -(halfY - r), cz: -(halfZ - r), start: Math.PI },
      { cy: -(halfY - r), cz: halfZ - r, start: (3 * Math.PI) / 2 },
    ];
    let cornerIndex = 0;
    for (const seg of segments) {
      if (d <= seg.length) {
        const t = seg.length === 0 ? 0 : d / seg.length;
        switch (seg.kind) {
          case 'front':
            return { y: -(halfY - r) + t * straightY, z: halfZ, ny: 0, nz: 1 };
          case 'top':
            return { y: halfY, z: halfZ - r - t * straightZ, ny: 1, nz: 0 };
          case 'back':
            return { y: halfY - r - t * straightY, z: -halfZ, ny: 0, nz: -1 };
          case 'bottom':
            return { y: -halfY, z: -(halfZ - r) + t * straightZ, ny: -1, nz: 0 };
          case 'arc': {
            const c = corners[cornerIndex];
            const angle = c.start + t * (Math.PI / 2);
            // angle 0 => normal +z, angle 90° => normal +y, etc.
            const nz = Math.cos(angle);
            const ny = Math.sin(angle);
            return { y: c.cy + ny * r, z: c.cz + nz * r, ny, nz };
          }
        }
      }
      d -= seg.length;
      if (seg.kind === 'arc') cornerIndex++;
    }
    return { y: -(halfY - r), z: halfZ, ny: 0, nz: 1 };
  };

  return { segments, total, pointAt, straightY, straightZ, arc };
}

function createBandGeometry(profile: ReturnType<typeof bandProfile>, bandWidth: number): THREE.BufferGeometry {
  const steps = 240;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * profile.total;
    const p = profile.pointAt(s);
    for (let j = 0; j <= 1; j++) {
      const x = -bandWidth / 2 + j * bandWidth;
      positions.push(x, p.y, p.z);
      normals.push(0, p.ny, p.nz);
      uvs.push(s / profile.total, j);
    }
  }
  for (let i = 0; i < steps; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/** Textura da cinta inteira: frente, topo, verso e base em uma tira só. */
function createBandTexture(logo: HTMLImageElement, profile: ReturnType<typeof bandProfile>, bandWidth: number): THREE.CanvasTexture {
  const pxPerUnit = 150;
  const stripW = Math.round(profile.total * pxPerUnit);
  const stripH = Math.round(bandWidth * pxPerUnit);
  const canvas = document.createElement('canvas');
  canvas.width = stripW;
  canvas.height = stripH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = LABEL_PINK;
  ctx.fillRect(0, 0, stripW, stripH);

  const faceLen = Math.round(profile.straightY * pxPerUnit);
  const stripLen = Math.round(profile.straightZ * pxPerUnit);
  const arcLen = profile.arc * pxPerUnit;

  const front = drawLabelFace(logo, stripH, faceLen);
  const back = drawLabelFace(logo, stripH, faceLen, true);
  const strip = drawStripFace(stripH, stripLen);

  // Mapeamento: u (eixo x do canvas) percorre o perímetro; v (eixo y do canvas) percorre a largura (X).
  const placeLikeFront = (image: HTMLCanvasElement, start: number, length: number) => {
    ctx.save();
    ctx.translate(start + length, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(image, 0, 0, stripH, length);
    ctx.restore();
  };
  const placeLikeBack = (image: HTMLCanvasElement, start: number, length: number) => {
    ctx.save();
    ctx.translate(start, stripH);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(image, 0, 0, stripH, length);
    ctx.restore();
  };

  let cursor = 0;
  placeLikeFront(front, cursor, faceLen);
  cursor += faceLen + arcLen;
  placeLikeFront(strip, cursor, stripLen);
  cursor += stripLen + arcLen;
  placeLikeBack(back, cursor, faceLen);
  cursor += faceLen + arcLen;
  placeLikeBack(strip, cursor, stripLen);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Textura do brownie: massa de chocolate com casquinha e migalhas. */
function createBrownieTextures(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 512;
  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  color.width = color.height = bump.width = bump.height = size;
  const c = color.getContext('2d')!;
  const b = bump.getContext('2d')!;

  c.fillStyle = '#4a2a1c';
  c.fillRect(0, 0, size, size);
  b.fillStyle = '#808080';
  b.fillRect(0, 0, size, size);

  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 6 + 1;
    const shade = Math.random();
    c.fillStyle = shade > 0.6 ? `rgba(118, 74, 48, ${0.25 + Math.random() * 0.35})` : `rgba(38, 20, 12, ${0.25 + Math.random() * 0.4})`;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    const g = Math.round(90 + Math.random() * 120);
    b.fillStyle = `rgba(${g}, ${g}, ${g}, 0.6)`;
    b.beginPath();
    b.arc(x, y, r, 0, Math.PI * 2);
    b.fill();
  }

  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpTexture = new THREE.CanvasTexture(bump);
  return { map, bump: bumpTexture };
}

/** Rugas suaves do filme plástico. */
function createWrinkleTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 40 + Math.random() * 160;
    const angle = Math.random() * Math.PI;
    const g = Math.round(60 + Math.random() * 140);
    ctx.strokeStyle = `rgba(${g}, ${g}, ${g}, 0.5)`;
    ctx.lineWidth = 2 + Math.random() * 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 40,
      y + Math.sin(angle) * len * 0.5 + (Math.random() - 0.5) * 40,
      x + Math.cos(angle) * len,
      y + Math.sin(angle) * len,
    );
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function createShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(59, 20, 13, 0.42)');
  gradient.addColorStop(0.55, 'rgba(59, 20, 13, 0.16)');
  gradient.addColorStop(1, 'rgba(59, 20, 13, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export async function mountBrownie3D(container: HTMLElement, logoSrc: string): Promise<() => void> {
  const logo = await loadImage(logoSrc);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.classList.add('brownie-3d-canvas');
  Object.assign(renderer.domElement.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    opacity: '0',
    transition: 'opacity 0.6s ease',
  });
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(9, 6, 17);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(6, 10, 8);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xfff4ee, 0xd9b8a8, 0.6));

  const product = new THREE.Group();
  scene.add(product);

  // Brownie
  const brownieTextures = createBrownieTextures();
  const brownie = new THREE.Mesh(
    new RoundedBoxGeometry(WIDTH, HEIGHT, DEPTH, 5, 0.45),
    new THREE.MeshStandardMaterial({
      map: brownieTextures.map,
      bumpMap: brownieTextures.bump,
      bumpScale: 2.5,
      roughness: 0.82,
    }),
  );
  product.add(brownie);

  // Filme plástico
  const wrap = new THREE.Mesh(
    new RoundedBoxGeometry(WIDTH + 0.12, HEIGHT + 0.12, DEPTH + 0.12, 5, 0.5),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      roughness: 0.08,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      bumpMap: createWrinkleTexture(),
      bumpScale: 1.2,
      depthWrite: false,
    }),
  );
  product.add(wrap);

  // Cinta do rótulo
  const profile = bandProfile(HEIGHT / 2 + 0.1, DEPTH / 2 + 0.1, BAND_RADIUS);
  const band = new THREE.Mesh(
    createBandGeometry(profile, BAND_WIDTH),
    new THREE.MeshStandardMaterial({
      map: createBandTexture(logo, profile, BAND_WIDTH),
      roughness: 0.55,
      side: THREE.DoubleSide,
    }),
  );
  product.add(band);

  // Sombra suave no chão
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({ map: createShadowTexture(), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -HEIGHT / 2 - 1.1;
  scene.add(shadow);

  product.rotation.y = -0.5;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 2.2;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.target.set(0, -0.3, 0);
  // Permite rolar a página na vertical pelo celular
  renderer.domElement.style.touchAction = 'pan-y';

  let resumeTimer = 0;
  const pauseAuto = () => {
    controls.autoRotate = false;
    window.clearTimeout(resumeTimer);
  };
  const resumeAuto = () => {
    window.clearTimeout(resumeTimer);
    if (!reducedMotion) resumeTimer = window.setTimeout(() => (controls.autoRotate = true), 2500);
  };
  controls.addEventListener('start', pauseAuto);
  controls.addEventListener('end', resumeAuto);

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Aproxima/afasta para caber em telas estreitas
    const distance = width / height < 0.9 ? 22 : 19;
    camera.position.setLength(distance);
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // Só renderiza quando a seção estiver visível
  let visible = true;
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
  });
  intersection.observe(container);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();
    product.position.y = Math.sin(t * 1.4) * 0.15;
    shadow.scale.setScalar(1 - Math.sin(t * 1.4) * 0.04);
    controls.update();
    renderer.render(scene, camera);
  });

  container.classList.add('ready');
  requestAnimationFrame(() => (renderer.domElement.style.opacity = '1'));

  return () => {
    renderer.setAnimationLoop(null);
    window.clearTimeout(resumeTimer);
    resizeObserver.disconnect();
    intersection.disconnect();
    controls.dispose();
    pmrem.dispose();
    environment.dispose();
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const material = object.material as THREE.MeshStandardMaterial;
        material.map?.dispose();
        material.bumpMap?.dispose();
        material.dispose();
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
