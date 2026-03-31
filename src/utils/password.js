import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

export const isBcryptHash = (value) =>
  typeof value === 'string' && typeof value.startsWith === 'function' && value.startsWith('$2')

export const hashPassword = (plain = '') => bcrypt.hashSync(plain || '', BCRYPT_ROUNDS)

export const ensurePasswordHash = (value, fallback = '') => {
  if (isBcryptHash(value)) return value
  return hashPassword(value || fallback)
}

export const verifyPassword = (plain, hash) => {
  if (!plain || !hash) return false
  try {
    return bcrypt.compareSync(plain, hash)
  } catch (err) {
    return false
  }
}
