import React from 'react'
import { Button, Card, Form, Input, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SaveOutlined, SettingOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSystemConfiguration,
  updateSystemConfiguration,
  type SystemConfiguration,
  type SystemConfigurationItemPayload
} from '../../services/systemConfiguration'

const SYSTEM_CONFIGURATION_KEY = ['system-configuration'] as const

const DEFAULT_CONFIGURATION_ROWS: SystemConfigurationItemPayload[] = [
  { code: 'UNIT_NAME', value: '', description: 'Tên đơn vị/bệnh viện quản lý hệ thống' },
  { code: 'UNIT_ADDRESS', value: '', description: 'Địa chỉ đơn vị/bệnh viện' },
  { code: 'UNIT_TAX_CODE', value: '', description: 'Mã số thuế' },
  { code: 'UNIT_BANK_ACCOUNT', value: '', description: 'Số tài khoản' },
  { code: 'UNIT_PHONE', value: '', description: 'Số điện thoại' }
]

function extractApiErrorMessage(error: unknown): string {
  const responseData = (error as any)?.response?.data
  return responseData?.message || (error as any)?.message || 'Yêu cầu thất bại'
}

function mergeDefaults(items: SystemConfiguration[] | undefined): SystemConfigurationItemPayload[] {
  const byCode = new Map((items || []).map((item) => [item.code, item]))
  const merged = DEFAULT_CONFIGURATION_ROWS.map((defaultItem) => {
    const item = byCode.get(defaultItem.code)
    return {
      code: defaultItem.code,
      value: item?.value || '',
      description: item?.description || defaultItem.description || ''
    }
  })

  for (const item of items || []) {
    if (DEFAULT_CONFIGURATION_ROWS.some((defaultItem) => defaultItem.code === item.code)) continue
    merged.push({
      code: item.code,
      value: item.value || '',
      description: item.description || ''
    })
  }

  return merged
}

export default function SystemConfiguration(): JSX.Element {
  const [form] = Form.useForm<{ items: SystemConfigurationItemPayload[] }>()
  const queryClient = useQueryClient()

  const configQuery = useQuery({
    queryKey: SYSTEM_CONFIGURATION_KEY,
    queryFn: getSystemConfiguration
  })

  React.useEffect(() => {
    if (!configQuery.isSuccess) return
    form.resetFields()
    form.setFieldsValue({ items: mergeDefaults(configQuery.data) })
  }, [configQuery.data, form])

  const updateMutation = useMutation({
    mutationFn: updateSystemConfiguration,
    onSuccess: async (res) => {
      if (!res.success) {
        message.error(res.message || 'Không thể lưu cấu hình hệ thống')
        return
      }

      message.success('Đã lưu cấu hình hệ thống')
      await queryClient.invalidateQueries({ queryKey: SYSTEM_CONFIGURATION_KEY })
    },
    onError: (error) => message.error(extractApiErrorMessage(error))
  })

  async function submit() {
    try {
      const values = await form.validateFields()
      await updateMutation.mutateAsync({
        items: (values.items || [])
          .filter((item) => item.code?.trim())
          .map((item) => ({
            code: item.code.trim().toUpperCase(),
            value: item.value?.trim() || null,
            description: item.description?.trim() || null
          }))
      })
    } catch {
      message.error('Kiểm tra lại thông tin cấu hình')
    }
  }

  const columns: ColumnsType<SystemConfigurationItemPayload> = [
    {
      title: 'Code',
      dataIndex: 'code',
      width: 220,
      render: (_value, _record, index) => (
        <Form.Item
          name={['items', index, 'code']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: 'Nhập code' }]}
        >
          <Input maxLength={100} />
        </Form.Item>
      )
    },
    {
      title: 'Value',
      dataIndex: 'value',
      width: 320,
      render: (_value, _record, index) => (
        <Form.Item name={['items', index, 'value']} style={{ margin: 0 }}>
          <Input maxLength={1000} />
        </Form.Item>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (_value, _record, index) => (
        <Form.Item name={['items', index, 'description']} style={{ margin: 0 }}>
          <Input maxLength={500} />
        </Form.Item>
      )
    }
  ]

  return (
    <Card
      loading={configQuery.isLoading}
      title={<Space><SettingOutlined /><span>Cấu hình hệ thống</span></Space>}
      extra={
        <Button type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending} onClick={() => void submit()}>
          Lưu cấu hình
        </Button>
      }
    >
      <Form form={form} component={false} initialValues={{ items: DEFAULT_CONFIGURATION_ROWS }}>
        <Form.List name="items">
          {(fields, { add }) => (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Table
                rowKey={(record) => String((record as any).key)}
                columns={columns}
                dataSource={fields.map((field) => ({
                  key: field.key,
                  ...(form.getFieldValue(['items', field.name]) || {})
                }))}
                pagination={false}
                scroll={{ x: 900 }}
              />
              <Space>
                <Button onClick={() => add({ code: '', value: '', description: '' })}>
                  Thêm cấu hình
                </Button>
                <Button type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending} onClick={() => void submit()}>
                  Lưu cấu hình
                </Button>
              </Space>
            </Space>
          )}
        </Form.List>
      </Form>
    </Card>
  )
}
