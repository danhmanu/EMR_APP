import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '../services/api'
import { getStoredRole } from '../services/auth'

const EMR_ONLY = (import.meta as any).env?.VITE_EMR_ONLY === 'true'

export interface MenuItem {
  id: number
  key?: string
  title?: string
  link?: string
  icon?: string
  displayOrder: number
  parentMenuItemId?: number
  isDeleted: boolean
  childMenuItems?: MenuItem[]
}

function ensureInventoryReportMenu(items: MenuItem[]): MenuItem[] {
  const inventoryParent = items.find(item => item.key === 'inventory' || item.link === '/inventory')
  const hasInventoryReports = items.some(item => item.key === 'inventory-reports' || item.link === '/inventory/reports')

  if (!inventoryParent || hasInventoryReports) {
    return items
  }

  const nextId = items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
  return [
    ...items,
    {
      id: nextId,
      key: 'inventory-reports',
      title: 'Báo cáo kiểm kê',
      link: '/inventory/reports',
      icon: 'BarChartOutlined',
      displayOrder: 2,
      parentMenuItemId: inventoryParent.id,
      isDeleted: false,
      childMenuItems: []
    }
  ]
}

function ensureCountriesMenu(items: MenuItem[]): MenuItem[] {
  const settingsParent = items.find(item => item.key === 'settings')
  const hasCountries = items.some(item => item.key === 'countries' || item.link === '/countries')

  if (!settingsParent || hasCountries) {
    return items
  }

  const nextId = items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
  return [
    ...items,
    {
      id: nextId,
      key: 'countries',
      title: 'Danh mục Quốc gia',
      link: '/countries',
      icon: 'GlobalOutlined',
      displayOrder: 4,
      parentMenuItemId: settingsParent.id,
      isDeleted: false,
      childMenuItems: []
    }
  ]
}

async function fetchMenuItemsForRole(roleName: string | null): Promise<MenuItem[]> {
  if (!roleName) return []
  const response = await fetchJson<MenuItem[]>('/api/v1/menu/my')
  return response.data || []
}

async function fetchAllMenuItems(): Promise<MenuItem[]> {
  const response = await fetchJson<MenuItem[]>('/api/v1/admin/menu-items')
  return response.data || []
}

function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const itemMap = new Map(items.map(item => [item.id, { ...item, childMenuItems: [] }]))
  const rootItems: MenuItem[] = []

  items.forEach(item => {
    const treeItem = itemMap.get(item.id)!
    if (!item.parentMenuItemId) {
      rootItems.push(treeItem)
    } else {
      const parent = itemMap.get(item.parentMenuItemId)
      if (parent) {
        parent.childMenuItems = parent.childMenuItems || []
        parent.childMenuItems.push(treeItem)
      }
    }
  })

  // Sort root items and their children by displayOrder
  const sortByDisplayOrder = (a: MenuItem, b: MenuItem) => a.displayOrder - b.displayOrder
  rootItems.sort(sortByDisplayOrder)
  rootItems.forEach(item => {
    if (item.childMenuItems) {
      item.childMenuItems.sort(sortByDisplayOrder)
    }
  })

  return rootItems
}

const emrFallbackMenu: MenuItem[] = [
  {
    id: 9001,
    key: 'emr',
    title: 'EMR GIADINH',
    link: '/emr',
    icon: 'FileDoneOutlined',
    displayOrder: 1,
    isDeleted: false,
    childMenuItems: []
  }
]

export function useMenuItems() {
  const roleId = getStoredRole() || ''
  const isAdmin = roleId.toLowerCase() === 'admin'

  const { data: allMenuItems = [], isLoading: allMenuLoading } = useQuery({
    queryKey: ['menu', 'all'],
    queryFn: () => fetchAllMenuItems(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !EMR_ONLY && !!roleId && isAdmin
  })

  const { data: roleMenuItems = [], isLoading: roleMenuLoading } = useQuery({
    queryKey: ['menu', 'role', roleId],
    queryFn: () => fetchMenuItemsForRole(roleId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !EMR_ONLY && !!roleId
  })

  // const normalizedRoleMenuItems = ensureCountriesMenu(ensureInventoryReportMenu(roleMenuItems))
  const normalizedRoleMenuItems = EMR_ONLY || !roleMenuItems.length ? emrFallbackMenu : roleMenuItems
  const menuTree = buildMenuTree(normalizedRoleMenuItems)

  return {
    menuItems: normalizedRoleMenuItems,
    menuTree,
    allMenuItems,
    isLoading: allMenuLoading || roleMenuLoading
  }
}
