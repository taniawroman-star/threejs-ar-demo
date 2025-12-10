import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";

let container;
let camera, scene, renderer;
let controller;

let imageTextures = [];
let currentImageIndex = 0;
let geometry;

init();
animate();

function init() {
  // Container
  container = document.createElement("div");
  document.body.appendChild(container);

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  // Light
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
  document.body.appendChild(ARButton.createButton(renderer));

  // ✅ Image URLs
  const imagePaths = [
    "./images/icon1440-1966-06_X_CERN_14195_0041.jpg",
    "./images/1996-10-001_X_CERN_04338_0004_icon-1440.jpg",
    "./images/icon640-1996-10-001_X_CERN_04338_0013.jpg",
  ];

  const loader = new THREE.TextureLoader();

  imageTextures = imagePaths.map((path) => {
    const url = new URL(path, import.meta.url).href;
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });

  // ✅ Image geometry (10cm x 10cm)
  geometry = new THREE.PlaneGeometry(0.2, 0.2);

  // Controller
  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  // ✅ Image change button
  const btn = document.createElement("button");
  btn.textContent = "Change Image";
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.left = "50%";
  btn.style.transform = "translateX(-50%)";
  btn.style.padding = "12px 18px";
  btn.style.fontSize = "16px";
  btn.style.zIndex = "999";
  document.body.appendChild(btn);

  btn.addEventListener("click", () => {
    currentImageIndex = (currentImageIndex + 1) % imageTextures.length;
    console.log("🖼️ Switched to image:", currentImageIndex);
  });

  window.addEventListener("resize", onWindowResize);
}

function onSelect() {
  const material = new THREE.MeshBasicMaterial({
    map: imageTextures[currentImageIndex],
    transparent: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Place image 30cm in front of controller
  mesh.position.setFromMatrixPosition(controller.matrixWorld);
  mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
  mesh.translateZ(-0.3);

  // Face the camera
  mesh.lookAt(camera.position);

  scene.add(mesh);
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
