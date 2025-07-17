import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useActiveCardStore = defineStore('activeCard', () => {
  const activeCard = ref(undefined)

  const setActiveCard = (card) => {
    activeCard.value = card
  }

  const clearActiveCard = () => {
    activeCard.value = undefined
  }

  return {
    activeCard,
    setActiveCard,
    clearActiveCard
  }
})