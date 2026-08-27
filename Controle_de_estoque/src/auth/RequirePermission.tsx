import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

interface RequirePermissionProps extends PropsWithChildren {
  permission: string
}

export function RequirePermission({
  permission,
  children,
}: RequirePermissionProps) {
  const { session } = useAuth()

  if (!session?.user.permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
