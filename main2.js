import * as THREE from "three";
import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js";

let container;
let camera, scene, renderer;
let controller;
let glbModel = null;

// ----- Debugging loader + placement (drop in to replace your current loader & onSelect) -----
const loader = new GLTFLoader();
loader.load(
  "./earth.glb",
  (gltf) => {
    glbModel = gltf.scene;

    // 1) Add a visual axes helper at world origin so you can see the real origin in AR
    const axes = new THREE.AxesHelper(0.1); // 10cm axes
    axes.name = "WORLD_AXES_HELPER";
    scene.add(axes);

    // 2) Add a visible tiny cube that will show where we place objects
    const dbgGeom = new THREE.BoxGeometry(0.02, 0.02, 0.02); // 2 cm cube
    const dbgMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const placeMarker = new THREE.Mesh(dbgGeom, dbgMat);
    placeMarker.name = "PLACE_MARKER";
    placeMarker.visible = false;
    scene.add(placeMarker);

    // 3) Print hierarchical info for every node
    console.group("GLTF Hierarchy and Transforms");
    glbModel.traverse((node) => {
      // Basic node info
      const indent = "  ".repeat(node.name ? node.name.split("/").length : 0);
      console.log(`${indent}Node:`, node.name || "(no-name)", {
        type: node.type,
        isMesh: !!node.isMesh,
        position: node.position ? node.position.clone() : null,
        rotation: node.rotation
          ? { x: node.rotation.x, y: node.rotation.y, z: node.rotation.z }
          : null,
        quaternion: node.quaternion ? node.quaternion.clone() : null,
        scale: node.scale ? node.scale.clone() : null,
      });

      // If it's a mesh, compute its local bounding box, size and center (in local space)
      if (node.isMesh) {
        // Ensure geometry bounding box exists
        if (!node.geometry.boundingBox) {
          node.geometry.computeBoundingBox();
        }
        const bbox = node.geometry.boundingBox.clone(); // local geometry bbox
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        console.log(
          `   → mesh geometry bbox (local): min=${bbox.min.toArray()} max=${bbox.max.toArray()} size=${size.toArray()} center=${center.toArray()}`
        );

        // Also compute world-space bbox for this mesh (useful if transforms are applied in nodes)
        const worldBox = new THREE.Box3().setFromObject(node);
        const worldSize = new THREE.Vector3();
        worldBox.getSize(worldSize);
        const worldCenter = new THREE.Vector3();
        worldBox.getCenter(worldCenter);
        console.log(
          `   → mesh bbox (world): min=${worldBox.min.toArray()} max=${worldBox.max.toArray()} size=${worldSize.toArray()} center=${worldCenter.toArray()}`
        );
      }
    });
    console.groupEnd();

    // 4) Compute overall bounding box for the whole glbModel
    const overallBox = new THREE.Box3().setFromObject(glbModel);
    const overallSize = new THREE.Vector3();
    overallBox.getSize(overallSize);
    const overallCenter = new THREE.Vector3();
    overallBox.getCenter(overallCenter);
    console.log(
      "GLB overall bounding box (world relative to glbModel's current transform):",
      {
        min: overallBox.min.toArray(),
        max: overallBox.max.toArray(),
        size: overallSize.toArray(),
        center: overallCenter.toArray(),
      }
    );

    // 5) Add a BoxHelper so you can visually inspect where the model is
    const boxHelper = new THREE.BoxHelper(glbModel, 0x00ff00);
    boxHelper.name = "GLB_BOX_HELPER";
    scene.add(boxHelper);

    // 6) If the model is far from origin or huge, print suggestions
    const centerDistance = overallCenter.length();
    console.log(
      `GLB center distance from GLB root: ${centerDistance.toFixed(
        3
      )} units (meters).`
    );
    if (centerDistance > 1) {
      console.warn(
        "The model center is > 1m from its root origin. You probably need to recenter the model before placing it. Consider glbModel.position.sub(center) or resetting child positions."
      );
    }
    if (overallSize.length() > 10) {
      console.warn(
        "Model is large (size > 10m). You need to apply a global scale. E.g., choose SCALE = desiredMeters / currentSizeInMeters."
      );
    }

    // 7) EXPOSE utilities on the model to help debugging from console manually:
    glbModel.__debug = {
      overallBox,
      overallSize,
      overallCenter,
      recenter: function () {
        // shift model so its bounding-box center is at origin
        const box = new THREE.Box3().setFromObject(glbModel);
        const center = box.getCenter(new THREE.Vector3());
        glbModel.position.sub(center);
        glbModel.updateMatrixWorld(true);
        console.log("Recentred GLB: new position:", glbModel.position.clone());
      },
      resetAllTransforms: function () {
        glbModel.traverse((obj) => {
          if (obj.isMesh) {
            obj.position.set(0, 0, 0);
            obj.rotation.set(0, 0, 0);
            obj.scale.set(1, 1, 1);
            obj.updateMatrix();
          }
        });
        glbModel.position.set(0, 0, 0);
        glbModel.rotation.set(0, 0, 0);
        glbModel.scale.set(1, 1, 1);
        glbModel.updateMatrixWorld(true);
        console.log("Reset transforms for all mesh nodes and root.");
      },
    };

    // 8) Add to the scene but keep it invisible or visible depending on what you want to test:
    // If you want to preview immediately, set visible = true. If not, keep visible = false and show when placed.
    glbModel.visible = true;
    scene.add(glbModel);

    // make helpers update each frame (box helper)
    function _updateHelpers() {
      boxHelper.update();
      requestAnimationFrame(_updateHelpers);
    }
    _updateHelpers();

    // 9) Update debug place marker when placing in onSelect (we'll use this later)
    // Save pointer to placeMarker on the model for use in onSelect
    glbModel.userData._placeMarker = placeMarker;

    // Final log: tell user the model is loaded and how to run helper commands
    console.log(
      "GLB loaded and added to scene. Use `glbModel.__debug.recenter()` or `glbModel.__debug.resetAllTransforms()` from the console."
    );
    console.log(
      "Also inspect the helpers: 'WORLD_AXES_HELPER' at origin, 'PLACE_MARKER' (red cube), and 'GLB_BOX_HELPER' (green box)."
    );
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

  // Important: NO hit-test
  document.body.appendChild(ARButton.createButton(renderer));

  // Controller that fires select events
  controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  window.addEventListener("resize", onWindowResize, false);
}

// ----- Replace your onSelect with this debug-aware version -----
function onSelect() {
  if (!glbModel) {
    console.warn("onSelect called but glbModel not ready");
    return;
  }

  // clone and keep the same scale/transform
  const model = glbModel.clone(true);
  model.scale.copy(glbModel.scale); // ensure clone keeps visible scaling

  // Compute placement using controller matrix (same as your working cylinder code)
  model.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
  model.quaternion.setFromRotationMatrix(controller.matrixWorld);

  // Compute world bbox and center for the clone (after applying world transform)
  model.updateMatrixWorld(true);
  const worldBox = new THREE.Box3().setFromObject(model);
  const worldCenter = new THREE.Vector3();
  worldBox.getCenter(worldCenter);
  const worldSize = new THREE.Vector3();
  worldBox.getSize(worldSize);

  // Add a visible marker at the intended placement location
  const marker = scene.getObjectByName("PLACE_MARKER");
  if (marker) {
    marker.position.copy(model.position);
    marker.visible = true;
  }

  scene.add(model);

  // Log placement info
  console.group("Placed GLB Instance");
  console.log("Camera position:", camera.position.clone());
  console.log(
    "Computed placement position (model.position):",
    model.position.clone()
  );
  console.log(
    "Model world bbox after placement: min=",
    worldBox.min.toArray(),
    " max=",
    worldBox.max.toArray()
  );
  console.log("Model world size (m):", worldSize.toArray());
  console.log("Model world center (m):", worldCenter.toArray());
  console.groupEnd();

  // If the placed object is far from the intended placement, give warning
  const d = worldCenter.distanceTo(model.position);
  if (d > 0.1) {
    console.warn(
      `Placed model center is ${d.toFixed(
        3
      )}m away from the placement point. The model may have internal offsets.`
    );
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
}
