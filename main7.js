import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";

// ===== Globals =====
let container;
let camera, scene, renderer;
let controller;

let imageTextures = [];
let currentImageIndex = -1;

let placingInterval = null;
let isPlacing = false;

// ===== Init =====
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
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  document.body.appendChild(
    ARButton.createButton(renderer, {
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body },
    })
  );

  controller = renderer.xr.getController(0);
  controller.addEventListener("select", placeSingleImage);
  scene.add(controller);

  loadImages();
  setupTouchGestures();

  window.addEventListener("resize", onWindowResize);
}

// ===== Load images =====
function loadImages() {
  const paths = [
    "./images/icon1440-1966-06_X_CERN_14195_0041.jpg",
    "./images/1996-10-001_X_CERN_04338_0004_icon-1440.jpg",
    "./images/icon640-1996-10-001_X_CERN_04338_0013.jpg",
    "./images/1990-08-109_A_0001-icon-1440.jpg",
    "./images/1991-01-027_X_0007-icon-1440.jpg",
    "./images/1991-06-016_X_0001-icon-640.jpg",
    "./images/1992-09-005X_01_icon640.jpg",
    "./images/1999-01-018X_04_icon640.jpg",
    "./images/4465.jpg",
    "./images/66-6-242.jpg",
    "./images/69-10-372.jpg",
  ];

  const loader = new THREE.TextureLoader();

  paths.forEach((p, i) => {
    loader.load(new URL(p, import.meta.url).href, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      imageTextures[i] = {
        texture: tex,
        aspect: tex.image.width / tex.image.height,
      };
      console.log("✅ Loaded image", i);
    });
  });
}

// ===== Place ONE image =====
function placeSingleImage() {
  placeNextImage();
}

// ===== Core placement logic =====
function placeNextImage() {
  if (imageTextures.length === 0) return;
  if (isPlacing) return;

  isPlacing = true;

  let tries = 0;
  do {
    currentImageIndex = (currentImageIndex + 1) % imageTextures.length;
    tries++;
  } while (!imageTextures[currentImageIndex] && tries < imageTextures.length);

  const img = imageTextures[currentImageIndex];
  if (!img) {
    isPlacing = false;
    return;
  }

  const height = 0.2;
  const width = height * img.aspect;

  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: img.texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.setFromMatrixPosition(controller.matrixWorld);
  mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
  mesh.translateZ(-0.3);
  mesh.lookAt(camera.position);

  scene.add(mesh);

  setTimeout(() => {
    isPlacing = false;
  }, 150);
}

// ===== Two-finger continuous placement =====
function setupTouchGestures() {
  document.body.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2 && !placingInterval) {
      placingInterval = setInterval(() => {
        placeNextImage();
      }, 300); // speed (ms)
    }
  });

  document.body.addEventListener("touchend", (e) => {
    if (e.touches.length < 2 && placingInterval) {
      clearInterval(placingInterval);
      placingInterval = null;
    }
  });
}

// ===== Resize =====
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== Loop =====
function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
