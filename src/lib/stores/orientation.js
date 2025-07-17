import { defineStore } from 'pinia'
import { ref, onMounted, onUnmounted } from 'vue'

export const useOrientationStore = defineStore('orientation', () => {
  const getRawOrientation = function(e) {
    if (!e) {
      return { alpha: 0, beta: 0, gamma: 0 }
    } else {
      return { alpha: e.alpha, beta: e.beta, gamma: e.gamma }
    }
  }

  const getOrientationObject = (e) => {
    const orientation = getRawOrientation(e)
    return {
      absolute: orientation,
      relative: {
        alpha: orientation.alpha - baseOrientation.value.alpha,
        beta: orientation.beta - baseOrientation.value.beta,
        gamma: orientation.gamma - baseOrientation.value.gamma,
      }
    }
  }

  let firstReading = ref(true)
  let baseOrientation = ref(getRawOrientation())
  const orientation = ref(getOrientationObject())

  const resetBaseOrientation = () => {
    firstReading.value = true
    baseOrientation.value = getRawOrientation()
  }

  const useOrientation = () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/ondeviceorientation
    const handleOrientation = function(e) {
      if (firstReading.value) {
        firstReading.value = false
        baseOrientation.value = getRawOrientation(e)
      }

      const o = getOrientationObject(e)
      orientation.value = o
    }

    onMounted(() => {
      window.addEventListener("deviceorientation", handleOrientation, true)
    })

    onUnmounted(() => {
      window.removeEventListener("deviceorientation", handleOrientation, true)
    })

    return orientation
  }

  return {
    orientation,
    resetBaseOrientation,
    useOrientation
  }
})
