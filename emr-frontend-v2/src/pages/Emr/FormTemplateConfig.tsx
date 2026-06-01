import React from 'react'
import { Button, Card, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { deleteEmrFormTemplate, listEmrFormTemplates, type EmrFormTemplate } from '../../services/emrFormTemplates'

const { Text, Title } = Typography

export default function FormTemplateConfig(): JSX.Element {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const templatesQuery = useQuery({
    queryKey: ['emr-form-templates'],
    queryFn: listEmrFormTemplates
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEmrFormTemplate,
    onSuccess: async (response) => {
      if (!response.success) {
        message.error(response.message || 'Không xoá được cấu hình form')
        return
      }

      message.success('Đã xoá cấu hình form')
      await queryClient.invalidateQueries({ queryKey: ['emr-form-templates'] })
    }
  })

  const columns: ColumnsType<EmrFormTemplate> = [
    {
      title: 'Form nhập liệu',
      dataIndex: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Button type="link" style={{ padding: 0, height: 'auto' }} onClick={() => navigate(`/emr/form-templates/${record.id}/edit`)}>
            {record.name}
          </Button>
          <Text type="secondary">{record.code}</Text>
        </Space>
      )
    },
    { title: 'Nhóm', dataIndex: 'templateGroup', width: 110 },
    { title: 'Mẫu in', dataIndex: 'printTemplateCode', width: 140 },
    { title: 'Phiên bản', dataIndex: 'version', width: 90, align: 'center' },
    {
      title: 'Trạng thái',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Tag color={record.isActive ? 'green' : 'default'}>{record.isActive ? 'Đang dùng' : 'Tắt'}</Tag>
          {record.isDefault && <Tag color="blue">Mặc định</Tag>}
        </Space>
      )
    },
    {
      title: '',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/emr/form-templates/${record.id}/edit`)} />
          <Popconfirm title="Xoá cấu hình form này?" okText="Xoá" cancelText="Huỷ" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Cấu hình form nhập liệu EMR</Title>
          <Text type="secondary">Quản lý cấu hình nhập liệu theo từng biểu mẫu, liên kết dữ liệu với mẫu in và API về sau.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/emr/form-templates/new')}>Tạo form</Button>
      </div>

      <Card styles={{ body: { padding: 10 } }}>
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={templatesQuery.data || []}
          loading={templatesQuery.isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
        />
      </Card>
    </div>
  )
}
