import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Checkbox, Input, message, Space, Spin, Tree, Tabs, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import {
  getAllRoles,
  updateRolePermissions,
  getCurrentUserPermissions,
  getPermissionItems,
  getRolePermissionIds,
  type PermissionItem
} from '../../services/permissions'

interface RoleData {
  id: number
  name: string
  permissions: string[]
}

// Group permissions by resource
function groupPermissionsByResource(permissions: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  permissions.forEach(perm => {
    const [resource] = perm.split('.')
    if (!grouped[resource]) grouped[resource] = []
    grouped[resource].push(perm)
  })
  return grouped
}

export default function PermissionManagement(): JSX.Element {
  const [roles, setRoles] = useState<RoleData[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<RoleData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [currentUserPerms, setCurrentUserPerms] = useState<string[] | null>(null)
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([])

  // Load roles and current user permissions on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rolesData, userPermData] = await Promise.all([
        getAllRoles(),
        getCurrentUserPermissions()
      ])

      const permissionItems = await getPermissionItems()
      const permissionCodeById = new Map(permissionItems.map(item => [item.id, item.code]))
      setAllPermissions(permissionItems)
      
      if (rolesData && Array.isArray(rolesData)) {
        const processedRoles = await Promise.all(rolesData.map(async (r: any) => {
          const permissionIds = await getRolePermissionIds(r.id)
          const permissions = permissionIds
            .map(id => permissionCodeById.get(id))
            .filter((code): code is string => !!code)

          return {
            id: r.id,
            name: r.name,
            permissions
          }
        }))
        setRoles(processedRoles)
      }
      
      if (userPermData) {
        setCurrentUserPerms(userPermData.permissions)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      message.error('Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const canManagePermissions = !currentUserPerms || currentUserPerms.includes('admin.update') || currentUserPerms.includes('*')

  const handleEdit = (role: RoleData) => {
    if (!canManagePermissions) {
      message.error('Bạn không có quyền quản lý permissions')
      return
    }
    setEditing(role)
    setSelectedPermissions([...role.permissions])
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!editing) return
    
    try {
      setLoading(true)
      const success = await updateRolePermissions(editing.id, selectedPermissions)
      
      if (success) {
        message.success(`Cập nhật quyền cho ${editing.name} thành công`)
        await loadData()
        setModalOpen(false)
        setEditing(null)
        setSelectedPermissions([])
      } else {
        message.error('Cập nhật quyền thất bại')
      }
    } catch (error) {
      console.error('Failed to update permissions:', error)
      message.error('Cập nhật quyền thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    setSelectedPermissions(allPermissions.map(item => item.code))
  }

  const handleClearAll = () => {
    setSelectedPermissions([])
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permission])
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission))
    }
  }

  // Filter permissions based on search
  const filteredPermissions = allPermissions.map(item => item.code).filter(p =>
    p.toLowerCase().includes(searchText.toLowerCase())
  )

  const columns = [
    {
      title: 'Role',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Số lượng quyền',
      dataIndex: 'permissions',
      key: 'count',
      render: (permissions: string[]) => (
        <Tag color="blue">{permissions.length} quyền</Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: RoleData) => (
        <Space>
          <Button
            type="primary"
            onClick={() => handleEdit(record)}
            disabled={!canManagePermissions}
          >
            Quản lý
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card title="Quản lý Permissions">
        <Table
          dataSource={roles}
          columns={columns}
          rowKey={r => r.id}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title={`Quản lý quyền của ${editing?.name}`}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
          setSelectedPermissions([])
        }}
        width={800}
        okButtonProps={{ loading }}
        cancelButtonProps={{ disabled: loading }}
      >
        <Spin spinning={loading}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Search */}
            <Input
              placeholder="Tìm kiếm quyền..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />

            {/* Action Buttons */}
            <Space>
              <Button onClick={handleSelectAll} type="dashed">
                Chọn tất cả
              </Button>
              <Button onClick={handleClearAll} type="dashed" danger>
                Bỏ chọn tất cả
              </Button>
            </Space>

            {/* Permission Count */}
            <div>
              <strong>
                Đã chọn: {selectedPermissions.length}/{allPermissions.length} quyền
              </strong>
            </div>

            {/* Permissions by Resource */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '4px', padding: '12px' }}>
              {Object.entries(groupPermissionsByResource(filteredPermissions)).map(([resource, perms]) => (
                <div key={resource} style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>
                    {resource.toUpperCase()}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginLeft: '12px' }}>
                    {perms.map(perm => (
                      <Checkbox
                        key={perm}
                        checked={selectedPermissions.includes(perm)}
                        onChange={e => handlePermissionChange(perm, e.target.checked)}
                      >
                        {perm.split('.')[1]}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Permissions Preview */}
            {selectedPermissions.length > 0 && (
              <div>
                <strong>Quyền được chọn:</strong>
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedPermissions.sort().map(perm => (
                    <Tag
                      key={perm}
                      closable
                      onClose={() => handlePermissionChange(perm, false)}
                    >
                      {perm}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Space>
        </Spin>
      </Modal>
    </div>
  )
}


