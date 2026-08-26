import type {
  AuthenticationSession,
  CurrentUser,
  LoginCredentials,
} from '../types/auth'

interface ProblemDetails {
  title?: string
  detail?: string
}

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? 'https://localhost:7045/api/v1'
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Confirme se a API está em execução.',
      0,
    )
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ProblemDetails
    throw new ApiError(
      problem.detail ?? problem.title ?? 'Não foi possível concluir a solicitação.',
      response.status,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function apiRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
) {
  return request<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  })
}

export const authApi = {
  login(credentials: LoginCredentials) {
    return request<AuthenticationSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  refresh(refreshToken: string) {
    return request<AuthenticationSession>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

  logout(refreshToken: string) {
    return request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

  me(accessToken: string) {
    return apiRequest<CurrentUser>('/auth/me', accessToken)
  },
}
