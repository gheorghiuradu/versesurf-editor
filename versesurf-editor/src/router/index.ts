import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/playlist',
      name: 'playlist',
      component: () => import('@/views/PlaylistView.vue'),
    },
    {
      path: '/playlist/song/:id',
      name: 'song',
      component: () => import('@/views/SongView.vue'),
      props: true,
    },
  ],
})

export default router
