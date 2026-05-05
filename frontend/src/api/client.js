const API_BASE = '/api/v1'

function getToken() {
  return localStorage.getItem('srm_token')
}

export async function apiRequest(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })

  // 401: token scaduto/invalido → forza re-login
  if (response.status === 401) {
    localStorage.removeItem('srm_token')
    window.location.href = '/login'
    throw new Error('Sessione scaduta')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Errore ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

// Caso speciale: il backend si aspetta form-data per /auth/token
// (è lo standard OAuth2PasswordRequestForm di FastAPI), non JSON
export async function loginRequest(username, password) {
  const body = new URLSearchParams({ username, password })
  const response = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    body,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Credenziali non valide')
  }
  return response.json()
}
