// import * as THREE from "three";
// import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";
// import { GLTFLoader } from "https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js";

// // ----- On-screen debug console -----
// const logEl = document.createElement("pre");
// logEl.style.position = "fixed";
// logEl.style.bottom = "0";
// logEl.style.left = "0";
// logEl.style.width = "100%";
// logEl.style.maxHeight = "30%";
// logEl.style.overflowY = "auto";
// logEl.style.backgroundColor = "rgba(0,0,0,0.7)";
// logEl.style.color = "white";
// logEl.style.fontSize = "12px";
// logEl.style.zIndex = "9999";
// logEl.style.padding = "4px";
// logEl.style.fontFamily = "monospace";
// document.body.appendChild(logEl);

// console.oldLog = console.log;
// console.oldWarn = console.warn;
// console.oldError = console.error;

// console.log = function (...args) {
//   console.oldLog.apply(console, args);
//   logEl.textContent +=
//     args
//       .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : a))
//       .join(" ") + "\n";
//   logEl.scrollTop = logEl.scrollHeight;
// };

// console.warn = function (...args) {
//   console.oldWarn.apply(console, args);
//   logEl.textContent +=
//     "⚠️ " +
//     args
//       .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : a))
//       .join(" ") +
//     "\n";
//   logEl.scrollTop = logEl.scrollHeight;
// };

// console.error = function (...args) {
//   console.oldError.apply(console, args);
//   logEl.textContent +=
//     "❌ " +
//     args
//       .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : a))
//       .join(" ") +
//     "\n";
//   logEl.scrollTop = logEl.scrollHeight;
// };

// // ----- Existing Three.js / WebXR code -----
// let container;
// let camera, scene, renderer;
// let controller;
// let glbModel = null;

// const loader = new GLTFLoader();
// loader.load(
//   "./earth.glb",
//   (gltf) => {
//     glbModel = gltf.scene;

//     // After glbModel = gltf.scene;
//     const desiredSizeMeters = 1; // pick ~1 meter for AR
//     const overallBox = new THREE.Box3().setFromObject(glbModel);
//     const overallSize = new THREE.Vector3();
//     overallBox.getSize(overallSize);
//     const maxDim = Math.max(overallSize.x, overallSize.y, overallSize.z);
//     const scale = desiredSizeMeters / maxDim;
//     glbModel.scale.setScalar(scale);
//     console.log(
//       "Applied global scale:",
//       scale,
//       "New size:",
//       overallSize.multiplyScalar(scale)
//     );

//     const axes = new THREE.AxesHelper(0.1);
//     axes.name = "WORLD_AXES_HELPER";
//     scene.add(axes);

//     const dbgGeom = new THREE.BoxGeometry(0.02, 0.02, 0.02);
//     const dbgMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
//     const placeMarker = new THREE.Mesh(dbgGeom, dbgMat);
//     placeMarker.name = "PLACE_MARKER";
//     placeMarker.visible = false;
//     scene.add(placeMarker);

//     console.group("GLTF Hierarchy and Transforms");
//     glbModel.traverse((node) => {
//       const indent = "  ".repeat(node.name ? node.name.split("/").length : 0);
//       console.log(`${indent}Node:`, node.name || "(no-name)", {
//         type: node.type,
//         isMesh: !!node.isMesh,
//         position: node.position ? node.position.clone() : null,
//         rotation: node.rotation
//           ? { x: node.rotation.x, y: node.rotation.y, z: node.rotation.z }
//           : null,
//         quaternion: node.quaternion ? node.quaternion.clone() : null,
//         scale: node.scale ? node.scale.clone() : null,
//       });

//       if (node.isMesh) {
//         if (!node.geometry.boundingBox) {
//           node.geometry.computeBoundingBox();
//         }
//         const bbox = node.geometry.boundingBox.clone();
//         const size = new THREE.Vector3();
//         bbox.getSize(size);
//         const center = new THREE.Vector3();
//         bbox.getCenter(center);

//         console.log(
//           `   → mesh geometry bbox (local): min=${bbox.min.toArray()} max=${bbox.max.toArray()} size=${size.toArray()} center=${center.toArray()}`
//         );

//         const worldBox = new THREE.Box3().setFromObject(node);
//         const worldSize = new THREE.Vector3();
//         worldBox.getSize(worldSize);
//         const worldCenter = new THREE.Vector3();
//         worldBox.getCenter(worldCenter);
//         console.log(
//           `   → mesh bbox (world): min=${worldBox.min.toArray()} max=${worldBox.max.toArray()} size=${worldSize.toArray()} center=${worldCenter.toArray()}`
//         );
//       }
//     });
//     console.groupEnd();

//     const overallBox = new THREE.Box3().setFromObject(glbModel);
//     const overallSize = new THREE.Vector3();
//     overallBox.getSize(overallSize);
//     const overallCenter = new THREE.Vector3();
//     overallBox.getCenter(overallCenter);
//     console.log(
//       "GLB overall bounding box (world relative to glbModel's current transform):",
//       {
//         min: overallBox.min.toArray(),
//         max: overallBox.max.toArray(),
//         size: overallSize.toArray(),
//         center: overallCenter.toArray(),
//       }
//     );

//     const boxHelper = new THREE.BoxHelper(glbModel, 0x00ff00);
//     boxHelper.name = "GLB_BOX_HELPER";
//     scene.add(boxHelper);

//     const centerDistance = overallCenter.length();
//     console.log(
//       `GLB center distance from GLB root: ${centerDistance.toFixed(
//         3
//       )} units (meters).`
//     );
//     if (centerDistance > 1) {
//       console.warn(
//         "The model center is > 1m from its root origin. You probably need to recenter the model before placing it. Consider glbModel.position.sub(center) or resetting child positions."
//       );
//     }
//     if (overallSize.length() > 10) {
//       console.warn(
//         "Model is large (size > 10m). You need to apply a global scale. E.g., choose SCALE = desiredMeters / currentSizeInMeters."
//       );
//     }

//     glbModel.__debug = {
//       overallBox,
//       overallSize,
//       overallCenter,
//       recenter: function () {
//         const box = new THREE.Box3().setFromObject(glbModel);
//         const center = box.getCenter(new THREE.Vector3());
//         glbModel.position.sub(center);
//         glbModel.updateMatrixWorld(true);
//         console.log("Recentred GLB: new position:", glbModel.position.clone());
//       },
//       resetAllTransforms: function () {
//         glbModel.traverse((obj) => {
//           if (obj.isMesh) {
//             obj.position.set(0, 0, 0);
//             obj.rotation.set(0, 0, 0);
//             obj.scale.set(1, 1, 1);
//             obj.updateMatrix();
//           }
//         });
//         glbModel.position.set(0, 0, 0);
//         glbModel.rotation.set(0, 0, 0);
//         glbModel.scale.set(1, 1, 1);
//         glbModel.updateMatrixWorld(true);
//         console.log("Reset transforms for all mesh nodes and root.");
//       },
//     };

//     glbModel.visible = true;
//     scene.add(glbModel);

//     function _updateHelpers() {
//       boxHelper.update();
//       requestAnimationFrame(_updateHelpers);
//     }
//     _updateHelpers();

//     glbModel.userData._placeMarker = placeMarker;

//     console.log(
//       "GLB loaded and added to scene. Use `glbModel.__debug.recenter()` or `glbModel.__debug.resetAllTransforms()` from the console."
//     );
//     console.log(
//       "Also inspect the helpers: 'WORLD_AXES_HELPER' at origin, 'PLACE_MARKER' (red cube), and 'GLB_BOX_HELPER' (green box)."
//     );
//   },
//   undefined,
//   (err) => console.error("Failed to load GLB:", err)
// );

// init();
// animate();

// function init() {
//   container = document.createElement("div");
//   document.body.appendChild(container);

//   scene = new THREE.Scene();

//   camera = new THREE.PerspectiveCamera(
//     70,
//     window.innerWidth / window.innerHeight,
//     0.01,
//     20
//   );

//   const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
//   light.position.set(0.5, 1, 0.25);
//   scene.add(light);

//   renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//   renderer.setPixelRatio(window.devicePixelRatio);
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   renderer.xr.enabled = true;
//   renderer.outputColorSpace = THREE.SRGBColorSpace;

//   container.appendChild(renderer.domElement);

//   document.body.appendChild(ARButton.createButton(renderer));

//   controller = renderer.xr.getController(0);
//   controller.addEventListener("select", onSelect);
//   scene.add(controller);

//   window.addEventListener("resize", onWindowResize, false);
// }

// function onSelect() {
//   if (!glbModel) {
//     console.warn("onSelect called but glbModel not ready");
//     return;
//   }

//   const model = glbModel.clone(true);
//   model.scale.copy(glbModel.scale);

//   model.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
//   model.quaternion.setFromRotationMatrix(controller.matrixWorld);

//   model.updateMatrixWorld(true);
//   const worldBox = new THREE.Box3().setFromObject(model);
//   const worldCenter = new THREE.Vector3();
//   worldBox.getCenter(worldCenter);
//   const worldSize = new THREE.Vector3();
//   worldBox.getSize(worldSize);

//   const marker = scene.getObjectByName("PLACE_MARKER");
//   if (marker) {
//     marker.position.copy(model.position);
//     marker.visible = true;
//   }

//   scene.add(model);

//   console.group("Placed GLB Instance");
//   console.log("Camera position:", camera.position.clone());
//   console.log(
//     "Computed placement position (model.position):",
//     model.position.clone()
//   );
//   console.log(
//     "Model world bbox after placement: min=",
//     worldBox.min.toArray(),
//     " max=",
//     worldBox.max.toArray()
//   );
//   console.log("Model world size (m):", worldSize.toArray());
//   console.log("Model world center (m):", worldCenter.toArray());
//   console.groupEnd();

//   const d = worldCenter.distanceTo(model.position);
//   if (d > 0.1) {
//     console.warn(
//       `Placed model center is ${d.toFixed(
//         3
//       )}m away from the placement point. The model may have internal offsets.`
//     );
//   }
// }

// function onWindowResize() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// }

// function animate() {
//   renderer.setAnimationLoop(() => renderer.render(scene, camera));
// }
