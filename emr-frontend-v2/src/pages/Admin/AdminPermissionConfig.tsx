import React, { useState, useMemo } from 'react'
import {
  Card, Select, Table, Checkbox, Button, Space, Spin, message,
  Modal, Form, Input, Popconfirm, Tag, Typography, Row, Col, Statistic,
  Alert, Divider
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useRoles } from '../../hooks/useRoles'
import {
  usePermissionItems,
  useCreatePermissionItem,
  useUpdatePermissionItem,
  useDeletePermissionItem,
  type PermissionItem
} from '../../hooks/usePermissionItems'
import { useRolePermissions, useAssignPermissionsToRole } from '../../hooks/useRolePermissions'
import { normalizeSearchText as normalizeText } from '../../utils/search'

const { Text } = Typography
const { Search } = Input

function areSetsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) {
    if (!b.has(value)) return false
  }
  return true
}

export default function AdminPermissionConfig(): JSX.Element {
  const { roles, isLoading: rolesLoading } = useRoles()
  const { items: allPermissions, isLoading: permsLoading } = usePermissionItems()
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const { permissionIds: assignedIds, isLoading: assignedLoading } = useRolePermissions(selectedRoleId)
  const { mutateAsync: assign, isPending: isAssigning } = useAssignPermissionsToRole()
  const { mutateAsync: createItem, isPending: isCreating } = useCreatePermissionItem()
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdatePermissionItem()
  const { mutateAsync: deleteItem } = useDeletePermissionItem()

  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PermissionItem | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [form] = Form.useForm()

  // Sync checked state when role or assigned permissions change
  React.useEffect(() => {
    const next = new Set(assignedIds)
    setCheckedIds(prev => (areSetsEqual(prev, next) ? prev : next))
  }, [assignedIds])

  // Group permissions by resource prefix (e.g. "devices" from "devices.read")
  const grouped = useMemo(() => {
    const map = new Map<string, PermissionItem[]>()
    for (const p of allPermissions) {
      const prefix = p.code.includes('.') ? p.code.split('.')[0] : p.code
      if (!map.has(prefix)) map.set(prefix, [])
      map.get(prefix)!.push(p)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [allPermissions])

  const selectedRole = useMemo(
    () => roles.find(r => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  )

  const baselineCheckedSet = useMemo(() => new Set(assignedIds), [assignedIds])

  const hasUnsavedChanges = useMemo(
    () => !!selectedRoleId && !areSetsEqual(checkedIds, baselineCheckedSet),
    [selectedRoleId, checkedIds, baselineCheckedSet],
  )

  const filteredPermissions = useMemo(() => {
    const keyword = normalizeText(searchText)
    return allPermissions.filter(p => {
      const prefix = p.code.includes('.') ? p.code.split('.')[0] : p.code
      const matchGroup = selectedGroup === 'all' || prefix === selectedGroup
      if (!matchGroup) return false

      if (!keyword) return true
      const codeText = normalizeText(p.code)
      const descText = normalizeText(p.description)
      return codeText.includes(keyword) || descText.includes(keyword)
    })
  }, [allPermissions, searchText, selectedGroup])

  const currentSelectionInFilter = useMemo(
    () => filteredPermissions.filter(p => checkedIds.has(p.id)).length,
    [filteredPermissions, checkedIds],
  )

  const handleSave = async () => {
    if (!selectedRoleId) return
    try {
      await assign({ roleId: selectedRoleId, permissionItemIds: Array.from(checkedIds) })
      message.success('Đã lưu phân quyền')
    } catch {
      message.error('Lỗi khi lưu phân quyền')
    }
  }

  const handleToggle = (id: number, checked: boolean) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleSelectAllGroup = (ids: number[], checked: boolean) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }

  const handleSelectAllFiltered = () => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      filteredPermissions.forEach(item => next.add(item.id))
      return next
    })
  }

  const handleClearFiltered = () => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      filteredPermissions.forEach(item => next.delete(item.id))
      return next
    })
  }

  const handleResetToAssigned = () => {
    setCheckedIds(new Set(assignedIds))
    message.info('Đã hoàn tác về cấu hình đã lưu')
  }

  const openCreate = () => {
    setEditTarget(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (item: PermissionItem) => {
    setEditTarget(item)
    form.setFieldsValue({ code: item.code, description: item.description })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    const values = await form.validateFields()
    try {
      const payload = {
        ...values,
        code: normalizeText(values.code),
        description: values.description?.trim() || undefined,
      }

      if (editTarget) {
        await updateItem({ id: editTarget.id, ...payload })
        message.success('Đã cập nhật permission')
      } else {
        await createItem(payload)
        message.success('Đã tạo permission mới')
      }
      setModalOpen(false)
    } catch {
      message.error('Lỗi khi lưu')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteItem(id)
      setCheckedIds(prev => { const n = new Set(prev); n.delete(id); return n })
      message.success('Đã xóa permission')
    } catch {
      message.error('Lỗi khi xóa')
    }
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <Text type="secondary">{desc || '—'}</Text>,
    },
    {
      title: 'Nhóm',
      key: 'group',
      width: 120,
      render: (_: unknown, record: PermissionItem) => {
        const prefix = record.code.includes('.') ? record.code.split('.')[0] : record.code
        return <Tag>{prefix}</Tag>
      },
    },
    {
      title: 'Gán cho role',
      key: 'assigned',
      width: 120,
      render: (_: unknown, record: PermissionItem) => (
        <Checkbox
          disabled={!selectedRoleId}
          checked={checkedIds.has(record.id)}
          onChange={e => handleToggle(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: PermissionItem) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Xóa permission này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const loading = rolesLoading || permsLoading || assignedLoading

  return (
    <div className="permission-config">
      <Card
        title="Cấu hình phân quyền"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm permission
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            type="info"
            showIcon
            message="Quy trình đề xuất"
            description="Chọn role, lọc theo nhóm quyền, bật/tắt các quyền cần thiết và bấm Lưu thay đổi."
          />

          <Row gutter={[12, 12]}>
            <Col xs={24} md={10}>
              <Text strong>Role cần cấu hình</Text>
              <Select
                loading={rolesLoading}
                placeholder="Chọn role"
                style={{ width: '100%', marginTop: 6 }}
                value={selectedRoleId ?? undefined}
                onChange={v => setSelectedRoleId(v)}
                options={roles.map(r => ({ label: r.displayName || r.name, value: r.id }))}
              />
            </Col>
            <Col xs={24} md={14}>
              <Text strong>Bộ lọc nhanh</Text>
              <Space.Compact style={{ width: '100%', marginTop: 6 }}>
                <Search
                  placeholder="Tìm theo code hoặc mô tả"
                  allowClear
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  style={{ width: '55%' }}
                />
                <Select
                  value={selectedGroup}
                  onChange={setSelectedGroup}
                  style={{ width: '45%' }}
                  options={[
                    { label: 'Tất cả nhóm', value: 'all' },
                    ...grouped.map(([prefix, items]) => ({
                      label: `${prefix} (${items.length})`,
                      value: prefix,
                    })),
                  ]}
                />
              </Space.Compact>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Card size="small" className="permission-config__stat">
                <Statistic title="Tổng permissions" value={allPermissions.length} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" className="permission-config__stat">
                <Statistic title="Đang bật cho role" value={checkedIds.size} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" className="permission-config__stat">
                <Statistic
                  title="Trong kết quả lọc"
                  value={`${currentSelectionInFilter}/${filteredPermissions.length}`}
                />
              </Card>
            </Col>
          </Row>

          {!selectedRoleId && (
            <Alert
              type="warning"
              showIcon
              message="Bạn chưa chọn role"
              description="Bảng quyền vẫn hiển thị để tham khảo, nhưng chỉ có thể gán quyền sau khi chọn role."
            />
          )}

          {selectedRole && (
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text>
                Đang chỉnh role: <Text strong>{selectedRole.displayName || selectedRole.name}</Text>
              </Text>
              <Space wrap>
                <Button onClick={handleSelectAllFiltered} disabled={!selectedRoleId || filteredPermissions.length === 0}>
                  Chọn tất cả trong bộ lọc
                </Button>
                <Button onClick={handleClearFiltered} disabled={!selectedRoleId || filteredPermissions.length === 0}>
                  Bỏ chọn trong bộ lọc
                </Button>
                <Button onClick={handleResetToAssigned} disabled={!selectedRoleId || !hasUnsavedChanges}>
                  Hoàn tác
                </Button>
              </Space>
            </Space>
          )}

          {selectedRoleId && grouped.length > 0 && (
            <div>
              <Divider style={{ margin: '8px 0' }} />
              <Space wrap size={[8, 8]}>
                {grouped.map(([prefix, items]) => {
                  const ids = items.map(i => i.id)
                  const allChecked = ids.every(id => checkedIds.has(id))
                  const someChecked = ids.some(id => checkedIds.has(id))
                  return (
                    <Checkbox
                      key={prefix}
                      checked={allChecked}
                      indeterminate={!allChecked && someChecked}
                      onChange={e => handleSelectAllGroup(ids, e.target.checked)}
                    >
                      {prefix}
                    </Checkbox>
                  )
                })}
              </Space>
            </div>
          )}

          <Spin spinning={loading}>
            <Table<PermissionItem>
              rowKey="id"
              dataSource={filteredPermissions}
              columns={columns}
              pagination={{ pageSize: 25, showSizeChanger: true }}
              size="small"
              className="permission-config__table"
            />
          </Spin>

          {selectedRoleId && (
            <div className="permission-config__savebar">
              <Text type={hasUnsavedChanges ? 'warning' : 'secondary'}>
                {hasUnsavedChanges
                  ? 'Bạn có thay đổi chưa lưu cho role hiện tại.'
                  : 'Không có thay đổi chưa lưu.'}
              </Text>
              <Space>
                <Button onClick={handleResetToAssigned} disabled={!hasUnsavedChanges}>
                  Hoàn tác thay đổi
                </Button>
                <Button
                  type="primary"
                  loading={isAssigning}
                  onClick={handleSave}
                  disabled={loading || !hasUnsavedChanges}
                >
                  Lưu thay đổi
                </Button>
              </Space>
            </div>
          )}
        </Space>
      </Card>

      <Modal
        title={editTarget ? 'Sửa permission' : 'Thêm permission mới'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={isCreating || isUpdating}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Nhập code permission (vd: devices.read)' },
              {
                pattern: /^[a-z0-9]+(\.[a-z0-9]+)+$/,
                message: 'Code nên theo định dạng resource.action, ví dụ devices.read',
              },
            ]}
          >
            <Input placeholder="devices.read" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input placeholder="Mô tả ngắn gọn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}


