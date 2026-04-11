import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import nhost from '@/lib/nhost'
import type { User } from '@nhost/nhost-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)

  const isAuthenticated = computed(() => user.value !== null)

  async function init(): Promise<boolean> {
    // Handle OAuth callback — nhost redirects back with ?refreshToken=XXX
    const params = new URLSearchParams(window.location.search)
    const callbackRefreshToken = params.get('refreshToken')
    if (callbackRefreshToken) {
      try {
        const { body, status } = await nhost.auth.refreshToken({
          refreshToken: callbackRefreshToken,
        })
        if (status === 200 && body) {
          nhost.sessionStorage.set(body)
          user.value = body.user ?? await fetchUser()
        }
      } catch {
        // token exchange failed — fall through to normal init
      }
      // Clean the URL regardless of success
      const url = new URL(window.location.href)
      url.searchParams.delete('refreshToken')
      window.history.replaceState({}, '', url.toString())
      isLoading.value = false
      return true // was OAuth callback
    }

    const session = nhost.getUserSession()
    if (session) {
      user.value = await fetchUser()
    } else {
      // Try refreshing the session (handles page reload with stored refresh token)
      const refreshed = await nhost.refreshSession(0)
      if (refreshed) {
        user.value = await fetchUser()
      }
    }
    isLoading.value = false
    return false
  }

  async function fetchUser(): Promise<User | null> {
    try {
      const { body } = await nhost.auth.getUser()
      return body
    } catch {
      return null
    }
  }

  function loginWithSpotify() {
    const url = nhost.auth.signInProviderURL('spotify')
    window.location.href = url
  }

  function loginWithDiscord() {
    const url = nhost.auth.signInProviderURL('discord')
    window.location.href = url
  }

  async function logout() {
    const session = nhost.getUserSession()
    try {
      await nhost.auth.signOut({
        refreshToken: session?.refreshTokenId,
        all: false,
      })
    } catch {
      // ignore sign-out errors
    }
    nhost.clearSession()
    user.value = null
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    init,
    loginWithSpotify,
    loginWithDiscord,
    logout,
  }
})
