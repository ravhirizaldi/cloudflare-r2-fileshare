<template>
  <div class="audio-3d-container h-full">
    <!-- 3D Visualizer -->
    <div
      ref="visualizerContainer"
      :class="[
        'w-full relative overflow-hidden',
        fullScreen
          ? 'h-full rounded-none bg-gradient-to-br from-gray-900 to-purple-800'
          : 'h-48 rounded-xl bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
      ]"
    >
      <canvas ref="canvas" class="w-full h-full"></canvas>

      <!-- Controls overlay -->
      <div class="absolute top-2 right-2 flex gap-1">
        <button
          class="px-2 py-1 bg-black/30 backdrop-blur-sm rounded text-white text-xs hover:bg-black/50 transition-colors flex items-center justify-center"
          @click="toggleVisualization"
        >
          <!-- Play/Pause SVG Icon -->
          <svg
            v-if="!isActive"
            class="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg
            v-else
            class="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        </button>
        <button
          class="px-2 py-1 bg-black/30 backdrop-blur-sm rounded text-white text-xs hover:bg-black/50 transition-colors"
          @click="nextVisualizationType"
        >
          {{ currentType }}
        </button>
      </div>

      <!-- Info overlay -->
      <div class="absolute bottom-2 left-2 text-white text-xs opacity-75">
        <div>{{ fileName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  audioElement: {
    type: Object, // HTMLAudioElement
    default: null,
  },
  fileName: {
    type: String,
    default: 'Audio File',
  },
  isPlaying: {
    type: Boolean,
    default: false,
  },
  fullScreen: {
    type: Boolean,
    default: false,
  },
})

// Animation frame functions
const requestAnimationFrame =
  globalThis.requestAnimationFrame || globalThis.webkitRequestAnimationFrame
const cancelAnimationFrame =
  globalThis.cancelAnimationFrame || globalThis.webkitCancelAnimationFrame

// Refs
const canvas = ref(null)
const visualizerContainer = ref(null)

// State
const isActive = ref(false)
const currentType = ref('Bars')
const visualizationTypes = ['Bars', 'Wave', 'Sphere']
let typeIndex = 0

// Three.js objects
let scene, camera, renderer, animationId
let analyser, dataArray, bufferLength
let audioContext, audioSource
let visualizerObjects = []
let isSetup = false

// Audio setup
const setupAudioAnalysis = () => {
  if (!props.audioElement || isSetup) return

  try {
    // Close existing context if any
    if (audioContext) {
      audioContext.close()
    }

    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    audioSource = audioContext.createMediaElementSource(props.audioElement)
    analyser = audioContext.createAnalyser()

    analyser.fftSize = 256
    bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)

    // Connect audio nodes
    audioSource.connect(analyser)
    analyser.connect(audioContext.destination)

    isSetup = true
    console.log('Audio analysis setup complete')
  } catch (error) {
    console.error('Audio setup error:', error)
  }
}

// Three.js setup
const setupThreeJS = () => {
  const container = visualizerContainer.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f0f23)

  // Camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(0, 10, 30)

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: true,
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x808080, 1.2) // Much brighter ambient light
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffffff, 2, 100) // Brighter point light
  pointLight.position.set(0, 10, 10)
  scene.add(pointLight)

  // Add additional lights for better visibility
  const pointLight2 = new THREE.PointLight(0x88aaff, 1.5, 100)
  pointLight2.position.set(-10, -5, -10)
  scene.add(pointLight2)

  const pointLight3 = new THREE.PointLight(0xff88aa, 1.5, 100)
  pointLight3.position.set(10, -5, -10)
  scene.add(pointLight3)

  createVisualization()
}

// Create visualization objects
const createVisualization = () => {
  // Clear existing objects
  visualizerObjects.forEach((obj) => scene.remove(obj))
  visualizerObjects = []

  if (currentType.value === 'Bars') {
    createBars()
  } else if (currentType.value === 'Wave') {
    createWave()
  } else if (currentType.value === 'Sphere') {
    createSphere()
  }
}

const createBars = () => {
  const barCount = Math.min(64, bufferLength || 128)
  for (let i = 0; i < barCount; i++) {
    const geometry = new THREE.BoxGeometry(0.8, 1, 0.8)
    const hue = i / barCount
    const material = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(hue, 0.9, 0.8), // Brighter colors
      emissive: new THREE.Color().setHSL(hue, 0.3, 0.1), // Add emissive glow
    })

    const bar = new THREE.Mesh(geometry, material)
    const angle = (i / barCount) * Math.PI * 2
    bar.position.x = Math.cos(angle) * 15
    bar.position.z = Math.sin(angle) * 15
    bar.position.y = 0

    scene.add(bar)
    visualizerObjects.push(bar)
  }
}

const createWave = () => {
  const geometry = new THREE.PlaneGeometry(40, 20, 32, 16)
  const material = new THREE.MeshLambertMaterial({
    color: 0x44ffcc, // Brighter cyan
    wireframe: true,
    transparent: true,
    opacity: 0.9, // More opaque
    emissive: 0x002244, // Add emissive glow
  })

  const wave = new THREE.Mesh(geometry, material)
  wave.rotation.x = -Math.PI / 4
  wave.position.y = -5

  scene.add(wave)
  visualizerObjects.push(wave)
}

const createSphere = () => {
  const geometry = new THREE.SphereGeometry(10, 32, 16)
  const material = new THREE.MeshLambertMaterial({
    color: 0xff6666, // Brighter red
    wireframe: true,
    transparent: true,
    opacity: 0.95, // More opaque
    emissive: 0x441111, // Add emissive glow
  })

  const sphere = new THREE.Mesh(geometry, material)
  scene.add(sphere)
  visualizerObjects.push(sphere)
}

// Animation
const animate = () => {
  if (!isActive.value || !analyser) return

  analyser.getByteFrequencyData(dataArray)

  if (currentType.value === 'Bars') {
    animateBars()
  } else if (currentType.value === 'Wave') {
    animateWave()
  } else if (currentType.value === 'Sphere') {
    animateSphere()
  }

  // Auto-rotate camera (except for Wave mode to keep it stationary)
  if (currentType.value !== 'Wave') {
    const time = Date.now() * 0.001
    camera.position.x = Math.cos(time * 0.5) * 35
    camera.position.z = Math.sin(time * 0.5) * 35
    camera.lookAt(0, 0, 0)
  }

  renderer.render(scene, camera)
  animationId = requestAnimationFrame(animate)
}

const animateBars = () => {
  visualizerObjects.forEach((bar, i) => {
    const dataIndex = Math.floor((i * dataArray.length) / visualizerObjects.length)
    const amplitude = dataArray[dataIndex] / 255

    bar.scale.y = Math.max(0.1, amplitude * 5 + 0.5)
    bar.position.y = bar.scale.y * 0.5

    const hue = (amplitude + i / visualizerObjects.length) % 1
    bar.material.color.setHSL(hue, 0.9, 0.7 + amplitude * 0.3) // Brighter colors
    bar.material.emissive.setHSL(hue, 0.4, amplitude * 0.2) // Dynamic emissive
  })
}

const animateWave = () => {
  if (visualizerObjects[0]) {
    const wave = visualizerObjects[0]
    const positions = wave.geometry.attributes.position
    const originalPositions = positions.array

    for (let i = 0; i < originalPositions.length; i += 3) {
      const dataIndex = Math.floor(((i / 3) * dataArray.length) / (originalPositions.length / 3))
      const amplitude = dataArray[dataIndex] / 255
      originalPositions[i + 1] = amplitude * 10 - 5
    }

    positions.needsUpdate = true
    // Removed wave.rotation.z += 0.01 to stop the spinning effect
  }
}

const animateSphere = () => {
  if (visualizerObjects[0]) {
    const sphere = visualizerObjects[0]
    const avgAmplitude = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255

    sphere.scale.setScalar(1 + avgAmplitude * 0.5)
    sphere.rotation.y += 0.02
    sphere.rotation.x += 0.01

    const hue = (Date.now() * 0.001) % 1
    sphere.material.color.setHSL(hue, 0.9, 0.6 + avgAmplitude * 0.4) // Brighter colors
    sphere.material.emissive.setHSL(hue, 0.5, avgAmplitude * 0.3) // Dynamic emissive
  }
}

// Controls
const toggleVisualization = () => {
  if (!props.audioElement) return

  if (isActive.value) {
    // Pause audio
    props.audioElement.pause()
  } else {
    // Play audio
    props.audioElement.play().catch(console.error)
  }
}

const nextVisualizationType = () => {
  typeIndex = (typeIndex + 1) % visualizationTypes.length
  currentType.value = visualizationTypes[typeIndex]
  createVisualization()
}

// Handle resize
const handleResize = () => {
  if (!camera || !renderer || !visualizerContainer.value) return

  const width = visualizerContainer.value.clientWidth
  const height = visualizerContainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  setupThreeJS()
  window.addEventListener('resize', handleResize)

  // Setup audio if element is already available
  if (props.audioElement) {
    setupAudioAnalysis()
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (audioContext) {
    audioContext.close()
  }

  if (renderer) {
    renderer.dispose()
  }

  window.removeEventListener('resize', handleResize)
})

// Watch for audio playing state
const watchAudioState = async () => {
  if (props.isPlaying && !isActive.value) {
    isActive.value = true
    if (!isSetup && props.audioElement) {
      setupAudioAnalysis()
    }
    // Resume audio context if suspended
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
        console.log('Audio context resumed')
      } catch (error) {
        console.error('Error resuming audio context:', error)
      }
    }
    animate()
  } else if (!props.isPlaying && isActive.value) {
    isActive.value = false
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }
}

// Watch for props changes
watch(() => props.isPlaying, watchAudioState)
watch(
  () => props.audioElement,
  (newElement) => {
    if (newElement && !isSetup) {
      setupAudioAnalysis()
      // Add event listeners
      newElement.addEventListener('play', watchAudioState)
      newElement.addEventListener('pause', watchAudioState)

      // If audio is already playing when element becomes available, start visualization
      if (props.isPlaying) {
        watchAudioState()
      }
    }
  },
)
</script>

<style scoped>
.audio-3d-container {
  user-select: none;
  -webkit-user-select: none;
}

canvas {
  display: block;
}
</style>
