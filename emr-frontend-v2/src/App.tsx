import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LayoutShell from './layout/LayoutShell'
import TableColumnResizeEnhancer from './components/common/TableColumnResizeEnhancer'

const Login = lazy(() => import('./pages/Login'))
const EmrGiadinh = lazy(() => import('./pages/Emr/EmrGiadinh'))
const Users = lazy(() => import('./pages/Admin/Users'))
const PermissionManagement = lazy(() => import('./pages/Admin/PermissionManagement'))
const AdminMenuConfig = lazy(() => import('./pages/Admin/AdminMenuConfig'))
const AdminPermissionConfig = lazy(() => import('./pages/Admin/AdminPermissionConfig'))
const Profile = lazy(() => import('./pages/Profile'))
const SystemConfiguration = lazy(() => import('./pages/Setup/SystemConfiguration'))
import { USER_MANAGEMENT_ROLES } from 'constants/systemRoles'
import { hasAnyRole } from './services/auth'

function Private({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles?.length && !hasAnyRole(allowedRoles)) return <Navigate to="/" replace />
  return children
}

export default function App(): JSX.Element {
  return (
    <>
      <TableColumnResizeEnhancer />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Private><LayoutShell /></Private>}>
            <Route path="/" element={<EmrGiadinh />} />
            <Route path="/emr" element={<EmrGiadinh />} />
            <Route path="/users" element={<Private allowedRoles={USER_MANAGEMENT_ROLES}><Users /></Private>} />
            <Route path="/permissions" element={<Private allowedRoles={USER_MANAGEMENT_ROLES}><PermissionManagement /></Private>} />
            <Route path="/admin/menu-config" element={<Private allowedRoles={USER_MANAGEMENT_ROLES}><AdminMenuConfig /></Private>} />
            <Route path="/admin/permissions" element={<Private allowedRoles={USER_MANAGEMENT_ROLES}><AdminPermissionConfig /></Private>} />
            <Route path="/system-configuration" element={<Private allowedRoles={USER_MANAGEMENT_ROLES}><SystemConfiguration /></Private>} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
