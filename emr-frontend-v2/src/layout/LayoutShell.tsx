import React, { useMemo, useState, Suspense } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Typography, Drawer, Grid } from 'antd'
import type { MenuProps } from 'antd'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, getStoredRole, getStoredUsername } from '../services/auth'
import { useMenuItems, type MenuItem } from '../hooks/useMenuItems'
import { useMyProfile } from '../services/queries/userQueries'
import { getIconComponent } from '../utils/iconMap'
const { Header, Sider, Content } = Layout

import {
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'
const DISABLED_ASSET_MENU_KEYS = new Set([
  'dashboard',
  'management',
  'devices',
  'certificates',
  'procurement',
  'orders',
  'contracts',
  'receipts',
  'allocations',
  'purchase-invoices',
  'procurement-imports',
  'maintenance',
  'plans',
  'tasks',
  'calendar',
  'records',
  'daily-check',
  'checklists',
  'repairs',
  'repairs-list',
  'repairs-create',
  'transfers',
  'transfers-list',
  'transfers-create',
  'asset-outputs',
  'asset-outputs-list',
  'asset-outputs-create',
  'documents',
  'reports',
  'master-data',
  'manufacturers',
  'companies',
  'countries',
  'device-types',
  'item-catalogs',
  'toolkit-catalogs',
  'unit-catalogs',
  'alerts',
  'inventory',
  'inventory-sessions',
  'inventory-reports',
  'inventory-department-stock',
  'inventory-material-stock',
  'inventory-material-issues'
])

function readSidebarCollapsed() {
  try {
    return JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) || 'false')
  } catch {
    return false
  }
}

function writeSidebarCollapsed(value: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(value))
  } catch {
    // Ignore localStorage write failures.
  }
}



function convertMenuItemToAntMenu(item: MenuItem): any {
  if (!item.key) return null

  const icon = item.icon ? getIconComponent(item.icon) : undefined
  const isParent = item.childMenuItems && item.childMenuItems.length > 0

  if (isParent && item.childMenuItems) {
    return {
      key: item.key,
      icon,
      label: item.title,
      children: item.childMenuItems
        .map(child => convertMenuItemToAntMenu(child))
        .filter(Boolean)
    }
  } else if (item.link) {
    return {
      key: item.link,
      icon,
      label: <Link to={item.link}>{item.title}</Link>
    }
  }

  return null
}

function filterAssetManagementMenus(items: MenuItem[]): MenuItem[] {
  return items
    .filter(item => !item.key || !DISABLED_ASSET_MENU_KEYS.has(item.key))
    .map(item => ({
      ...item,
      childMenuItems: item.childMenuItems ? filterAssetManagementMenus(item.childMenuItems) : item.childMenuItems
    }))
    .filter(item => item.link || item.childMenuItems?.length)
}

export default function LayoutShell({ children }: { children?: React.ReactNode }){
  const screens = Grid.useBreakpoint()
  const loc = useLocation()
  const nav = useNavigate()
  const [collapsed, setCollapsed] = useState<boolean>(readSidebarCollapsed)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const currentRole = getStoredRole() || ''
  // Use query cache for live updates; fall back to localStorage on initial load
  const { data: myProfile } = useMyProfile()
  const currentUsername = myProfile?.displayName || getStoredUsername() || 'User'
  const isMobile = !screens.lg
  const drawerWidth = screens.sm ? 320 : '100vw'

  // Use dynamic menu from API
  const { menuTree, isLoading } = useMenuItems()
  const visibleMenuTree = useMemo(() => filterAssetManagementMenus(menuTree), [menuTree])

  // Build link→title map dynamically from the menu tree
  const titleMap = useMemo(() => {
    const map: Record<string, string> = { '/': 'EMR GIADINH', '/emr': 'EMR GIADINH' }
    function traverse(items: MenuItem[]) {
      for (const item of items) {
        if (item.link && item.title) map[item.link] = item.title
        if (item.childMenuItems?.length) traverse(item.childMenuItems)
      }
    }
    traverse(visibleMenuTree)
    return map
  }, [visibleMenuTree])

  // Root keys are parent items that have children (used for accordion behaviour)
  const rootKeys = useMemo(
    () => visibleMenuTree.filter(item => item.childMenuItems?.length && item.key).map(item => item.key!),
    [visibleMenuTree]
  )

  const selectedKey = useMemo(() => {
    const keys = Object.keys(titleMap)
      .filter(k => loc.pathname === k || loc.pathname.startsWith(`${k}/`))
      .sort((a, b) => b.length - a.length)
    return keys[0] || loc.pathname
  }, [titleMap, loc.pathname])

  const headerTitle = useMemo(() => titleMap[selectedKey] || 'EMR GIADINH', [titleMap, selectedKey])

  const defaultOpenKey = useMemo(() => {
    function findParent(items: MenuItem[], pathname: string): string | undefined {
      for (const item of items) {
        if (!item.childMenuItems?.length) continue
        for (const child of item.childMenuItems) {
          if (child.link && (pathname === child.link || pathname.startsWith(`${child.link}/`))) return item.key
        }
        const found = findParent(item.childMenuItems, pathname)
        if (found) return found
      }
      return undefined
    }
    return findParent(visibleMenuTree, loc.pathname)
  }, [visibleMenuTree, loc.pathname])

  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKey ? [defaultOpenKey] : [])

  const menuItems = useMemo(() => {
    return visibleMenuTree
      .map(item => convertMenuItemToAntMenu(item))
      .filter(Boolean) as MenuProps['items']
  }, [visibleMenuTree])

  React.useEffect(() => {
    if (!collapsed && defaultOpenKey) {
      setOpenKeys((prev) => (prev.includes(defaultOpenKey) ? prev : [...prev, defaultOpenKey]))
    }
  }, [collapsed, defaultOpenKey])

  React.useEffect(() => {
    if (!defaultOpenKey) return
    setOpenKeys((prev) => {
      if (isMobile) return [defaultOpenKey]
      return prev.includes(defaultOpenKey) ? prev : [...prev, defaultOpenKey]
    })
  }, [defaultOpenKey, isMobile])

  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [loc.pathname])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      writeSidebarCollapsed(next)
      return next
    })
  }

  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    const latestKey = keys.find((key) => !openKeys.includes(String(key)))
    if (latestKey && rootKeys.includes(String(latestKey))) {
      setOpenKeys([String(latestKey)])
      return
    }
    setOpenKeys(keys.map(String))
  }

  const profileMenuItems: MenuProps['items'] = [
    { key: 'profile', label: 'Hồ sơ' },
    { key: 'logout', label: 'Đăng xuất', danger: true }
  ]

  const onMenuClick = ({ key }:{ key:string })=>{
    if(key==='profile') return nav('/profile')
    if(key==='logout'){ clearAuthSession(); return nav('/login') }
  }

  const menuNode = (
    <Menu
      mode="inline"
      inlineCollapsed={!isMobile && collapsed}
      selectedKeys={[selectedKey]}
      openKeys={isMobile ? openKeys : (collapsed ? [] : openKeys)}
      onOpenChange={handleOpenChange}
      items={menuItems}
      style={{ borderRight: 0, background: 'transparent' }}
      onClick={() => {
        if (isMobile) setMobileMenuOpen(false)
      }}
    />
  )

  return (
    <Layout className="app-shell" style={{ height: '100vh', overflow: 'hidden', background: '#f3f6fb' }}>
      {!isMobile && (
      <Sider
        className="app-shell__sider"
        width={collapsed ? 80 : 260}
        collapsed={collapsed}
        collapsible={false}
        style={{ background: '#ffffff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(15, 23, 42, 0.06)', height: '100vh', overflow: 'hidden', position: 'sticky', top: 0 }}
      >
        <div
          className="sidebar-logo"
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 18,
            borderBottom: '1px solid rgba(15, 23, 42, 0.06)'
          }}
        >
          <img src="/assets/Logo.png" alt="logo" style={{ width: collapsed ? 34 : 112, height: collapsed ? 34 : 52 }} />
        </div>

        <div className="app-shell__menu-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingTop: 6 }}>
          {menuNode}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid rgba(15, 23, 42, 0.06)' }}>
          <Button type="text" onClick={toggleCollapsed} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} style={{ width: '100%' }}>
            {collapsed ? 'Mở rộng' : 'Thu gọn'}
          </Button>
        </div>
      </Sider>
      )}

      {isMobile && (
        <Drawer
          className="app-shell__drawer"
          title="Menu"
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          width={drawerWidth}
          styles={{ body: { padding: 8 } }}
        >
          <div className="app-shell__drawer-menu-scroll">
            {menuNode}
          </div>
        </Drawer>
      )}

      <Layout style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Header
          className="header app-shell__header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            height: 64,
            flexShrink: 0,
            alignItems: 'center',
            padding: isMobile ? '0 12px' : '0 20px',
            background: '#ffffff',
            color: '#111',
            borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}
        >
          <div className="app-shell__header-left" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Mở menu"
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div className="app-shell__header-title" style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                EMR GIADINH
                </div>
                {/* {!isMobile && <div className="app-shell__header-subtitle" style={{ color: '#64748b', fontSize: 12 }}>{headerTitle}</div>} */}
            </div>
          </div>

          <div className="app-shell__header-right">
            <Dropdown menu={{ items: profileMenuItems, onClick: onMenuClick }} placement="bottomRight">
              <div className="app-shell__profile" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#111' }}>
                <Avatar style={{ backgroundColor: '#2f80ed', color: '#fff' }}>{currentUsername.slice(0, 1).toUpperCase()}</Avatar>
                {!isMobile && <Typography.Text style={{ color: '#0f172a' }}>{currentUsername}</Typography.Text>}
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="app-shell__content" style={{ margin: isMobile ? 8 : 16, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="app-shell__page">
            <Suspense fallback={<div style={{ padding: 24, color: '#64748b' }}>Đang tải...</div>}>
              {children ?? <Outlet />}
            </Suspense>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
