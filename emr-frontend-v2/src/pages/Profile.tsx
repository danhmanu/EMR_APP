import React, { useEffect } from 'react'
import { Alert, Button, Card, Col, Form, Input, Row, Skeleton, Space, message } from 'antd'
import { persistAuthSession } from '../services/auth'
import { useChangeMyPassword, useMyProfile, useUpdateMyProfile } from '../services/queries/userQueries'

export default function Profile(): JSX.Element {
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const { data: myProfile, isLoading, error } = useMyProfile()
  const updateProfile = useUpdateMyProfile()
  const changePassword = useChangeMyPassword()

  useEffect(() => {
    if (!myProfile) return
    profileForm.setFieldsValue({
      username: myProfile.username || '',
      role: myProfile.role?.name || '-',
      displayName: myProfile.displayName || '',
      email: myProfile.email || '',
      position: myProfile.position || '',
      employeeCode: myProfile.employeeCode || ''
    })
  }, [myProfile, profileForm])

  const onSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields(['displayName', 'email', 'position', 'employeeCode'])
      const res = await updateProfile.mutateAsync({
        displayName: String(values.displayName || '').trim(),
        email: values.email ? String(values.email).trim() : null,
        position: values.position ? String(values.position).trim() : null,
        employeeCode: values.employeeCode ? String(values.employeeCode).trim() : null
      })

      if (!res?.success) {
        message.error(res?.message || 'Cập nhật hồ sơ thất bại')
        return
      }

      const displayName = (res.data as any)?.displayName || String(values.displayName || '').trim()
      persistAuthSession({ username: displayName })
      message.success('Đã cập nhật hồ sơ')
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || err?.message
      message.error(backendMessage || 'Không thể cập nhật hồ sơ')
    }
  }

  const onChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      const res = await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })

      if (!res?.success) {
        message.error(res?.message || 'Đổi mật khẩu thất bại')
        return
      }

      passwordForm.resetFields()
      message.success('Đổi mật khẩu thành công')
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || err?.message
      message.error(backendMessage || 'Không thể đổi mật khẩu')
    }
  }

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  if (error) {
    return <Alert type="error" message="Không thể tải hồ sơ người dùng" />
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="Hồ sơ người dùng">
        <Form form={profileForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="username" label="Username">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="role" label="Vai trò">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="displayName" label="Tên hiển thị" rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}>
                <Input placeholder="Nhập tên hiển thị" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input placeholder="name@hospital.vn" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="position" label="Chức vụ">
                <Input placeholder="Ví dụ: Kỹ sư thiết bị y tế" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="employeeCode" label="Mã nhân viên">
                <Input placeholder="Ví dụ: NV001" />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" onClick={onSaveProfile} loading={updateProfile.isPending}>
            Lưu hồ sơ
          </Button>
        </Form>
      </Card>

      <Card title="Đổi mật khẩu">
        <Form form={passwordForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="currentPassword" label="Mật khẩu hiện tại" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}>
                <Input.Password />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }, { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}>
                <Input.Password />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="confirmNewPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                    }
                  })
                ]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" onClick={onChangePassword} loading={changePassword.isPending}>
            Đổi mật khẩu
          </Button>
        </Form>
      </Card>
    </Space>
  )
}
