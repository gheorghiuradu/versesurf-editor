import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/playlist/:id',
      name: 'playlist-detail',
      component: () => import('@/views/PlaylistDetailView.vue'),
      props: true,
    },
    {
      path: '/my-playlists',
      name: 'my-playlists',
      component: () => import('@/views/MyPlaylistsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/editor/:id?',
      name: 'editor',
      component: () => import('@/views/PlaylistView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/editor/:id/song/:songId',
      name: 'song',
      component: () => import('@/views/SongView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    // Wait for auth to finish loading
    if (auth.isLoading) {
      await new Promise<void>((resolve) => {
        const stop = setInterval(() => {
          if (!auth.isLoading) {
            clearInterval(stop)
            resolve()
          }
        }, 50)
      })
    }
    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }
})

export default router
