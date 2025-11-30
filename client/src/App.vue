<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { onMounted } from 'vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.checkAuth()
})
</script>

<template>
  <RouterView />
</template>

<style>
/* Background pattern */
#app {
  background: 
    radial-gradient(ellipse at 20% 0%, rgba(0, 212, 255, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(153, 51, 255, 0.08) 0%, transparent 50%),
    var(--bg-primary);
}
</style>

