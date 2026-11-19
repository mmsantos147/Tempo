const BASE_URL = '/api'
const CSRF_COOKIE = 'XSRF-TOKEN'
const CSRF_HEADER = 'X-XSRF-TOKEN'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>
  readonly retryAfterSeconds: number | null

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}, retryAfterSeconds: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.retryAfterSeconds = retryAfterSeconds
  }
}

interface ProblemDetail {
  detail?: string
  errors?: Record<string, string>
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

let unauthorizedHandler: (() => void) | null = null

export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export async function refreshCsrfToken(): Promise<void> {
  await send('GET', '/auth/csrf')
}

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response = await send(method, path, body)

  if (response.status === 403 && method !== 'GET') {
    await send('GET', '/auth/csrf')
    response = await send(method, path, body)
  }

  if (response.status === 401 && !path.startsWith('/auth/')) {
    unauthorizedHandler?.()
    throw new ApiError(401, 'Your session has expired. Please sign in again.')
  }

  if (!response.ok) {
    const problem = await readProblem(response)
    throw new ApiError(response.status, problem.detail ?? response.statusText, problem.errors, readRetryAfter(response))
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

async function send(method: Method, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    const token = readCookie(CSRF_COOKIE)
    if (token) headers[CSRF_HEADER] = token
  }

  try {
    return await fetch(BASE_URL + path, {
      method,
      credentials: 'same-origin',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?')
  }
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`
  const cookie = document.cookie.split('; ').find((part) => part.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

function readRetryAfter(response: Response): number | null {
  const value = Number(response.headers.get('Retry-After'))
  return Number.isFinite(value) && value > 0 ? value : null
}

async function readProblem(response: Response): Promise<ProblemDetail> {
  try {
    return (await response.json()) as ProblemDetail
  } catch {
    return {}
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fields = Object.entries(error.fieldErrors).map(([field, message]) => `${field} ${message}`)
    return fields.length > 0 ? `${error.message}: ${fields.join(', ')}` : error.message
  }
  return 'Something went wrong'
}
