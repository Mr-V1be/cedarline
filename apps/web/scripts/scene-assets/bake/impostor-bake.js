// Runs in headless Chromium (see ../impostors.ts): renders one tree of a glTF file from a
// hemi-octahedral grid of directions into two atlases, albedo with alpha and object-space normals.
/* global window, document */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const { modelUrl, grid, cell } = window.__bakeConfig
const PROFILE_BINS = 16

/** Hemi-octahedral decode: [-1, 1]² → upper hemisphere, y up (matches the runtime shader). */
function hemiOctDecode(u, v) {
  const px = (u + v) / 2
  const pz = (u - v) / 2
  const y = 1 - Math.abs(px) - Math.abs(pz)
  return new THREE.Vector3(px, Math.max(y, 0), pz).normalize()
}

/** Horizontal radius of the crown per height band, for the baked self-occlusion. */
function crownProfile(object, height) {
  const radii = new Array(PROFILE_BINS).fill(0.01)
  const point = new THREE.Vector3()
  object.updateWorldMatrix(true, true)
  object.traverse((child) => {
    if (!child.isMesh) return
    const positions = child.geometry.getAttribute('position')
    const step = Math.max(1, Math.floor(positions.count / 40000))
    for (let index = 0; index < positions.count; index += step) {
      point.fromBufferAttribute(positions, index).applyMatrix4(child.matrixWorld)
      const bin = Math.min(
        PROFILE_BINS - 1,
        Math.max(0, Math.floor((point.y / height) * PROFILE_BINS)),
      )
      radii[bin] = Math.max(radii[bin], Math.hypot(point.x, point.z))
    }
  })
  return radii
}

function albedoMaterial(source, profile, height) {
  const material = new THREE.MeshBasicMaterial({
    map: source.map ?? null,
    color: source.color ?? new THREE.Color('#ffffff'),
    side: THREE.DoubleSide,
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uProfile = { value: profile }
    shader.uniforms.uHeight = { value: height }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBakePosition;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvBakePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vBakePosition;\nuniform float uProfile[${PROFILE_BINS}];\nuniform float uHeight;`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float bakeShare = clamp(vBakePosition.y / uHeight, 0.0, 0.999);
        float crown = uProfile[int(bakeShare * ${PROFILE_BINS}.0)];
        float depthInCrown = smoothstep(0.1, 0.95, length(vBakePosition.xz) / max(crown, 0.01));
        diffuseColor.rgb *= mix(0.3, 1.0, depthInCrown) * mix(0.72, 1.0, smoothstep(0.0, 0.55, bakeShare));`,
      )
  }
  return material
}

const normalMaterial = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  vertexShader: `varying vec3 vNormalWorld;
    void main() {
      vNormalWorld = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `varying vec3 vNormalWorld;
    void main() {
      vec3 n = normalize(vNormalWorld) * (gl_FrontFacing ? 1.0 : -1.0);
      gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
    }`,
})

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  premultipliedAlpha: false,
  preserveDrawingBuffer: true,
})
const size = grid * cell
renderer.setPixelRatio(1)
renderer.setSize(size, size)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.setClearColor(0x000000, 0)
renderer.setScissorTest(true)
document.body.appendChild(renderer.domElement)

const gltf = await new GLTFLoader().loadAsync(modelUrl)
{
  const tree = gltf.scene
  tree.children.forEach((child) => child.position.set(0, 0, 0))
  tree.position.set(0, 0, 0)
  tree.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(tree)
  tree.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2)
  const scene = new THREE.Scene()
  scene.add(tree)
  tree.updateWorldMatrix(true, true)
  const bounds = new THREE.Box3().setFromObject(tree)
  const height = bounds.max.y
  const centreY = height / 2
  const halfWidth = Math.max(
    Math.abs(bounds.min.x),
    Math.abs(bounds.max.x),
    Math.abs(bounds.min.z),
    Math.abs(bounds.max.z),
  )
  // The frustum holds the tree from every direction: the bounding sphere around its middle.
  const radius = Math.hypot(centreY, halfWidth) * 1.02
  const profile = crownProfile(tree, height)
  const centre = new THREE.Vector3(0, centreY, 0)
  const camera = new THREE.OrthographicCamera(-radius, radius, radius, -radius, 0.01, radius * 4)

  const originals = new Map()
  tree.traverse((child) => {
    if (child.isMesh) originals.set(child, child.material)
  })
  const pass = (materialFor) => {
    for (const [mesh, original] of originals) mesh.material = materialFor(original)
    renderer.setScissor(0, 0, size, size)
    renderer.setViewport(0, 0, size, size)
    renderer.clear()
    for (let j = 0; j < grid; j += 1) {
      for (let i = 0; i < grid; i += 1) {
        const direction = hemiOctDecode((i / (grid - 1)) * 2 - 1, (j / (grid - 1)) * 2 - 1)
        camera.position.copy(centre).addScaledVector(direction, radius * 2)
        camera.up.set(0, 1, 0)
        camera.lookAt(centre)
        camera.updateProjectionMatrix()
        // Atlas rows run top to bottom like the image; WebGL viewports from the bottom.
        renderer.setViewport(i * cell, (grid - 1 - j) * cell, cell, cell)
        renderer.setScissor(i * cell, (grid - 1 - j) * cell, cell, cell)
        renderer.render(scene, camera)
      }
    }
    return renderer.domElement.toDataURL('image/png')
  }
  const albedoCache = new Map()
  const albedo = pass((original) => {
    if (!albedoCache.has(original))
      albedoCache.set(original, albedoMaterial(original, profile, height))
    return albedoCache.get(original)
  })
  const normal = pass(() => normalMaterial)
  window.__bakeResult = { albedo, normal, height, radius, centreY }
}
