import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js";

let container;
let camera, scene, renderer;
let controller;
let glbModel = null;

// Load GLB once
loader.load("./earth.glb", (gltf) => {
  glbModel = gltf.scene;

  // Completely reset transform hierarchy
  glbModel.traverse((obj) => {
    if (obj.isMesh) {
      // Reset scale
      obj.scale.set(1, 1, 1);

      // Reset rotation
      obj.rotation.set(0, 0, 0);

      // Reset position
      obj.position.set(0, 0, 0);

      // Force geometry recalc
      obj.updateMatrix();
    }
  });

  // Now scale the whole model
  const SCALE = 0.01;
  glbModel.scale.set(SCALE, SCALE, SCALE);

  // Center the object manually
  const box = new THREE.Box3().setFromObject(glbModel);
  const center = box.getCenter(new THREE.Vector3());
  glbModel.position.sub(center);

  glbModel.updateMatrixWorld(true);
});

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
