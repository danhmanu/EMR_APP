import React from 'react'
import { Button, Card, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { deleteEmrPrintTemplate, listEmrPrintTemplates, type EmrPrintTemplate } from '../../services/emrPrintTemplates'

const { Text, Title } = Typography

export default function PrintTemplateConfig(): JSX.Element {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const templatesQuery = useQuery({
    queryKey: ['emr-print-templates'],
    queryFn: listEmrPrintTemplates
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEmrPrintTemplate,
    onSuccess: async (response) => {
      if (!response.success) {
        message.error(response.message || 'Không xoá được mẫu in')
        return
      }

      message.success('Đã xoá mẫu in')
      await queryClient.invalidateQueries({ queryKey: ['emr-print-templates'] })
    }
  })

  const columns: ColumnsType<EmrPrintTemplate> = [
    {
      title: 'Mẫu in',
      dataIndex: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Button type="link" style={{ padding: 0, height: 'auto' }} onClick={() => navigate(`/emr/print-templates/${record.id}/edit`)}>
            {record.name}
          </Button>
          <Text type="secondary">{record.code}</Text>
        </Space>
      )
    },
    { title: 'Nhóm', dataIndex: 'templateGroup', width: 110 },
    { title: 'Phiên bản', dataIndex: 'version', width: 90, align: 'center' },
    { title: 'Khổ giấy', dataIndex: 'paperSize', width: 90, align: 'center' },
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
          <Button icon={<EditOutlined />} onClick={() => navigate(`/emr/print-templates/${record.id}/edit`)} />
          <Popconfirm title="Xoá mẫu in này?" okText="Xoá" cancelText="Huỷ" onConfirm={() => deleteMutation.mutate(record.id)}>
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
          <Title level={3} style={{ margin: 0 }}>Cấu hình mẫu in EMR</Title>
          <Text type="secondary">Quản lý danh sách mẫu in. Bấm tạo mới hoặc chỉnh sửa để mở giao diện kéo thả.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/emr/print-templates/new')}>Tạo mẫu</Button>
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
