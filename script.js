//configuracion de la escena 3D 
const canvas = document.getElementById('web-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/ window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const PARTICLE_COUNT = 3000;
let geometry, material, particles;
let currentShape = 0;

//Ubicacion de las particulas
geometry = new THREE.bufferGeometry();
const positions = new Float32Array(PARTICLE_COUNT * 3);
const targetPositions = new Float32Array(PARTICLE_COUNT * 3);

for (let i = 0; i < PARTICLE_COUNT * 3; i++){
    positions[i] = (Math.random() - 0.5) * 50;
    targetPositions[i] = positions[i];
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

//Estilo visual de las particulas
material = new THREE.PointsMaterial({
    size: 0.6,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

particles = new THREE.Points(geometry, material);
scene.add(particles);

//Funciones para generar las figuras geometricas
function getSpherePosition(i){
    const phi = Math.acos(-1 +(2*i)/PARTICLE_COUNT);
    const theta =Math.sqrt(PARTICLE_COUNT *Math.PI) * phi;
    return{
        x: 10 * Math.cos(theta) * Math.sin(phi),
        y: 10 * Math.sin(theta) * Math.sin(phi),
        z: 10 * Math.cos(phi)
    };
}
function getHeratPosition(i){
    const t = (i/PARTICLE_COUNT) *  Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    const z = (Math.random() - 0.5) * 5;
    return {x: x * 0.6, y: y * 0.6, z: z};
}

function getCubePosition(){
    return{
        x: (Math.random() - 0.5) * 15, 
        y: (Math.random() - 0.5) * 15,
        z: (Math.random() - 0.5) * 15
    }
}

function changeShape(shapeIndex){
 currentShape = shapeIndex % 3;
 const pos = geometry.attributes.position.array;
for(let i = 0; i < PARTICLE_COUNT; i ++){
    let target;
    if(currentShape === 0) target = getSpherePosition(i);
    else if (currentShape === 1) target = getHeartPosition(i);
    else target = getCubePosition();

    targetPositions[i * 3] = target.x;
    targetPositions[i *3 + 1] = target.y;
    targetPositios[i* 3 + 2] = target.z;
}
}

function animate(){
    requestAnimationFrame(animate);
    const pos = geometry.attributes.position.array;
    for(let i = 0; i < PARTICLES_COUNT * 3; i ++){
       pos[i] += (targetPositions[i] - pos[i]) * 0.08;

    }
    geometry.attributes.position.needsUpdate =  true;
    particles.rotation.y += 0.003;
    renderer.render(scene, camera);
}
animate();
window.addEventListener('resize', () =>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const videoElement = document.querySelector('.input_video');
const statusElement = document.getElementById('status');
function onResults(results){

  if(results.multiHandLandmarks && results.multiHandLandmarks.length > 0){
    statusElement.innerText = " Mano detectada";
    statusElement.style.color ="#4ade80";
    const landmarks = results.multiHandLandmarks[0];
    const indexTip = landmarks[8];
    particles.rotation.x = (indexTip.y - 0.5) * -3;
    particles.rotation.y = (indexTip.x - 0.5) * 3;

 } else {
    statusElement.innerText = "Pon tu mano frente a la camara";
    statusElement.style.color ="#facc15";

 }
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const cameraUtils = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 320,
    height: 240
});
cameraUtils.start()
    .then(() => {
        statusElement.innerText = "Cámara activa. Muestra tu mano.";
    })
    .catch((err) => {
        statusElement.innerText = "Error de cámara (Usa ESPACIO)";
        console.error(err);
    });