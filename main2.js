import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js";

let container;
let camera, scene, renderer;
let controller;
let glbModel = null;

// Load GLB once at startup
const loader = new GLTFLoader();
loader.load(
  "./earth.glb",
  (gltf) => {
    glbModel = gltf.scene;
    glbModel.scale.set(0.03); // Adjust GLB size for AR
  },
  undefined,
  (err) => console.error("Failed to load GLB", err)
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

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  // AR Button
  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
  );

  // Controller
  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  window.addEventListener("resize", onWindowResize, false);
}

function onSelect() {
  if (!glbModel) return; // GLB not loaded yet

  // Clone GLB so you can place multiple
  const model = glbModel.clone(true);

  // Place at controller pointing position
  model.position.set(0, 0, -600).applyMatrix4(controller.matrixWorld);

  // Ensure orientation matches user view
  model.quaternion.setFromRotationMatrix(controller.matrixWorld);

  scene.add(model);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
