import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";

// ===== Global variables =====
let container;
let camera, scene, renderer;
let controller;

let imageTextures = [];
let currentImageIndex = -1; // start before first image

// ===== Initialize scene =====
init();
animate();

function init() {
  // ----- Container -----
  container = document.createElement("div");
  document.body.appendChild(container);

  // ----- Scene -----
  scene = new THREE.Scene();

  // ----- Camera -----
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );

  // ----- Light -----
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  // ----- Renderer -----
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // ----- AR Button -----
  document.body.appendChild(
    ARButton.createButton(renderer, {
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body },
    })
  );

  // ----- Controller -----
  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  // ----- Image paths -----
  const imagePaths = [
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

  // ----- Load textures -----
  const loader = new THREE.TextureLoader();

  imagePaths.forEach((path, i) => {
    loader.load(
      new URL(path, import.meta.url).href,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const aspect = texture.image.width / texture.image.height;
        imageTextures[i] = { texture, aspect };
        console.log(`✅ Loaded image ${i}`);
      },
      undefined,
      (err) => console.error("❌ Texture load error:", err)
    );
  });

  // ----- Resize -----
  window.addEventListener("resize", onWindowResize);
}

// ===== Tap / Select = next image + place =====
function onSelect() {
  if (imageTextures.length === 0) {
    console.warn("Images not loaded yet");
    return;
  }

  // Advance to next image
  currentImageIndex = (currentImageIndex + 1) % imageTextures.length;
  const img = imageTextures[currentImageIndex];

  if (!img) {
    console.warn("Selected image not ready yet");
    return;
  }

  // Keep aspect ratio
  const height = 0.2; // meters
  const width = height * img.aspect;

  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: img.texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Position in front of controller
  mesh.position.setFromMatrixPosition(controller.matrixWorld);
  mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
  mesh.translateZ(-0.3);

  // Face camera
  mesh.lookAt(camera.position);

  scene.add(mesh);

  console.log("🖼️ Placed image index:", currentImageIndex);
}

// ===== Resize =====
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== Animation =====
function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
