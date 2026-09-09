import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { RequirePermission } from './auth/RequirePermission'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ProductCatalogPage from './pages/ProductCatalogPage'
import UsersPage from './pages/UsersPage'
import OperationsPage from './pages/OperationsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/products"
          element={
            <RequirePermission permission="products.read">
              <ProductCatalogPage />
            </RequirePermission>
          }
        />
        <Route
          path="/dispatches"
          element={
            <RequirePermission permission="dispatch.read">
              <OperationsPage mode="dispatch" />
            </RequirePermission>
          }
        />
        <Route path="/orders" element={<RequirePermission permission="inventory.read"><OperationsPage mode="orders" /></RequirePermission>} />
        <Route path="/production" element={<RequirePermission permission="inventory.read"><OperationsPage mode="production" /></RequirePermission>} />
        <Route
          path="/users"
          element={
            <RequirePermission permission="users.read">
              <UsersPage />
            </RequirePermission>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
