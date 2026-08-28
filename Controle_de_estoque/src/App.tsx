import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { RequirePermission } from './auth/RequirePermission'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ProductCatalogPage from './pages/ProductCatalogPage'
import UsersPage from './pages/UsersPage'
import ShippingPage from './pages/ShippingPage'
import CarrierPortalPage from './pages/CarrierPortalPage'

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
              <ShippingPage initialTab="pickups" />
            </RequirePermission>
          }
        />
        <Route path="/carriers" element={<RequirePermission permission="carriers.read"><ShippingPage initialTab="carriers" /></RequirePermission>} />
        <Route
          path="/users"
          element={
            <RequirePermission permission="users.read">
              <UsersPage />
            </RequirePermission>
          }
        />
      </Route>
      <Route path="/coleta/:accessToken" element={<CarrierPortalPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
