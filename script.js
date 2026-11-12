/**
 * Sistema de Partículas 3D con Inteligencia Artificial y Visión por Computadora
 * Renderizado en Three.js con detección de manos en tiempo real
 */

// --- CONFIGURACIÓN GLOBAL ---
const TOTAL_PARTICLES = 9000;
const SHAPES = ['Sphere', 'Heart', 'Flower', 'Saturn', 'Fireworks'];
let currentShapeIndex = 0;

// Estado interactivo controlado por mano / ratón
const interactionState = {
  scale: 1.0,
  targetScale: 1.0,
  rotationSpeedMultiplier: 1.0,
  isFist: false,
  wasFist: false,
  isOpenPalm: false,
  isPinching: false,
  handDetected: false,
  handX: 0,
  handY: 0,
  hueOffset: 0,
  lastPinchTime: 0,
  pinchCooldown: 850,
  lastFistTime: 0,
  fistCooldown: 700
};

// --- SONIDOS SINTETIZADOS CON WEB AUDIO API ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playMorphSound() {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.35);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    // Silenciado
  }
}

// --- CONFIGURACIÓN THREE.JS ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050608, 0.0012);

const camera = new THREE.PerspectiveCamera(
  60,
  Math.max(window.innerWidth, 1) / Math.max(window.innerHeight, 1),
  1,
  3000
);
camera.position.z = 280;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x050608, 1);
container.appendChild(renderer.domElement);

// --- GENERACIÓN DE TEXTURA DE PARTÍCULA BRILLANTE ---
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(220, 245, 255, 0.9)');
  gradient.addColorStop(0.5, 'rgba(70, 160, 255, 0.45)');
  gradient.addColorStop(0.8, 'rgba(0, 110, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// --- CREACIÓN DEL SISTEMA DE PARTÍCULAS ---
const geometry = new THREE.BufferGeometry();
const currentPositions = new Float32Array(TOTAL_PARTICLES * 3);
const targetPositions = new Float32Array(TOTAL_PARTICLES * 3);
const colors = new Float32Array(TOTAL_PARTICLES * 3);
const baseColors = new Float32Array(TOTAL_PARTICLES * 3);
const particleSeeds = new Float32Array(TOTAL_PARTICLES);

for (let i = 0; i < TOTAL_PARTICLES; i++) {
  particleSeeds[i] = Math.random() * Math.PI * 2;
}

geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
  size: 3.2,
  vertexColors: true,
  map: createParticleTexture(),
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true
});

const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

// --- FUNCIONES MATEMÁTICAS PARA LAS FORMAS ---

// 1. Esfera (Sphere)
function generateSpherePositions(arr, colorArr) {
  const radius = 80;
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / TOTAL_PARTICLES);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;

    const r = radius + (Math.random() - 0.5) * 8;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;

    const color = new THREE.Color().setHSL(0.56 + (y / radius) * 0.08, 0.85, 0.65);
    colorArr[i * 3] = color.r;
    colorArr[i * 3 + 1] = color.g;
    colorArr[i * 3 + 2] = color.b;
  }
}

// 2. Corazón 3D (Heart)
function generateHeartPositions(arr, colorArr) {
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    const t = Math.PI * 2 * Math.random();
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    const thickness = (Math.random() - 0.5) * 16 * (1 - Math.abs(x) / 18);
    const scale = 5.2;

    arr[i * 3] = x * scale;
    arr[i * 3 + 1] = y * scale;
    arr[i * 3 + 2] = thickness * scale;

    const color = new THREE.Color().setHSL(0.93 + (y / 16) * 0.08, 0.95, 0.65);
    colorArr[i * 3] = color.r;
    colorArr[i * 3 + 1] = color.g;
    colorArr[i * 3 + 2] = color.b;
  }
}

// 3. Flor 3D (Flower)
function generateFlowerPositions(arr, colorArr) {
  const petals = 3;
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    const theta = Math.PI * 2 * Math.random();
    const phi = (Math.random() - 0.5) * Math.PI * 0.4;

    const rBase = Math.cos(petals * theta);
    const r = (Math.abs(rBase) * 85 + 18) * Math.cos(phi);

    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const z = Math.sin(petals * theta) * 35 + Math.sin(phi) * 20;

    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;

    const color = new THREE.Color().setHSL(0.75 + Math.sin(theta * 3) * 0.1, 0.9, 0.7);
    colorArr[i * 3] = color.r;
    colorArr[i * 3 + 1] = color.g;
    colorArr[i * 3 + 2] = color.b;
  }
}

// 4. Saturno (Saturn)
function generateSaturnPositions(arr, colorArr) {
  const planetParticles = Math.floor(TOTAL_PARTICLES * 0.38);
  const ringParticles = TOTAL_PARTICLES - planetParticles;

  for (let i = 0; i < planetParticles; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / planetParticles);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 42 + (Math.random() - 0.5) * 4;

    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);

    const color = new THREE.Color().setHSL(0.12, 0.85, 0.65);
    colorArr[i * 3] = color.r;
    colorArr[i * 3 + 1] = color.g;
    colorArr[i * 3 + 2] = color.b;
  }

  const tiltAngle = 0.45;
  const cosTilt = Math.cos(tiltAngle);
  const sinTilt = Math.sin(tiltAngle);

  for (let i = 0; i < ringParticles; i++) {
    const idx = planetParticles + i;
    const angle = Math.random() * Math.PI * 2;
    const dist = 62 + Math.pow(Math.random(), 0.65) * 73;
    const ringHeight = (Math.random() - 0.5) * 3;

    const rx = dist * Math.cos(angle);
    const ry = dist * Math.sin(angle);
    const rz = ringHeight;

    arr[idx * 3] = rx;
    arr[idx * 3 + 1] = ry * cosTilt - rz * sinTilt;
    arr[idx * 3 + 2] = ry * sinTilt + rz * cosTilt;

    const color = new THREE.Color().setHSL(0.55 + ((dist - 62) / 73) * 0.1, 0.85, 0.72);
    colorArr[idx * 3] = color.r;
    colorArr[idx * 3 + 1] = color.g;
    colorArr[idx * 3 + 2] = color.b;
  }
}

// 5. Fuegos Artificiales (Fireworks)
function generateFireworksPositions(arr, colorArr) {
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    const speed = 25 + Math.pow(Math.random(), 2) * 110;
    const x = speed * Math.sin(phi) * Math.cos(theta);
    const y = speed * Math.sin(phi) * Math.sin(theta);
    const z = speed * Math.cos(phi);

    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;

    const hue = (Math.random() * 0.35 + 0.95) % 1.0;
    const color = new THREE.Color().setHSL(hue, 1.0, 0.7);
    colorArr[i * 3] = color.r;
    colorArr[i * 3 + 1] = color.g;
    colorArr[i * 3 + 2] = color.b;
  }
}

const SHAPE_GENERATORS = {
  'Sphere': generateSpherePositions,
  'Heart': generateHeartPositions,
  'Flower': generateFlowerPositions,
  'Saturn': generateSaturnPositions,
  'Fireworks': generateFireworksPositions
};

// Inicializar posiciones y colores iniciales
generateSpherePositions(currentPositions, colors);
generateSpherePositions(targetPositions, baseColors);

// --- CAMBIO DE FORMA (TEMPLATE) ---
function setShape(shapeName) {
  const index = SHAPES.indexOf(shapeName);
  if (index === -1) return;
  currentShapeIndex = index;

  SHAPE_GENERATORS[shapeName](targetPositions, baseColors);

  const templateElement = document.getElementById('template-name');
  if (templateElement) {
    templateElement.textContent = shapeName;
  }

  document.querySelectorAll('.shape-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === currentShapeIndex);
  });

  showToast(`Template: ${shapeName}`);
  playMorphSound();
}

function nextShape() {
  const nextIdx = (currentShapeIndex + 1) % SHAPES.length;
  setShape(SHAPES[nextIdx]);
}

let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 1400);
}

// --- MEDIAPIPE HAND TRACKING & VISIÓN ARTIFICIAL ---
const videoElement = document.getElementById('camera-video');
const canvasElement = document.getElementById('camera-canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');

function highlightGestureUI(gestureName) {
  const items = document.querySelectorAll('.hud-instructions li');
  items.forEach(item => {
    if (gestureName && item.getAttribute('data-gesture') === gestureName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function onResults(results) {
  // Limpiar canvas overlay
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    interactionState.handDetected = true;
    const landmarks = results.multiHandLandmarks[0];

    // Dibujar esqueleto de la mano sobre el video
    if (typeof drawConnectors === 'function' && typeof drawLandmarks === 'function') {
      const connections = window.HAND_CONNECTIONS || (typeof HAND_CONNECTIONS !== 'undefined' ? HAND_CONNECTIONS : []);
      drawConnectors(canvasCtx, landmarks, connections, { color: '#00f0ff', lineWidth: 2 });
      drawLandmarks(canvasCtx, landmarks, { color: '#ffffff', fillColor: '#ff007b', radius: 2.5 });
    }

    const wrist = landmarks[0];
    const middleMCP = landmarks[9];
    const palmCenter = {
      x: (wrist.x + middleMCP.x) / 2,
      y: (wrist.y + middleMCP.y) / 2
    };

    // Orientación natural espejada
    interactionState.handX = (0.5 - palmCenter.x) * 2;
    interactionState.handY = (palmCenter.y - 0.5) * 2;

    // Gesto de Pellizco (Pinch)
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

    const now = performance.now();
    if (pinchDist < 0.065) {
      interactionState.isPinching = true;
      highlightGestureUI('pinch');
      if (now - interactionState.lastPinchTime > interactionState.pinchCooldown) {
        interactionState.lastPinchTime = now;
        nextShape();
      }
    } else {
      interactionState.isPinching = false;
    }

    // Distancia promedio de las 5 puntas a la muñeca
    const tips = [4, 8, 12, 16, 20];
    let totalDistToWrist = 0;
    tips.forEach(idx => {
      const tip = landmarks[idx];
      totalDistToWrist += Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    });
    const avgTipDist = totalDistToWrist / tips.length;

    // Distancia física estimada de la mano a la cámara
    const handPhysicalSize = Math.hypot(wrist.x - middleMCP.x, wrist.y - middleMCP.y);
    interactionState.hueOffset = (handPhysicalSize * 4.5) % 1.0;

    // Puño cerrado (Closed Fist) vs Palma abierta (Open Palm)
    if (!interactionState.isPinching) {
      if (avgTipDist < 0.24) {
        // PUÑO CERRADO -> CAMBIO DE FIGURA
        interactionState.isFist = true;
        interactionState.isOpenPalm = false;
        interactionState.targetScale = 1.0;
        interactionState.rotationSpeedMultiplier = 1.3;
        highlightGestureUI('fist');

        if (!interactionState.wasFist || (now - interactionState.lastFistTime > interactionState.fistCooldown)) {
          interactionState.lastFistTime = now;
          nextShape();
        }
        interactionState.wasFist = true;
      } else if (avgTipDist > 0.36) {
        // PALMA ABIERTA -> EXPANSIÓN Y GIRO
        interactionState.isOpenPalm = true;
        interactionState.isFist = false;
        interactionState.wasFist = false;
        interactionState.targetScale = 1.65;
        interactionState.rotationSpeedMultiplier = 2.2;
        highlightGestureUI('palm');
      } else {
        // Estado neutro
        interactionState.isFist = false;
        interactionState.wasFist = false;
        interactionState.isOpenPalm = false;
        interactionState.targetScale = 1.0;
        interactionState.rotationSpeedMultiplier = 1.0;
        highlightGestureUI(null);
      }
    }

    if (statusText) statusText.textContent = 'Mano detectada | Activo';
    if (statusBadge) statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.6)';
  } else {
    interactionState.handDetected = false;
    interactionState.targetScale = 1.0;
    interactionState.rotationSpeedMultiplier = 1.0;
    highlightGestureUI(null);
    if (statusText) statusText.textContent = 'Buscando mano frente a la cámara...';
    if (statusBadge) statusBadge.style.borderColor = 'rgba(0, 240, 255, 0.3)';
  }
}

// Inicialización de cámara y MediaPipe Hands sin bloqueos
async function initHandTracking() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (statusText) statusText.textContent = 'Cámara no soportada en este entorno (Usa ratón/teclas)';
    return;
  }

  if (typeof Hands === 'undefined') {
    if (statusText) statusText.textContent = 'Cargando modelo de IA...';
    setTimeout(initHandTracking, 400);
    return;
  }

  if (statusText) statusText.textContent = 'Iniciando cámara web...';

  // 1. Obtener stream nativo con restricciones ideales
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    videoElement.srcObject = stream;
    videoElement.muted = true;
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('autoplay', '');

    await videoElement.play().catch(() => {});
  } catch (err) {
    console.warn('Error al activar cámara:', err);
    if (statusText) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        statusText.textContent = 'Permiso de cámara denegado (Revisa Privacidad o usa ratón/teclas)';
      } else {
        statusText.textContent = 'Cámara no disponible (Usa ratón/teclas)';
      }
    }
    return;
  }

  if (statusText) statusText.textContent = 'Cámara activa. Cargando IA...';

  // 2. Cargar MediaPipe Hands (prioriza archivos locales de libs/)
  let hands;
  try {
    hands = new Hands({
      locateFile: (file) => `libs/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
    await hands.initialize();
  } catch (err) {
    console.warn('Fallo con libs locales, intentando CDN de respaldo:', err);
    try {
      hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5
      });
      hands.onResults(onResults);
      await hands.initialize();
    } catch (err2) {
      console.error('No se pudo inicializar MediaPipe Hands:', err2);
      if (statusText) statusText.textContent = 'Visión IA no disponible (Usa ratón/teclas)';
      return;
    }
  }

  if (statusText) statusText.textContent = 'Buscando mano frente a la cámara...';

  // 3. Procesar frames continuamente sin bloquear Three.js
  let isProcessing = false;
  async function processCameraFrame() {
    if (videoElement.readyState >= 2 && !videoElement.paused && !isProcessing) {
      isProcessing = true;
      try {
        await hands.send({ image: videoElement });
      } catch (e) {
        // Prevenir cuelgues ante frames momentáneamente inválidos
      } finally {
        isProcessing = false;
      }
    }
    requestAnimationFrame(processCameraFrame);
  }
  requestAnimationFrame(processCameraFrame);
}

// --- CONTROLES DE RATÓN / TÁCTIL (FALLBACK) ---
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;
let targetRotX = 0;
let targetRotY = 0;

window.addEventListener('mousedown', (e) => {
  initAudio();
  if (e.target.closest('#hud-overlay') || e.target.closest('#controls-bar') || e.target.closest('#camera-pip-container')) {
    return;
  }
  isMouseDown = true;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;
  const deltaX = e.clientX - mouseX;
  const deltaY = e.clientY - mouseY;
  targetRotY += deltaX * 0.005;
  targetRotX += deltaY * 0.005;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  isMouseDown = false;
});

window.addEventListener('wheel', (e) => {
  camera.position.z += e.deltaY * 0.2;
  camera.position.z = Math.max(120, Math.min(650, camera.position.z));
});

window.addEventListener('keydown', (e) => {
  initAudio();
  if (e.key >= '1' && e.key <= '5') {
    setShape(SHAPES[parseInt(e.key) - 1]);
  } else if (e.code === 'Space') {
    nextShape();
  } else if (e.key.toLowerCase() === 'f') {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
});

document.querySelectorAll('.shape-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    initAudio();
    const shape = btn.getAttribute('data-shape');
    setShape(shape);
  });
});

// --- BUCLE DE ANIMACIÓN PRINCIPAL (INMEDIATO) ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  interactionState.scale += (interactionState.targetScale - interactionState.scale) * 0.08;

  const baseRotSpeed = 0.45 * interactionState.rotationSpeedMultiplier;
  particleSystem.rotation.y += baseRotSpeed * delta;

  if (interactionState.handDetected) {
    particleSystem.rotation.x += (-interactionState.handY * 0.6 - particleSystem.rotation.x) * 0.06;
    particleSystem.rotation.z += (interactionState.handX * 0.4 - particleSystem.rotation.z) * 0.06;
  } else {
    particleSystem.rotation.x += (targetRotX - particleSystem.rotation.x) * 0.05;
    particleSystem.rotation.y += (targetRotY - particleSystem.rotation.y) * 0.05;
  }

  const pos = particleSystem.geometry.attributes.position.array;
  const col = particleSystem.geometry.attributes.color.array;

  const morphSpeed = 0.065;
  const scale = interactionState.scale;
  const hueShift = interactionState.hueOffset;

  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    const idx = i * 3;
    const targetX = targetPositions[idx] * scale;
    const targetY = targetPositions[idx + 1] * scale;
    const targetZ = targetPositions[idx + 2] * scale;

    const seed = particleSeeds[i];
    const wave = Math.sin(time * 2.5 + seed) * (interactionState.isOpenPalm ? 3.5 : 1.2);

    pos[idx] += (targetX + wave - pos[idx]) * morphSpeed;
    pos[idx + 1] += (targetY + wave - pos[idx + 1]) * morphSpeed;
    pos[idx + 2] += (targetZ + wave - pos[idx + 2]) * morphSpeed;

    if (hueShift > 0.01) {
      const baseR = baseColors[idx];
      const baseG = baseColors[idx + 1];
      const baseB = baseColors[idx + 2];
      const c = new THREE.Color(baseR, baseG, baseB);
      const hsl = {};
      c.getHSL(hsl);
      c.setHSL((hsl.h + hueShift) % 1.0, hsl.s, hsl.l);
      col[idx] += (c.r - col[idx]) * 0.1;
      col[idx + 1] += (c.g - col[idx + 1]) * 0.1;
      col[idx + 2] += (c.b - col[idx + 2]) * 0.1;
    } else {
      col[idx] += (baseColors[idx] - col[idx]) * 0.08;
      col[idx + 1] += (baseColors[idx + 1] - col[idx + 1]) * 0.08;
      col[idx + 2] += (baseColors[idx + 2] - col[idx + 2]) * 0.08;
    }
  }

  particleSystem.geometry.attributes.position.needsUpdate = true;
  particleSystem.geometry.attributes.color.needsUpdate = true;

  renderer.render(scene, camera);
}

function onWindowResize() {
  const w = window.innerWidth || 800;
  const h = window.innerHeight || 600;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('resize', onWindowResize);

// --- ARRANQUE SEGURO ---
function startApp() {
  onWindowResize();
  animate();
  initHandTracking();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
