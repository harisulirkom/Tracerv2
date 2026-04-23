import { computed, reactive } from 'vue'
import { useUserManagement } from './userManagement'
import userService from '@/services/userService'
import { setAuthToken as setApiAuthToken, clearAuthToken as clearApiAuthToken } from '@/services/api'
import { ensurePasswordHash, verifyPassword } from '@/utils/password'

const STORAGE_USER = 'tracer_auth_user'
const STORAGE_ACCOUNTS = 'tracer_admin_accounts'
const STORAGE_TOKEN = 'tracer_auth_token'
const STORAGE_AVATARS = 'tracer_auth_avatars'
const canUseApi = !!import.meta.env.VITE_API_BASE_URL
const ENABLE_LOCAL_AUTH_FALLBACK =
  String(import.meta.env.VITE_ENABLE_LOCAL_AUTH_FALLBACK || '').trim().toLowerCase() === 'true'

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=60'
const LOCAL_TOKEN_EXP_MS = 24 * 60 * 60 * 1000 // 24 jam
const LOCAL_DEFAULT_PASSWORD = 'admin123'
const LOCAL_DEFAULT_PASSWORD_HASH = ensurePasswordHash(LOCAL_DEFAULT_PASSWORD, LOCAL_DEFAULT_PASSWORD)
const ROLE_ID_MAP = {
  1: 'Super Admin',
  2: 'Admin Universitas',
  3: 'Admin Fakultas',
  4: 'Admin Prodi',
}
const ROLE_NAME_MAP = {
  'super admin': 'Super Admin',
  'superadmin': 'Super Admin',
  admin: 'Admin Universitas',
  'admin universitas': 'Admin Universitas',
  'admin fakultas': 'Admin Fakultas',
  'admin prodi': 'Admin Prodi',
  'admin program studi': 'Admin Prodi',
}

const normalizeRoleLabel = (roleValue) => {
  if (roleValue && typeof roleValue === 'object') {
    const candidate =
      roleValue.role_name ||
      roleValue.roleName ||
      roleValue.role_id ||
      roleValue.roleId ||
      roleValue.name ||
      roleValue.label ||
      roleValue.title ||
      roleValue.role ||
      roleValue.nama ||
      roleValue.id ||
      ''
    return normalizeRoleLabel(candidate)
  }
  const numeric =
    typeof roleValue === 'number'
      ? roleValue
      : typeof roleValue === 'string' && roleValue.trim() && !Number.isNaN(Number(roleValue))
        ? Number(roleValue)
        : null
  if (numeric !== null) {
    return ROLE_ID_MAP[numeric] || String(numeric)
  }
  const key = String(roleValue || '').trim().toLowerCase()
  if (!key) return ''
  return ROLE_NAME_MAP[key] || String(roleValue).trim()
}

const state = reactive({
  user: null,
  accounts: [],
  token: null,
  tokenExpiresAt: null,
})

let avatarMap = {}
let profileSyncAttempted = false

const loadAvatarMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_AVATARS)
    if (raw) {
      avatarMap = JSON.parse(raw)
      return
    }
  } catch (e) {
    // ignore parse failures
  }
  avatarMap = {}
}

const saveAvatarMap = () => {
  try {
    localStorage.setItem(STORAGE_AVATARS, JSON.stringify(avatarMap))
  } catch (e) {
    // ignore storage errors
  }
}

const getStoredAvatar = (email = '') => {
  if (!email) return null
  const key = email.toLowerCase()
  const value = avatarMap[key]
  return value || null
}

const storeAvatarForEmail = (email, avatarUrl) => {
  if (!email || !avatarUrl) return
  const key = email.toLowerCase()
  if (avatarMap[key] === avatarUrl) return
  avatarMap[key] = avatarUrl
  saveAvatarMap()
}

const normalizeAvatarValue = (value) => {
  const text = String(value || '').trim()
  return text || null
}

const mergeAvatarWithEmail = (email, candidate) =>
  normalizeAvatarValue(candidate) || getStoredAvatar(email) || DEFAULT_AVATAR

loadAvatarMap()
const saveAccounts = () => {
  localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(state.accounts))
}

const ensureAccountIntegrity = () => {
  state.accounts = state.accounts.map((acc) => ({
    ...acc,
    password: ensurePasswordHash(acc.password, LOCAL_DEFAULT_PASSWORD),
  }))
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

  ensureAccountIntegrity()

  // siapkan akun default jika belum ada
  if (!state.accounts.length) {
    state.accounts = [
      {
        id: 'local-super-admin',
        email: 'admin@tracer.local',
        password: LOCAL_DEFAULT_PASSWORD_HASH,
        name: 'Admin Tracer',
        fullName: 'Anita Rahmania',
        username: 'admin',
        avatar: DEFAULT_AVATAR,
        role: 'Super Admin',
        status: 'Aktif',
      },
    ]
    ensureAccountIntegrity()
    saveAccounts()
  }
}

const loadUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_USER)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.email) {
        parsed.avatar = mergeAvatarWithEmail(parsed.email, parsed.avatar)
      }
      if (parsed?.role) {
        parsed.role = normalizeRoleLabel(parsed.role) || parsed.role
      }
      state.user = parsed
    }
  } catch (e) {
    state.user = null
  }
}

const saveUser = (user) => {
  if (user?.email && user.avatar) {
    storeAvatarForEmail(user.email, user.avatar)
  }
  localStorage.setItem(STORAGE_USER, JSON.stringify(user))
}

const saveToken = (token, expiresAt) => {
  const payload = { token, expiresAt }
  localStorage.setItem(STORAGE_TOKEN, JSON.stringify(payload))
}

const isLocalFallbackToken = (token) => String(token || '').trim() === 'local-token'

const loadToken = () => {
  try {
    const raw = localStorage.getItem(STORAGE_TOKEN)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.token) {
        if (canUseApi && !ENABLE_LOCAL_AUTH_FALLBACK && isLocalFallbackToken(parsed.token)) {
          localStorage.removeItem(STORAGE_TOKEN)
          return
        }
        state.token = parsed.token
        state.tokenExpiresAt = parsed.expiresAt || null
        setApiAuthToken(parsed.token)
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
  clearApiAuthToken()
}

loadAccounts()
loadUser()
loadToken()

export const useAuth = () => {
  const currentUser = computed(() => state.user)
  const isAuthenticated = computed(() => !!state.user && !!state.token)
  const userManagement = useUserManagement()

  const toAuthUser = (profile = {}, fallback = {}) => {
    const email = profile.email || fallback.email || ''
    const name =
      profile.fullName ||
      profile.name ||
      fallback.fullName ||
      fallback.name ||
      'Admin'
    const username =
      profile.username ||
      fallback.username ||
      (email ? String(email).split('@')[0] : '')
    const avatarCandidate =
      profile.avatar ||
      profile.avatar_url ||
      profile.avatarUrl ||
      fallback.avatar
    const role =
      normalizeRoleLabel({
        role: profile.role ?? fallback.role,
        role_name: profile.role_name,
        roleName: profile.roleName,
        role_id: profile.role_id,
        roleId: profile.roleId,
      }) || fallback.role || 'Admin'

    return {
      id: profile.id ?? fallback.id,
      email,
      name,
      fullName: name,
      username,
      avatar: mergeAvatarWithEmail(email, avatarCandidate),
      role,
      status: profile.status || fallback.status || 'Aktif',
    }
  }

  if (canUseApi && state.token && !isLocalFallbackToken(state.token) && !profileSyncAttempted) {
    profileSyncAttempted = true
    userService
      .getProfile()
      .then((resp) => {
        const profile = resp?.data || resp
        if (!profile?.email) return
        const normalized = toAuthUser(profile, state.user || {})
        state.user = normalized
        saveUser(normalized)
      })
      .catch(() => {
        // ignore silent profile sync failure
      })
  }

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
    const canFallbackToLocal = !canUseApi || ENABLE_LOCAL_AUTH_FALLBACK

    const doLocalLogin = () => {
      const accounts = buildAccountList()
      const match = accounts.find(
        (acc) =>
          acc.email?.toLowerCase() === targetEmail &&
          verifyPassword(password || '', acc.password) &&
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
        role: normalizeRoleLabel({ role: match.role }) || 'Admin',
        status: match.status || 'Aktif',
      }
      state.user = user
      saveUser(user)
      const exp = new Date(Date.now() + LOCAL_TOKEN_EXP_MS).toISOString()
      state.token = 'local-token'
      state.tokenExpiresAt = exp
      saveToken(state.token, exp)
      setApiAuthToken(state.token)
      return true
    }

    return userService
      .login({ email, password })
      .then(async (resp) => {
        const token = resp?.token || resp?.data?.token
        const profile = resp?.user || resp?.data?.user
        if (token) {
          const exp =
            resp?.expiresAt ||
            resp?.expiresIn ||
            resp?.data?.expiresAt ||
            (resp?.data?.expiresIn
              ? new Date(Date.now() + resp.data.expiresIn * 1000).toISOString()
              : decodeJwtExp(token))
          state.token = token
          state.tokenExpiresAt = exp
          saveToken(token, exp)
          setApiAuthToken(token)
        }
        if (profile?.email) {
          const user = toAuthUser(profile, state.user || {})
          state.user = user
          saveUser(user)
          return true
        }

        if (token) {
          try {
            const meResp = await userService.getProfile()
            const meProfile = meResp?.data || meResp
            if (meProfile?.email) {
              const user = toAuthUser(meProfile, state.user || {})
              state.user = user
              saveUser(user)
              return true
            }
          } catch (e) {
            // lanjutkan ke fallback jika diizinkan
          }
        }

        if (canFallbackToLocal) return doLocalLogin()
        clearToken()
        return false
      })
      .catch((err) => {
        if (canFallbackToLocal) return doLocalLogin()
        throw err
      })
  }

  const logout = () => {
    state.user = null
    localStorage.removeItem(STORAGE_USER)
    clearToken()
  }

  const updateProfile = async (updates = {}) => {
    if (!state.user) return false
    const previousUser = { ...state.user }

    const payload = {}
    const nameValue = updates.fullName ?? updates.name
    if (nameValue !== undefined) payload.name = String(nameValue || '').trim()
    if (updates.username !== undefined) payload.username = String(updates.username || '').trim() || null
    if (updates.email !== undefined) payload.email = String(updates.email || '').trim()
    if (updates.avatar !== undefined) payload.avatar = updates.avatar || null
    if (updates.password) payload.password = updates.password

    const canRemoteUpdate = canUseApi && state.token && !isLocalFallbackToken(state.token)
    if (canRemoteUpdate) {
      try {
        const resp = await userService.updateProfile(payload)
        let remoteProfile = resp?.user || resp?.data?.user || resp?.data || resp

        if (!remoteProfile?.email) {
          try {
            const meResp = await userService.getProfile()
            const meProfile = meResp?.data || meResp
            if (meProfile && typeof meProfile === 'object') {
              remoteProfile = { ...remoteProfile, ...meProfile }
            }
          } catch (e) {
            // ignore secondary fetch failure, fallback to local merge below
          }
        }

        const mergedProfile =
          remoteProfile && typeof remoteProfile === 'object'
            ? remoteProfile
            : {
                ...previousUser,
                name: payload.name ?? previousUser.name,
                fullName: payload.name ?? previousUser.fullName,
                username: payload.username ?? previousUser.username,
                email: payload.email ?? previousUser.email,
                avatar: payload.avatar ?? previousUser.avatar,
              }

        const normalized = toAuthUser(mergedProfile, previousUser)
        state.user = normalized
        saveUser(normalized)
        return true
      } catch (e) {
        return false
      }
    }

    const managedUser = userManagement?.users?.value?.find((u) => u.id === previousUser.id)
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

      const updatedUser = toAuthUser(
        {
          id: refreshed.id,
          email: refreshed.email,
          name: refreshed.fullName || refreshed.name || 'Admin',
          fullName: refreshed.fullName || refreshed.name || 'Admin',
          username: refreshed.username || '',
          avatar: updates.avatar || refreshed.avatar || previousUser.avatar,
          role: refreshed.role,
          status: refreshed.status || 'Aktif',
        },
        previousUser,
      )

      state.user = updatedUser
      saveUser(updatedUser)

      return true
    }

    const idx = state.accounts.findIndex((acc) => acc.email === previousUser.email)
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

    const updatedUser = toAuthUser(
      {
        id: updatedAccount.id,
        email: updatedAccount.email,
        name: updatedAccount.fullName || updatedAccount.name || 'Admin',
        fullName: updatedAccount.fullName || updatedAccount.name || 'Admin',
        username: updatedAccount.username || '',
        avatar: updatedAccount.avatar || DEFAULT_AVATAR,
        role: updatedAccount.role || previousUser.role,
      },
      previousUser,
    )

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
