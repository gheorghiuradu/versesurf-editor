<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppToast from '@/components/AppToast.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'
import logoSmall from '@/assets/logo-small.png'

const route = useRoute()
const auth = useAuthStore()
const isHome = computed(() => route.path === '/')
</script>

<template>
  <div class="app-layout">
    <!-- Navigation -->
    <nav class="navbar" v-if="!isHome">
      <RouterLink to="/" class="nav-brand">
        <img :src="logoSmall" alt="Verse Surf" class="nav-logo" />
        <span class="nav-title">Verse Surf Editor</span>
      </RouterLink>

      <div class="nav-spacer"></div>

      <div class="nav-auth" v-if="!auth.isLoading">
        <template v-if="auth.isAuthenticated">
          <RouterLink to="/my-playlists" class="nav-link">My Playlists</RouterLink>
          <div class="nav-user">
            <img
              v-if="auth.user?.avatarUrl"
              :src="auth.user.avatarUrl"
              :alt="auth.user.displayName"
              class="nav-avatar"
            />
            <span class="nav-display-name">{{ auth.user?.displayName }}</span>
          </div>
          <button class="btn btn-ghost btn-sm" @click="auth.logout()">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-primary btn-sm">Login</RouterLink>
        </template>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <!-- Footer -->
    <AppFooter />

    <!-- Toast -->
    <AppToast />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-lg);
  background: rgba(26, 16, 22, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-border);
}

.nav-spacer {
  flex: 1;
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.nav-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 0.9rem;
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-accent);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.nav-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
}

.nav-display-name {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
  color: var(--color-text);
}

.nav-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
}

.nav-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
  background: linear-gradient(135deg, var(--color-sand), var(--color-terracotta));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main-content {
  flex: 1;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
