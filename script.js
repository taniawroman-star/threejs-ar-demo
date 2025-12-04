// Import necessary modules from Three.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth rotation
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false; // Disable panning

// Load GLB Model
const loader = new GLTFLoader();
loader.load(
  "./earth.glb", // Your specific GLB file path
  (gltf) => {
    const model = gltf.scene; // The 3D model scene from the file
    scene.add(model); // Add the model to the scene

    // Adjust model orientation to ensure the front faces the camera
    model.rotation.y = Math.PI; // Rotate the model 180 degrees (flip)

    // Position, scale, or rotate the model
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);

    // Get the bounding box of the model
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Define the chest region of interest
    const chestRegionOffset = new THREE.Vector3(0, size.y * 0.25, 0); // Adjust for the chest location
    const chestRegion = center.clone().add(chestRegionOffset);

    // Move the camera to frame the chest properly, starting in front of the statue
    const chestDistance = size.z * 2; // Distance factor to frame the chest
    camera.position.set(
      chestRegion.x,
      chestRegion.y,
      chestRegion.z + chestDistance
    );
    camera.lookAt(chestRegion);

    // Update OrbitControls target to the chest region
    controls.target.copy(chestRegion);
    controls.update();
  },
  (xhr) => {
    console.log(
      `Loading model: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}% loaded`
    );
  },
  (error) => {
    console.error("An error occurred loading the GLB model:", error);
  }
);

// Handle window resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls for smooth interactions
  controls.update();

  // Render the scene
  renderer.render(scene, camera);
}

// Start the animation loop
animate();
