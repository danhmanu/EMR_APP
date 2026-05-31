import React, { useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Switch } from 'antd'
import { useUsers, useUserRoles, useDepartments, useCreateUser, useUpdateUser, useToggleUser } from '../../services/queries/userQueries'

export default function Users(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form] = Form.useForm()
  const { data: rows = [] } = useUsers(1, 50, '')
  const { data: roles = [] } = useUserRoles()
  const { data: departments = [] } = useDepartments()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const toggleUser = useToggleUser()

  const roleOptions = (roles || []).map((r: any) => ({ label: r?.name || r?.label || String(r?.id), value: r?.id }))
  const departmentOptions = (departments || []).map((d: any) => ({ label: d?.name || d?.code || `#${d?.id}`, value: d?.id }))

  const cols = [
    { title: 'Username', dataIndex: 'username' },
    { title: 'Tên hiển thị', dataIndex: 'displayName' },
    { title: 'Chức vụ', dataIndex: 'position' },
    { title: 'MSNV', dataIndex: 'employeeCode' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Role', render: (_: any, row: any) => row.role?.name },
    { title: 'Khoa/Phòng', render: (_: any, row: any) => departments.find((d: any) => d.id === row.departmentId)?.name || '-' },
    {
      title: 'Active',
      render: (_: any, row: any) => (
        <Switch
          checked={row.isActive}
          onChange={async () => {
            try {
              const res = await toggleUser.mutateAsync(row.id)
              if (res?.success) message.success('Cập nhật thành công')
              else message.error('Cập nhật thất bại')
            } catch (e) {
              message.error('Cập nhật thất bại')
            }
          }}
        />
      )
    },
    {
      title: 'Hành động',
      render: (_: any, row: any) => (
        <Button
          type="link"
          onClick={() => {
            setEditing(row)
            form.setFieldsValue(row)
            setOpen(true)
          }}
        >
          Sửa
        </Button>
      )
    }
  ]

  const save = async () => {
    try {
      const vals = await form.validateFields()
      const roleId = Number(vals.roleId)
      const departmentId = vals.departmentId === undefined || vals.departmentId === null || vals.departmentId === ''
        ? null
        : Number(vals.departmentId)
      const payload = {
        displayName: String(vals.displayName || '').trim(),
        position: vals.position ? String(vals.position).trim() : null,
        employeeCode: vals.employeeCode ? String(vals.employeeCode).trim() : null,
        email: vals.email ? String(vals.email).trim() : null,
        roleId,
        departmentId
      }

      if (editing) {
        const res = await updateUser.mutateAsync({ id: editing.id, payload })
        if (res?.success) message.success('Cập nhật người dùng')
        else message.error(res?.message || 'Lỗi cập nhật')
      } else {
        const res = await createUser.mutateAsync({
          username: String(vals.username || '').trim(),
          displayName: String(vals.displayName || '').trim(),
          position: vals.position ? String(vals.position).trim() : null,
          employeeCode: vals.employeeCode ? String(vals.employeeCode).trim() : null,
          email: vals.email ? String(vals.email).trim() : null,
          roleId,
          password: String(vals.password || ''),
          departmentId
        })
        if (res?.success) message.success('Tạo người dùng')
        else message.error(res?.message || 'Lỗi tạo mới')
      }
      setOpen(false)
      form.resetFields()
      setEditing(null)
    } catch (e: any) {
      const backendMessage = e?.response?.data?.message || e?.message
      message.error(backendMessage || 'Lưu thất bại')
    }
  }

  return (
    <div>
      <Card title="Người dùng">
        <Button
          type="primary"
          onClick={() => {
            setEditing(null)
            form.resetFields()
            setOpen(true)
          }}
          style={{ marginBottom: 12 }}
        >
          Thêm người dùng
        </Button>
        <Table
          dataSource={rows}
          columns={cols}
          rowKey={(row) => row.id}
          loading={createUser.isPending || updateUser.isPending || toggleUser.isPending}
        />
      </Card>

      <Modal title={editing ? 'Sửa người dùng' : 'Thêm người dùng'} open={open} onOk={save} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          {!editing && <Form.Item name="username" label="Username" rules={[{ required: true }]}><Input /></Form.Item>}
          {!editing && <Form.Item name="password" label="Password" rules={[{ required: true }, { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}><Input.Password /></Form.Item>}
          <Form.Item name="displayName" label="Tên hiển thị" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="position" label="Chức vụ"><Input /></Form.Item>
          <Form.Item name="employeeCode" label="MSNV"><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}><Input /></Form.Item>
          <Form.Item name="roleId" label="Role" rules={[{ required: true }]}><Select options={roleOptions} /></Form.Item>
          <Form.Item name="departmentId" label="Khoa/Phòng">
            <Select allowClear options={departmentOptions} placeholder="Chọn khoa/phòng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
