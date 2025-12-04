import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js";

let container;
let camera, scene, renderer;
let glbModel = null;

// Load GLB once
const loader = new GLTFLoader();
loader.load(
  "./earth.glb",
  (gltf) => {
    glbModel = gltf.scene;
    glbModel.scale.set(0.1, 0.1, 0.1);
  },
  undefined,
  (err) => console.error("Failed to load GLB:", err)
);

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  // AR Button
  document.body.appendChild(ARButton.createButton(renderer));

  // SCREEN TOUCH to place object
  window.addEventListener("touchstart", () => onSelect());

  window.addEventListener("resize", onWindowResize, false);
}

function onSelect() {
  if (!glbModel) return;

  const model = glbModel.clone(true);

  // Place 40cm in front of the camera
  const distance = 0.4;
  const direction = new THREE.Vector3(0, 0, -distance);
  direction.applyQuaternion(camera.quaternion);

  model.position.copy(camera.position).add(direction);
  model.quaternion.copy(camera.quaternion);

  scene.add(model);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
}
