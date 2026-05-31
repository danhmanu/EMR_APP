import React, { useState, useMemo } from 'react'
import { Card, Select, Tree, Button, Spin, message, Space, Divider } from 'antd'
import type { TreeProps } from 'antd'
import { useRoles } from '../../hooks/useRoles'
import { useMenuItems, type MenuItem } from '../../hooks/useMenuItems'
import { useAssignMenusToRole } from '../../hooks/useAssignMenusToRole'
import { fetchJson } from '../../services/api'

export default function AdminMenuConfig(): JSX.Element {
  const { roles, isLoading: rolesLoading } = useRoles()
  const { allMenuItems, isLoading: menusLoading } = useMenuItems()
  const { mutate: assignMenus, isPending: isAssigning } = useAssignMenusToRole()

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [selectedMenuIds, setSelectedMenuIds] = useState<(string | number)[]>([])
  const [assignedMenuIds, setAssignedMenuIds] = useState<(string | number)[]>([])

  // Fetch assigned menus when role is selected
  React.useEffect(() => {
    if (!selectedRoleId) {
      setSelectedMenuIds([])
      setAssignedMenuIds([])
      return
    }

    const loadAssignedMenus = async () => {
      try {
        const selectedRole = roles.find(r => r.id === selectedRoleId)
        if (!selectedRole) return

        const response = await fetchJson<MenuItem[]>(
          `/api/v1/admin/menu-items/for-role/${encodeURIComponent(selectedRole.name)}`
        )
        const assignedIds = (response.data || []).map(m => m.id)
        setAssignedMenuIds(assignedIds)
        setSelectedMenuIds(assignedIds)
      } catch (err) {
        console.error('Error loading assigned menus:', err)
        message.error('Lỗi tải danh sách menu đã gán')
      }
    }

    loadAssignedMenus()
  }, [selectedRoleId, roles])

  // Convert menu items to tree data
  const treeData = useMemo(() => {
    const sortedItems = [...allMenuItems].sort((a, b) => a.displayOrder - b.displayOrder)
    const childrenByParentId = new Map<number, MenuItem[]>()

    for (const item of sortedItems) {
      if (!item.parentMenuItemId) continue
      const bucket = childrenByParentId.get(item.parentMenuItemId) || []
      bucket.push(item)
      childrenByParentId.set(item.parentMenuItemId, bucket)
    }

    const buildNode = (item: MenuItem): NonNullable<TreeProps['treeData']>[number] => ({
      title: item.title || item.key,
      key: item.id,
      children: (childrenByParentId.get(item.id) || []).map(buildNode),
    })

    return sortedItems
      .filter(item => !item.parentMenuItemId)
      .map(buildNode)
  }, [allMenuItems])

  const handleRoleChange = (value: number) => {
    setSelectedRoleId(value)
  }

  const handleTreeSelect: TreeProps['onCheck'] = (checkedKeys) => {
    const normalizedKeys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked
    setSelectedMenuIds(normalizedKeys)
  }

  const handleSave = () => {
    if (!selectedRoleId) {
      message.warning('Vui lòng chọn role')
      return
    }

    const menuIds = selectedMenuIds
      .map(id => {
        const num = Number(id)
        return Number.isFinite(num) ? num : null
      })
      .filter((id): id is number => id !== null)

    assignMenus(
      { roleId: selectedRoleId, menuItemIds: menuIds },
      {
        onSuccess: () => {
          setAssignedMenuIds(selectedMenuIds)
          message.success('Cập nhật cấu hình menu thành công')
        },
        onError: (error: any) => {
          console.error('Error assigning menus:', error)
          message.error(error?.message || 'Lỗi cập nhật cấu hình menu')
        },
      }
    )
  }

  const hasChanges = JSON.stringify(selectedMenuIds) !== JSON.stringify(assignedMenuIds)

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Cấu hình Menu theo Role" style={{ maxWidth: 900 }}>
        <Spin spinning={rolesLoading || menusLoading}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Role Selection */}
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                Chọn Role:
              </label>
              <Select
                placeholder="Chọn role để cấu hình menu"
                value={selectedRoleId}
                onChange={handleRoleChange}
                options={roles.map(role => ({
                  label: role.displayName || role.name,
                  value: role.id,
                }))}
                style={{ width: '100%', maxWidth: 400 }}
              />
            </div>

            {selectedRoleId && (
              <>
                <Divider style={{ margin: '8px 0' }} />

                {/* Menu Items Tree */}
                <div>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                    Các Menu Có Sẵn:
                  </label>
                  <div
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      padding: 12,
                      maxHeight: 400,
                      overflow: 'auto',
                    }}
                  >
                    <Tree
                      checkable
                      defaultExpandAll
                      treeData={treeData}
                      checkedKeys={selectedMenuIds}
                      onCheck={handleTreeSelect}
                    />
                  </div>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                {/* Save Button */}
                <Space>
                  <Button
                    type="primary"
                    onClick={handleSave}
                    disabled={!hasChanges}
                    loading={isAssigning}
                  >
                    Lưu Cấu Hình
                  </Button>
                  <span style={{ fontSize: 12, color: '#999' }}>
                    {hasChanges ? '(Có thay đổi)' : '(Không có thay đổi)'}
                  </span>
                </Space>
              </>
            )}
          </Space>
        </Spin>
      </Card>
    </div>
  )
}


