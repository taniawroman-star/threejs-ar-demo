import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";

// ===== Global variables =====
let container;
let camera, scene, renderer;
let controller;

let imageTextures = []; // Stores loaded textures and their aspect ratios
let currentImageIndex = 0; // Currently selected image index
let totalImages = 3; // Total number of images to load

// ===== Initialize scene =====
init();
animate();

function init() {
  // ----- Container for WebGL Renderer -----
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

  // ----- ARButton -----
  document.body.appendChild(
    ARButton.createButton(renderer, {
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body },
    })
  );

  // ----- Controller (for placing images) -----
  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect); // Place image on select
  scene.add(controller);

  // ----- Load image textures -----
  const imagePaths = [
    "./images/icon1440-1966-06_X_CERN_14195_0041.jpg",
    "./images/1996-10-001_X_CERN_04338_0004_icon-1440.jpg",
    "./images/icon640-1996-10-001_X_CERN_04338_0013.jpg",
  ];

  const loader = new THREE.TextureLoader();
  let loadedCount = 0;

  imagePaths.forEach((path, i) => {
    loader.load(
      new URL(path, import.meta.url).href,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const aspect = tex.image.width / tex.image.height;
        imageTextures[i] = { texture: tex, aspect };
        loadedCount++;
        console.log(`✅ Loaded image ${i}, aspect: ${aspect}`);

        // Enable button only after all images are loaded
        if (loadedCount === totalImages) {
          btn.disabled = false;
          console.log("✅ All images loaded. Button enabled.");
        }
      },
      undefined,
      (err) => console.error("Texture load error:", err)
    );
  });

  // ===== Overlay + Button =====
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.pointerEvents = "none"; // Let AR canvas interactions pass through
  overlay.style.zIndex = "9999"; // On top
  document.body.appendChild(overlay);

  // Button inside overlay
  const btn = document.createElement("button");
  btn.textContent = "Change Image";
  btn.disabled = true; // Disable until all textures are loaded
  btn.style.position = "absolute";
  btn.style.top = "20px";
  btn.style.left = "50%";
  btn.style.transform = "translateX(-50%)";
  btn.style.padding = "12px 18px";
  btn.style.fontSize = "16px";
  btn.style.background = "rgba(0,0,0,0.6)";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.pointerEvents = "auto"; // Make clickable
  overlay.appendChild(btn);

  // Button click: switch to next loaded image only (does NOT place it)
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();

    let nextIndex = currentImageIndex;
    let tries = 0;

    // Loop to find next loaded texture
    do {
      nextIndex = (nextIndex + 1) % totalImages;
      tries++;
    } while (
      (!imageTextures[nextIndex] || !imageTextures[nextIndex].texture) &&
      tries <= totalImages
    );

    if (imageTextures[nextIndex] && imageTextures[nextIndex].texture) {
      currentImageIndex = nextIndex;
      console.log("🖼️ Switched to image:", currentImageIndex);
    } else {
      console.warn("No loaded images available yet!");
    }
  });

  // ----- Handle window resize -----
  window.addEventListener("resize", onWindowResize);
}

// ===== Place image in AR scene when controller is selected =====
function onSelect() {
  const img = imageTextures[currentImageIndex];
  if (!img) {
    console.warn("Texture not loaded yet!");
    return;
  }

  // Maintain aspect ratio
  const height = 0.2; // 20 cm
  const width = height * img.aspect;

  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: img.texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Position mesh 30 cm in front of controller
  mesh.position.setFromMatrixPosition(controller.matrixWorld);
  mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
  mesh.translateZ(-0.3);

  // Face camera
  mesh.lookAt(camera.position);

  scene.add(mesh);
}

// ===== Handle window resize =====
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== Animation loop =====
function animate() {
  renderer.setAnimationLoop(render);
}

// ===== Render function =====
function render() {
  renderer.render(scene, camera);
}
