<template>
  <div class="audio-visualizer-container relative">
    <!-- 3D Visualizer Canvas -->
    <div
      ref="canvasContainer"
      class="w-full h-64 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative"
    >
      <canvas ref="canvas" class="w-full h-full"></canvas>

      <!-- Overlay Controls -->
      <div class="absolute top-4 right-4 flex gap-2">
        <button
          class="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white text-xs hover:bg-white/20 transition-colors"
          @click="toggleVisualization"
        >
          {{ isPlaying ? 'Pause Viz' : 'Start Viz' }}
        </button>
        <button
          class="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white text-xs hover:bg-white/20 transition-colors"
          @click="changeVisualizationType"
        >
          {{ visualizationType }}
        </button>
      </div>

      <!-- Audio Info Overlay -->
      <div class="absolute bottom-4 left-4 text-white">
        <div class="text-xs opacity-75">{{ fileName }}</div>
        <div class="text-xs opacity-50">
          {{ audioInfo.duration }}s | {{ audioInfo.frequency }}Hz
        </div>
      </div>
    </div>

    <!-- Audio Player -->
    <div class="mt-4 bg-white/70 backdrop-blur-md p-4 rounded-xl">
      <audio
        ref="audioElement"
        :src="audioSrc"
        controls
        preload="metadata"
        class="w-full"
        @loadedmetadata="onAudioLoaded"
        @play="onAudioPlay"
        @pause="onAudioPause"
        @timeupdate="onTimeUpdate"
        @ended="onAudioEnded"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'

// eslint-disable-next-line no-unused-vars
const props = defineProps({
  audioSrc: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    default: 'Audio File',
  },
})

const defineProps = globalThis.defineProps
const emit = defineEmits(['load', 'error', 'loadstart'])

// Animation frame functions
const requestAnimationFrame =
  globalThis.requestAnimationFrame || globalThis.webkitRequestAnimationFrame
const cancelAnimationFrame =
  globalThis.cancelAnimationFrame || globalThis.webkitCancelAnimationFrame

// Refs
const canvas = ref(null)
const canvasContainer = ref(null)
const audioElement = ref(null)

// State
const isPlaying = ref(false)
const audioInfo = ref({
  duration: 0,
  frequency: 0,
  currentTime: 0,
})

const visualizationType = ref('Bars')
const visualizationTypes = ['Bars', 'Wave', 'Sphere', 'Particles']
let currentTypeIndex = 0

// Three.js objects
let scene, camera, renderer, animationId
let analyser, dataArray, bufferLength
let audioContext, audioSource
let visualizerObjects = []

// Audio analysis
const setupAudioContext = () => {
  try {
    if (audioContext) {
      audioContext.close()
    }

    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    audioSource = audioContext.createMediaElementSource(audioElement.value)
    analyser = audioContext.createAnalyser()

    analyser.fftSize = 512
    bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)

    audioSource.connect(analyser)
    analyser.connect(audioContext.destination)

    console.log('Audio context setup complete')
  } catch (error) {
    console.error('Error setting up audio context:', error)
    emit('error', error)
  }
}

// Three.js setup
const setupThreeJS = () => {
  const container = canvasContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0a)

  // Camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.z = 50

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: true,
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 10, 5)
  scene.add(directionalLight)

  console.log('Three.js setup complete')
}

// Create visualizer objects based on type
const createVisualizerObjects = () => {
  // Clear existing objects
  visualizerObjects.forEach((obj) => scene.remove(obj))
  visualizerObjects = []

  const type = visualizationType.value.toLowerCase()

  if (type === 'bars') {
    createBars()
  } else if (type === 'wave') {
    createWave()
  } else if (type === 'sphere') {
    createSphere()
  } else if (type === 'particles') {
    createParticles()
  }
}

const createBars = () => {
  const barCount = bufferLength / 4
  const barWidth = 0.5
  const spacing = 1.2

  for (let i = 0; i < barCount; i++) {
    const geometry = new THREE.BoxGeometry(barWidth, 1, barWidth)
    const material = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(i / barCount, 0.8, 0.6),
    })

    const bar = new THREE.Mesh(geometry, material)
    bar.position.x = (i - barCount / 2) * spacing
    bar.position.y = 0

    scene.add(bar)
    visualizerObjects.push(bar)
  }
}

const createWave = () => {
  const geometry = new THREE.PlaneGeometry(80, 20, bufferLength / 8, 20)
  const material = new THREE.MeshLambertMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.8,
  })

  const wave = new THREE.Mesh(geometry, material)
  wave.rotation.x = -Math.PI / 3

  scene.add(wave)
  visualizerObjects.push(wave)
}

const createSphere = () => {
  const geometry = new THREE.SphereGeometry(15, 64, 32)
  const material = new THREE.MeshLambertMaterial({
    color: 0xff6b6b,
    wireframe: true,
    transparent: true,
    opacity: 0.7,
  })

  const sphere = new THREE.Mesh(geometry, material)
  scene.add(sphere)
  visualizerObjects.push(sphere)
}

const createParticles = () => {
  const particleCount = bufferLength * 2
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100
    positions[i * 3 + 1] = (Math.random() - 0.5) * 100
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100

    const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  })

  const particles = new THREE.Points(geometry, material)
  scene.add(particles)
  visualizerObjects.push(particles)
}

// Animation loop
const animate = () => {
  if (!isPlaying.value || !analyser) {
    return
  }

  analyser.getByteFrequencyData(dataArray)

  const type = visualizationType.value.toLowerCase()

  if (type === 'bars') {
    animateBars()
  } else if (type === 'wave') {
    animateWave()
  } else if (type === 'sphere') {
    animateSphere()
  } else if (type === 'particles') {
    animateParticles()
  }

  // Rotate camera around the scene
  const time = Date.now() * 0.0005
  camera.position.x = Math.cos(time) * 60
  camera.position.z = Math.sin(time) * 60
  camera.lookAt(scene.position)

  renderer.render(scene, camera)
  animationId = requestAnimationFrame(animate)
}

const animateBars = () => {
  visualizerObjects.forEach((bar, i) => {
    const dataIndex = Math.floor((i * dataArray.length) / visualizerObjects.length)
    const amplitude = dataArray[dataIndex] / 255

    bar.scale.y = Math.max(0.1, amplitude * 10)
    bar.material.color.setHSL((amplitude + i / visualizerObjects.length) % 1, 0.8, 0.6)
  })
}

const animateWave = () => {
  if (visualizerObjects[0]) {
    const wave = visualizerObjects[0]
    const positions = wave.geometry.attributes.position.array

    for (let i = 0; i < positions.length; i += 3) {
      const dataIndex = Math.floor(((i / 3) * dataArray.length) / (positions.length / 3))
      const amplitude = dataArray[dataIndex] / 255
      positions[i + 1] = amplitude * 20 - 10
    }

    wave.geometry.attributes.position.needsUpdate = true
    wave.rotation.z += 0.01
  }
}

const animateSphere = () => {
  if (visualizerObjects[0]) {
    const sphere = visualizerObjects[0]
    const avgAmplitude = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255

    sphere.scale.setScalar(1 + avgAmplitude * 0.5)
    sphere.rotation.y += avgAmplitude * 0.02
    sphere.rotation.x += avgAmplitude * 0.01

    sphere.material.color.setHSL((Date.now() * 0.001) % 1, 0.8, 0.5 + avgAmplitude * 0.3)
  }
}

const animateParticles = () => {
  if (visualizerObjects[0]) {
    const particles = visualizerObjects[0]
    const positions = particles.geometry.attributes.position.array

    for (let i = 0; i < positions.length; i += 3) {
      const dataIndex = Math.floor(((i / 3) * dataArray.length) / (positions.length / 3))
      const amplitude = dataArray[dataIndex] / 255

      positions[i + 1] += (amplitude - 0.5) * 2

      // Keep particles within bounds
      if (Math.abs(positions[i + 1]) > 50) {
        positions[i + 1] *= 0.8
      }
    }

    particles.geometry.attributes.position.needsUpdate = true
    particles.rotation.y += 0.005
  }
}

// Handle window resize
const handleResize = () => {
  if (!camera || !renderer || !canvasContainer.value) return

  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// Event handlers
const onAudioLoaded = () => {
  audioInfo.value.duration = audioElement.value.duration
  emit('load')
}

const onAudioPlay = async () => {
  isPlaying.value = true

  if (audioContext && audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  if (!analyser) {
    setupAudioContext()
  }

  animate()
}

const onAudioPause = () => {
  isPlaying.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
}

const onTimeUpdate = () => {
  audioInfo.value.currentTime = audioElement.value.currentTime
}

const onAudioEnded = () => {
  isPlaying.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
}

// Control functions
const toggleVisualization = () => {
  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play()
  }
}

const changeVisualizationType = () => {
  currentTypeIndex = (currentTypeIndex + 1) % visualizationTypes.length
  visualizationType.value = visualizationTypes[currentTypeIndex]
  createVisualizerObjects()
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  setupThreeJS()
  createVisualizerObjects()

  window.addEventListener('resize', handleResize)

  // Emit loadstart event
  emit('loadstart')
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

// Watch for visualization type changes
watch(visualizationType, () => {
  if (scene) {
    createVisualizerObjects()
  }
})
</script>

<style scoped>
.audio-visualizer-container {
  user-select: none;
}

canvas {
  display: block;
}

audio {
  outline: none;
}

audio::-webkit-media-controls-download-button {
  display: none !important;
}
</style>
