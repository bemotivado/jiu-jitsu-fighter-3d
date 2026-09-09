import * as THREE from 'three';
import { createJJFighterShowcase } from './demos/jiu-jitsu-fighter/jjShowcase';

// Initialize scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.Fog(0x0a0a0a, 15, 40);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(4.35, 1.14, 2.05);
camera.lookAt(0, 0.95, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.getElementById('app')!.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Create JJ fighter
const jjFighter = createJJFighterShowcase({ castShadow: true, receiveShadow: true });
scene.add(jjFighter);

// Floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.4 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.1;
floor.receiveShadow = true;
scene.add(floor);

// Animation loop
let lastTime = Date.now();
function animate() {
  requestAnimationFrame(animate);

  const now = Date.now();
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;

  // Update JJ fighter
  if (jjFighter.userData.tick) {
    jjFighter.userData.tick(deltaTime);
  }

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

animate();
