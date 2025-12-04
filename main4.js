import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";

let container;
let camera, scene, renderer;
let controller;

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

  // NEW API
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  // AR Button
  document.body.appendChild(ARButton.createButton(renderer));

  // UPDATED geometry (CylinderBufferGeometry removed)
  const geometry = new THREE.SphereGeometry(0.1, 32, 16); // 5 cm radius
  geometry.rotateX(Math.PI / 2);

  function onSelect() {
    const material = new THREE.MeshPhongMaterial({
      color: Math.random() * 0xffffff,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Place the sphere 30 cm in front of the controller
    mesh.position.setFromMatrixPosition(controller.matrixWorld);
    mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
    mesh.translateZ(-0.3);

    scene.add(mesh);
  }

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  window.addEventListener("resize", onWindowResize, false);
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
