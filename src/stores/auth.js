import { computed, reactive } from 'vue'
import { useUserManagement } from './userManagement'
import userService from '@/services/userService'
import apiClient, { setUnauthorizedHandler } from '@/services/apiClient'

const STORAGE_USER = 'tracer_auth_user'
const STORAGE_ACCOUNTS = 'tracer_admin_accounts'
const STORAGE_TOKEN = 'tracer_auth_token'

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=60'
const LOCAL_TOKEN_EXP_MS = 24 * 60 * 60 * 1000 // 24 jam

const state = reactive({
  user: null,
  accounts: [],
  token: null,
  tokenExpiresAt: null,
})

const saveAccounts = () => {
  localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(state.accounts))
}

const loadAccounts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS)
    if (raw) {
      state.accounts = JSON.parse(raw)
    }
  } catch (e) {
    state.accounts = []
  }

  // siapkan akun default jika belum ada
  if (!state.accounts.length) {
    state.accounts = [
      {
        id: 'local-super-admin',
        email: 'admin@tracer.local',
        password: 'admin123',
        name: 'Admin Tracer',
        fullName: 'Anita Rahmania',
        username: 'admin',
        avatar: DEFAULT_AVATAR,
        role: 'Super Admin',
        status: 'Aktif',
      },
    ]
    saveAccounts()
  }
}

const loadUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_USER)
    if (raw) {
      state.user = JSON.parse(raw)
    }
  } catch (e) {
    state.user = null
  }
}

const saveUser = (user) => {
  localStorage.setItem(STORAGE_USER, JSON.stringify(user))
}

const saveToken = (token, expiresAt) => {
  const payload = { token, expiresAt }
  localStorage.setItem(STORAGE_TOKEN, JSON.stringify(payload))
}

const loadToken = () => {
  try {
    const raw = localStorage.getItem(STORAGE_TOKEN)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.token) {
        state.token = parsed.token
        state.tokenExpiresAt = parsed.expiresAt || null
        apiClient.setAuthToken(parsed.token)
      }
    }
  } catch (e) {
    state.token = null
    state.tokenExpiresAt = null
  }
}

const clearToken = () => {
  state.token = null
  state.tokenExpiresAt = null
  localStorage.removeItem(STORAGE_TOKEN)
  apiClient.clearAuthToken()
}

loadAccounts()
loadUser()
loadToken()

export const useAuth = () => {
  const currentUser = computed(() => state.user)
  const isAuthenticated = computed(() => !!state.user && !!state.token)
  const userManagement = useUserManagement()

  const isTokenExpired = () => {
    if (!state.token) return true
    if (!state.tokenExpiresAt) return false
    return Date.now() > new Date(state.tokenExpiresAt).getTime()
  }

  const decodeJwtExp = (token) => {
    if (!token) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    try {
      const payload = JSON.parse(atob(parts[1]))
      if (payload?.exp) {
        return new Date(payload.exp * 1000).toISOString()
      }
    } catch (e) {
      return null
    }
    return null
  }

  const buildAccountList = () => {
    const merged = new Map()

    state.accounts.forEach((acc) => {
      if (!acc?.email) return
      merged.set(acc.email.toLowerCase(), { ...acc, source: 'auth' })
    })

    const managedUsers = userManagement?.users?.value || []
    managedUsers.forEach((u) => {
      if (!u?.email) return
      const emailKey = u.email.toLowerCase()
      merged.set(emailKey, {
        id: u.id,
        email: u.email,
        password: u.password || '',
        name: u.fullName || u.name,
        fullName: u.fullName || u.name,
        username: u.username || (u.email ? u.email.split('@')[0] : ''),
        avatar: u.avatar || DEFAULT_AVATAR,
        role: u.role,
        status: u.status || 'Aktif',
        source: 'userManagement',
      })
    })

    return Array.from(merged.values())
  }

const login = (email, password) => {
  const targetEmail = (email || '').toLowerCase()
  const doLocalLogin = () => {
    const accounts = buildAccountList()
    const match = accounts.find(
      (acc) =>
        acc.email?.toLowerCase() === targetEmail &&
          acc.password === password &&
          (acc.status || 'Aktif') === 'Aktif',
    )
    if (!match) return false
    const user = {
      id: match.id,
      email: match.email,
        name: match.fullName || match.name || 'Admin',
        fullName: match.fullName || match.name || 'Admin',
        username: match.username || '',
        avatar: match.avatar || DEFAULT_AVATAR,
      role: match.role || 'Admin',
      status: match.status || 'Aktif',
    }
    state.user = user
    saveUser(user)
    const exp = new Date(Date.now() + LOCAL_TOKEN_EXP_MS).toISOString()
    state.token = 'local-token'
    state.tokenExpiresAt = exp
    saveToken(state.token, exp)
    apiClient.setAuthToken(state.token)
    return true
  }

    return userService
      .login({ email, password })
      .then((resp) => {
        if (resp?.token) {
          const exp =
            resp.expiresAt ||
            (resp.expiresIn ? new Date(Date.now() + resp.expiresIn * 1000).toISOString() : decodeJwtExp(resp.token))
          state.token = resp.token
          state.tokenExpiresAt = exp
          saveToken(resp.token, exp)
          apiClient.setAuthToken(resp.token)
        }
        const profile = resp?.user
        if (profile) {
          const user = {
            id: profile.id,
            email: profile.email,
            name: profile.fullName || profile.name || 'Admin',
            fullName: profile.fullName || profile.name || 'Admin',
            username: profile.username || '',
            avatar: profile.avatar || DEFAULT_AVATAR,
            role: profile.role || 'Admin',
            status: profile.status || 'Aktif',
          }
          state.user = user
          saveUser(user)
          return true
        }
        return doLocalLogin()
      })
      .catch(() => doLocalLogin())
}

  const logout = () => {
    state.user = null
    localStorage.removeItem(STORAGE_USER)
    clearToken()
  }

  const updateProfile = (updates) => {
    if (!state.user) return false

    const managedUser = userManagement?.users?.value?.find((u) => u.id === state.user.id)
    if (managedUser) {
      const payload = {
        ...updates,
        name: updates.fullName || updates.name || managedUser.name,
        fullName: updates.fullName || managedUser.fullName || managedUser.name,
        username: updates.username ?? managedUser.username,
      }

      if (!updates.password) {
        delete payload.password
      }

      try {
        userManagement.updateUser(managedUser.id, payload)
      } catch (e) {
        return false
      }

      const refreshed =
        userManagement.users.value.find((u) => u.id === managedUser.id) || {
          ...managedUser,
          ...payload,
        }

      const updatedUser = {
        id: refreshed.id,
        email: refreshed.email,
        name: refreshed.fullName || refreshed.name || 'Admin',
        fullName: refreshed.fullName || refreshed.name || 'Admin',
        username: refreshed.username || '',
        avatar: updates.avatar || state.user.avatar || DEFAULT_AVATAR,
        role: refreshed.role,
        status: refreshed.status || 'Aktif',
      }

      state.user = updatedUser
      saveUser(updatedUser)

      return true
    }

    const idx = state.accounts.findIndex((acc) => acc.email === state.user.email)
    if (idx === -1) return false

    const current = state.accounts[idx]

    const updatedAccount = {
      ...current,
      email: updates.email || current.email,
      password: updates.password || current.password,
      name: updates.fullName || updates.name || current.name,
      fullName: updates.fullName || current.fullName || current.name,
      username: updates.username ?? current.username,
      avatar: updates.avatar || current.avatar || DEFAULT_AVATAR,
      role: updates.role || current.role,
    }

    state.accounts.splice(idx, 1, updatedAccount)
    saveAccounts()

    const updatedUser = {
      id: updatedAccount.id,
      email: updatedAccount.email,
      name: updatedAccount.fullName || updatedAccount.name || 'Admin',
      fullName: updatedAccount.fullName || updatedAccount.name || 'Admin',
      username: updatedAccount.username || '',
      avatar: updatedAccount.avatar || DEFAULT_AVATAR,
      role: updatedAccount.role || state.user.role,
    }

    state.user = updatedUser
    saveUser(updatedUser)

    return true
  }

  return {
    user: currentUser,
    isAuthenticated,
    isTokenExpired,
    login,
    logout,
    accounts: computed(() => state.accounts),
    updateProfile,
  }
}

// auto logout on 401 from apiClient
setUnauthorizedHandler(() => {
  state.user = null
  clearToken()
  localStorage.removeItem(STORAGE_USER)
})
