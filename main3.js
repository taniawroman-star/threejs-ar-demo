import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js";
import { ARButton } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/webxr/ARButton.js";

let camera, scene, renderer;
let reticle, model;

init();
animate();

function init() {
  // Scene and camera
  scene = new THREE.Scene();
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
  document.body.appendChild(renderer.domElement);

  // AR Button
  document.body.appendChild(
    ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
  );

  loader.load("your_model.glb", function (gltf) {
    model = gltf.scene;

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Desired max size in meters (for AR)
    const desiredSize = 1; // 1 meter
    const scale = desiredSize / maxDim;

    model.scale.setScalar(scale); // uniform scaling

    // Center the model
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center.multiplyScalar(scale));

    // Optional: Fix rotation if model is upside down
    model.rotation.x = -Math.PI / 2;

    model.visible = false;
    scene.add(model);
  });

  // Reticle for placement
  const geometry = new THREE.RingGeometry(0.1, 0.11, 32).rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({ color: 0x0fff0f });
  reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // Hit test for AR placement
  const controller = renderer.xr.getController(0);
  controller.addEventListener("select", () => {
    if (model && reticle.visible) {
      model.position.setFromMatrixPosition(reticle.matrix);
      model.visible = true;
    }
  });
  scene.add(controller);

  // Window resize
  window.addEventListener("resize", onWindowResize);
}

// Handle resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (!reticle.visible) {
      session.requestAnimationFrame((time, xrFrame) => {
        const viewerPose = xrFrame.getViewerPose(referenceSpace);
        if (viewerPose) {
          const hitTestResults = frame.getHitTestResults(
            session.requestHitTestSourceForTransientInput({
              profile: "generic-touchscreen",
            })
          );
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            reticle.visible = true;
            reticle.matrix.fromArray(
              hit.getPose(referenceSpace).transform.matrix
            );
          }
        }
      });
    }
  }

  renderer.render(scene, camera);
}
