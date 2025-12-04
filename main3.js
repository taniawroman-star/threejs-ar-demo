// import * as THREE from "three";
// import { ARButton } from "https://unpkg.com/three/examples/jsm/webxr/ARButton.js";
// import { GLTFLoader } from "https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js";

// let camera, scene, renderer;
// let reticle, model;

// init();
// animate();

// function init() {
//   // Scene and camera
//   scene = new THREE.Scene();
//   camera = new THREE.PerspectiveCamera(
//     70,
//     window.innerWidth / window.innerHeight,
//     0.01,
//     20
//   );

//   // Light
//   const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
//   light.position.set(0.5, 1, 0.25);
//   scene.add(light);

//   // Renderer
//   renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//   renderer.setPixelRatio(window.devicePixelRatio);
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   renderer.xr.enabled = true;
//   document.body.appendChild(renderer.domElement);

//   // AR Button
//   document.body.appendChild(
//     ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
//   );

//   // GLTF Loader
//   const loader = new GLTFLoader();
//   loader.load(
//     "/earth.glb",
//     function (gltf) {
//       model = gltf.scene;

//       // Compute bounding box and scale
//       const box = new THREE.Box3().setFromObject(model);
//       const size = box.getSize(new THREE.Vector3());
//       const maxDim = Math.max(size.x, size.y, size.z);
//       const desiredSize = 1; // 1 meter
//       const scale = desiredSize / maxDim;
//       model.scale.setScalar(scale);

//       // Center model
//       const center = box.getCenter(new THREE.Vector3());
//       model.position.sub(center.multiplyScalar(scale));

//       // Fix orientation if needed
//       model.rotation.x = -Math.PI / 2;

//       model.visible = false; // show after placement
//       scene.add(model);
//     },
//     undefined,
//     function (error) {
//       console.error("Error loading GLB:", error);
//     }
//   );

//   // Reticle for AR placement
//   const geometry = new THREE.RingGeometry(0.1, 0.11, 32).rotateX(-Math.PI / 2);
//   const material = new THREE.MeshBasicMaterial({ color: 0x0fff0f });
//   reticle = new THREE.Mesh(geometry, material);
//   reticle.matrixAutoUpdate = false;
//   reticle.visible = false;
//   scene.add(reticle);

//   // Controller for placing model
//   const controller = renderer.xr.getController(0);
//   controller.addEventListener("select", () => {
//     if (model && reticle.visible) {
//       model.position.setFromMatrixPosition(reticle.matrix);
//       model.visible = true;
//     }
//   });
//   scene.add(controller);

//   window.addEventListener("resize", onWindowResize);
// }

// function onWindowResize() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// }

// function animate() {
//   renderer.setAnimationLoop(render);
// }

// function render(timestamp, frame) {
//   if (frame) {
//     const referenceSpace = renderer.xr.getReferenceSpace();
//     const session = renderer.xr.getSession();

//     // Hit test for reticle placement
//     if (session && !reticle.visible) {
//       const viewerPose = frame.getViewerPose(referenceSpace);
//       if (viewerPose) {
//         session.requestAnimationFrame(() => {
//           const hitTestSource = session.requestHitTestSource({
//             space: renderer.xr.getReferenceSpace(),
//           });
//           if (hitTestSource) {
//             const hitTestResults = frame.getHitTestResults(hitTestSource);
//             if (hitTestResults.length > 0) {
//               const hit = hitTestResults[0];
//               reticle.visible = true;
//               reticle.matrix.fromArray(
//                 hit.getPose(referenceSpace).transform.matrix
//               );
//             }
//           }
//         });
//       }
//     }
//   }

//   renderer.render(scene, camera);
// }
