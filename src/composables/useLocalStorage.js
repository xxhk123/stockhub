/**
 * localStorage 读写工具
 */
export function useLocalStorage(key, defaultValue) {
  const get = () => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const set = (value) => {
    localStorage.setItem(key, JSON.stringify(value))
  }

  return { get, set }
}
