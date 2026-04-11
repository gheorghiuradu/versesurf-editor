import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/base.css'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

const authStore = useAuthStore()
authStore.init().then((wasOAuthCallback) => {
    if (wasOAuthCallback && authStore.isAuthenticated) {
        router.replace('/my-playlists')
    }
})

app.mount('#app')
