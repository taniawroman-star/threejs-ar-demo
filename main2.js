import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js";

let container;
let camera, scene, renderer;
let controller;
let glbModel = null;

// Load GLB once
const loader = new GLTFLoader();
loader.load(
  "./earth.glb",
  (gltf) => {
    glbModel = gltf.scene;

    // *** FIX: scale every child (your model is 195 meters tall!) ***
    const SCALE = 0.00000000000000025;

    glbModel.traverse((child) => {
      if (child.isMesh) {
        child.scale.multiplyScalar(SCALE);
      }
    });

    glbModel.updateMatrixWorld(true);
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

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  // Important: NO hit-test
  document.body.appendChild(ARButton.createButton(renderer));

  // Controller that fires select events
  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  window.addEventListener("resize", onWindowResize, false);
}

function onSelect() {
  if (!glbModel) return;

  const model = glbModel.clone(true);

  model.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
  model.quaternion.setFromRotationMatrix(controller.matrixWorld);

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
