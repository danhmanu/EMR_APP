import React from 'react'
import { Button, Card, Col, Descriptions, Empty, Form, Input, Row, Select, Space, Statistic, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd'
import { FileDoneOutlined, LockOutlined, MedicineBoxOutlined, ReloadOutlined, SearchOutlined, SignatureOutlined, UnlockOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { EmrDocument, EmrOrder, EmrPatientFilters, EmrPatientRow } from '../../services/emr'
import { emrQueryKeys, useEmrDashboard, useEmrEncounter, useEmrPatients, useSummarizeEmrEncounter, useToggleEmrLock } from '../../services/query'
import { useQueryClient } from '@tanstack/react-query'

const { Title, Text } = Typography

const STATUS_OPTIONS = [
  { value: 'Dang dieu tri', label: 'Đang điều trị' },
  { value: 'Cho ky', label: 'Chờ ký' },
  { value: 'Cho phau thuat', label: 'Chờ phẫu thuật' }
]

const TREATMENT_OPTIONS = [
  { value: 'Noi tru', label: 'Nội trú' },
  { value: 'Ngoai tru', label: 'Ngoại trú' },
  { value: 'Dieu tri ngoai tru', label: 'Điều trị ngoại trú' }
]

function yes(value: number | boolean | undefined) {
  return value === true || value === 1
}

function statusColor(status?: string | null) {
  if (status === 'Dang dieu tri') return 'processing'
  if (status === 'Cho ky') return 'warning'
  if (status === 'Cho phau thuat') return 'red'
  return 'default'
}

function labelFromOptions(options: Array<{ value: string; label: string }>, value?: string | null) {
  return options.find(option => option.value === value)?.label || value || '-'
}

export default function EmrGiadinh(): JSX.Element {
  const [form] = Form.useForm<EmrPatientFilters>()
  const queryClient = useQueryClient()
  const [filters, setFilters] = React.useState<EmrPatientFilters>({ treatmentType: 'Noi tru' })
  const [selectedId, setSelectedId] = React.useState<number | null>(null)

  const dashboard = useEmrDashboard()
  const patients = useEmrPatients(filters)
  const rows = patients.data || []

  React.useEffect(() => {
    if (!selectedId && rows.length) {
      setSelectedId(rows[0].encounterId)
    }
  }, [rows, selectedId])

  const detail = useEmrEncounter(selectedId)
  const lockMutation = useToggleEmrLock()
  const summarizeMutation = useSummarizeEmrEncounter()

  const departmentOptions = React.useMemo(
    () => Array.from(new Set(rows.map(row => row.department).filter(Boolean))).map(value => ({ value, label: value })),
    [rows]
  )
  const selectedRow = rows.find(row => row.encounterId === selectedId)
  const current = detail.data?.encounter

  const handleSearch = (values: EmrPatientFilters) => {
    setFilters(values)
    setSelectedId(null)
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: emrQueryKeys.all })

  const columns: ColumnsType<EmrPatientRow> = [
    { title: 'Loại ĐT', dataIndex: 'treatmentType', width: 92, fixed: 'left', render: value => labelFromOptions(TREATMENT_OPTIONS, value) },
    { title: 'Mã tiếp nhận', dataIndex: 'encounterCode', width: 140 },
    { title: 'Mã y tế', dataIndex: 'patientCode', width: 105 },
    {
      title: 'Tên bệnh nhân',
      dataIndex: 'fullName',
      width: 190,
      render: (value, record) => (
        <Tooltip title={record.address || record.phone || value}>
          <strong>{value}</strong>
        </Tooltip>
      )
    },
    { title: 'Ngày sinh', dataIndex: 'dateOfBirth', width: 105, align: 'center' },
    { title: 'GT', dataIndex: 'gender', width: 70, align: 'center' },
    { title: 'Số BHYT', dataIndex: 'insuranceNumber', width: 140, render: value => value || <Text type="secondary">-</Text> },
    { title: 'Khoa', dataIndex: 'department', width: 170, ellipsis: true },
    {
      title: 'Phòng / Giường',
      key: 'roomBed',
      width: 130,
      render: (_, record) => `${record.room || '-'} / ${record.bed || '-'}`
    },
    { title: 'Bác sĩ ĐT', dataIndex: 'attendingDoctor', width: 160, ellipsis: true },
    { title: 'Ngày vào viện', dataIndex: 'admissionDate', width: 135 },
    { title: 'Chẩn đoán', dataIndex: 'diagnosis', width: 270, ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'status', width: 125, render: value => <Tag color={statusColor(value)}>{labelFromOptions(STATUS_OPTIONS, value)}</Tag> },
    { title: 'TKBA', dataIndex: 'isSummarized', width: 85, align: 'center', render: value => yes(value) ? <Tag color="green">Đã TK</Tag> : <Tag>Chưa</Tag> },
    { title: 'Khóa', dataIndex: 'isLocked', width: 72, align: 'center', render: value => yes(value) ? <LockOutlined /> : <UnlockOutlined /> }
  ]

  const orderColumns: ColumnsType<EmrOrder> = [
    { title: 'Loại', dataIndex: 'orderType', width: 130 },
    { title: 'Tên chỉ định', dataIndex: 'name' },
    { title: 'Trạng thái', dataIndex: 'status', width: 145, render: value => <Tag color={value === 'Da co ket qua' ? 'green' : 'blue'}>{value}</Tag> },
    { title: 'Kết quả', dataIndex: 'result' },
    { title: 'Thời gian', dataIndex: 'requestedAt', width: 150 }
  ]

  const documentColumns: ColumnsType<EmrDocument> = [
    { title: 'Loại giấy tờ', dataIndex: 'documentType', width: 150 },
    { title: 'Tiêu đề', dataIndex: 'title' },
    { title: 'Trạng thái', dataIndex: 'status', width: 130, render: value => <Tag color={value === 'Da luu' ? 'green' : 'warning'}>{value}</Tag> },
    { title: 'Cập nhật', dataIndex: 'updatedAt', width: 150 }
  ]

  return (
    <div className="emr-page">
      <div className="emr-page__hero">
        <div>
          <Text className="emr-page__eyebrow">GIADINH HOSPITAL</Text>
          <Title level={2} style={{ margin: 0 }}>Danh sách bệnh nhân EMR</Title>
          <Text type="secondary">Tra cứu bệnh nhân nội trú, hồ sơ bệnh án, chỉ định và giấy tờ liên quan.</Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refresh}>Tải lại</Button>
          <Button type="primary" icon={<FileDoneOutlined />} disabled={!selectedId} loading={summarizeMutation.isPending} onClick={() => selectedId && summarizeMutation.mutate(selectedId, { onSuccess: () => message.success('Đã tổng kết bệnh án') })}>Tổng kết BA</Button>
          <Button danger icon={<LockOutlined />} disabled={!selectedId} loading={lockMutation.isPending} onClick={() => selectedId && lockMutation.mutate(selectedId, { onSuccess: () => message.success('Đã cập nhật khóa EMR') })}>Khóa/Mở EMR</Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} className="emr-page__stats">
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Tổng hồ sơ" value={Number(dashboard.data?.summary?.totalEncounters || 0)} prefix={<MedicineBoxOutlined />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Đang điều trị" value={Number(dashboard.data?.summary?.activeEncounters || 0)} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Đã khóa EMR" value={Number(dashboard.data?.summary?.lockedRecords || 0)} prefix={<LockOutlined />} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="Đã tổng kết" value={Number(dashboard.data?.summary?.summarizedRecords || 0)} prefix={<SignatureOutlined />} /></Card></Col>
      </Row>

      <Card className="emr-page__board" styles={{ body: { padding: 12 } }}>
        <Form form={form} layout="vertical" initialValues={filters} onFinish={handleSearch}>
          <Row gutter={[8, 8]} align="bottom">
            <Col xs={24} lg={7}>
              <Form.Item name="q" label="Tìm kiếm">
                <Input allowClear placeholder="Tên, mã y tế, mã tiếp nhận, BHYT, chẩn đoán" prefix={<SearchOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Form.Item name="treatmentType" label="Loại điều trị">
                <Select allowClear options={TREATMENT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Form.Item name="status" label="Trạng thái">
                <Select allowClear options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8} lg={5}>
              <Form.Item name="department" label="Khoa">
                <Select allowClear showSearch optionFilterProp="label" options={departmentOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label=" ">
                <Button type="primary" htmlType="submit" block>Tìm kiếm</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Table
          rowKey="encounterId"
          columns={columns}
          dataSource={rows}
          loading={patients.isLoading || patients.isFetching}
          size="small"
          bordered
          scroll={{ x: 2050, y: 380 }}
          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: total => `${total} bệnh nhân` }}
          rowClassName={record => record.encounterId === selectedId ? 'emr-row-selected' : ''}
          onRow={(record) => ({ onClick: () => setSelectedId(record.encounterId) })}
        />
      </Card>

      <Card className="emr-page__detail" styles={{ body: { padding: 12 } }}>
        {selectedRow && current ? (
          <Tabs
            items={[
              {
                key: 'summary',
                label: 'Tổng quan bệnh án',
                children: (
                  <Row gutter={[12, 12]}>
                    <Col xs={24} lg={16}>
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="Bệnh nhân">{selectedRow.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Mã y tế">{selectedRow.patientCode}</Descriptions.Item>
                        <Descriptions.Item label="Mã tiếp nhận">{selectedRow.encounterCode}</Descriptions.Item>
                        <Descriptions.Item label="Bác sĩ">{selectedRow.attendingDoctor}</Descriptions.Item>
                        <Descriptions.Item label="Khoa">{selectedRow.department}</Descriptions.Item>
                        <Descriptions.Item label="Phòng/Giường">{selectedRow.room} / {selectedRow.bed}</Descriptions.Item>
                        <Descriptions.Item label="Mạch">{current.pulse || '-'} lần/phút</Descriptions.Item>
                        <Descriptions.Item label="Nhiệt độ">{current.temperature || '-'} °C</Descriptions.Item>
                        <Descriptions.Item label="Huyết áp">{current.bloodPressure || '-'}</Descriptions.Item>
                        <Descriptions.Item label="SpO2">{current.spo2 || '-'}%</Descriptions.Item>
                        <Descriptions.Item label="Chẩn đoán" span={2}>{selectedRow.diagnosis}</Descriptions.Item>
                        <Descriptions.Item label="Lý do vào viện" span={2}>{current.chiefComplaint}</Descriptions.Item>
                        <Descriptions.Item label="Bệnh sử" span={2}>{current.medicalHistory}</Descriptions.Item>
                      </Descriptions>
                    </Col>
                    <Col xs={24} lg={8}>
                      <Card size="small" title="Trạng thái hồ sơ">
                        <Space direction="vertical" size={10}>
                          <Tag color={statusColor(selectedRow.status)}>{labelFromOptions(STATUS_OPTIONS, selectedRow.status)}</Tag>
                          <Tag color={yes(selectedRow.isSummarized) ? 'green' : 'default'}>{yes(selectedRow.isSummarized) ? 'Đã tổng kết bệnh án' : 'Chưa tổng kết'}</Tag>
                          <Tag color={yes(selectedRow.isLocked) ? 'red' : 'blue'}>{yes(selectedRow.isLocked) ? 'EMR đã khóa' : 'EMR đang mở'}</Tag>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                )
              },
              { key: 'orders', label: 'Chỉ định', children: <Table rowKey="id" columns={orderColumns} dataSource={detail.data?.orders || []} size="small" bordered pagination={false} /> },
              { key: 'documents', label: 'Giấy tờ liên quan', children: <Table rowKey="id" columns={documentColumns} dataSource={detail.data?.documents || []} size="small" bordered pagination={false} /> }
            ]}
          />
        ) : (
          <Empty description="Chọn một bệnh nhân để xem bệnh án" />
        )}
      </Card>
    </div>
  )
}
