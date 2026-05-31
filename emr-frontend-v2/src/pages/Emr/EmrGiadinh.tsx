import React from 'react'
import { Button, Card, DatePicker, Empty, Form, Select, Table, Tag, Tooltip, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { EmrPatientFilters, EmrPatientRow } from '../../services/emr'
import { useEmrDepartments, useEmrPatients, useEmrRooms } from '../../services/query'

const { Text, Title } = Typography

const TYPE_LIST_OPTIONS = [
  { value: 'ListPatientIn', label: 'Đang điều trị' },
  { value: 'ListPatientOut', label: 'Ra viện' }
]

type EmrPatientFormValues = Omit<EmrPatientFilters, 'dateFrom' | 'dateTo'> & {
  dateFrom?: Dayjs
  dateTo?: Dayjs
}

function toApiDate(value: Dayjs | string | undefined, time: string) {
  if (!value) return undefined
  if (dayjs.isDayjs(value)) return `${value.format('YYYY/MM/DD')} ${time}`
  return `${value.replaceAll('-', '/')} ${time}`
}

function yes(value: number | boolean | undefined) {
  return value === true || value === 1
}

function statusColor(status?: string | null) {
  if (status === 'DaLapBenhAn') return 'processing'
  if (status === 'DaTongKetBenhAn') return 'green'
  if (status === 'DaNhanVaoKhu') return 'blue'
  return 'default'
}

export default function EmrGiadinh(): JSX.Element {
  const [form] = Form.useForm<EmrPatientFormValues>()
  const defaultFilterValues = React.useMemo<EmrPatientFormValues>(() => {
    return {
      dateFrom: dayjs().subtract(12, 'day'),
      dateTo: dayjs(),
      typeList: 'ListPatientIn'
    }
  }, [])

  const [filters, setFilters] = React.useState<EmrPatientFilters>({})
  const [selectedId, setSelectedId] = React.useState<number | string | null>(null)
  const selectedDepartmentId = Form.useWatch('departmentId', form)

  const departments = useEmrDepartments()
  const rooms = useEmrRooms()
  const patients = useEmrPatients(filters)
  const rows = patients.data || []

  React.useEffect(() => {
    if (!selectedId && rows.length) {
      setSelectedId(rows[0].encounterId)
    }
  }, [rows, selectedId])

  const departmentOptions = React.useMemo(() => {
    return (departments.data || [])
      .filter(department => department.treatment === true)
      .map(department => ({ value: department.id, label: department.name }))
  }, [departments.data])

  const roomOptions = React.useMemo(() => {
    return (rooms.data || [])
      .filter(room => !selectedDepartmentId || room.idh === selectedDepartmentId)
      .map(room => ({ value: room.id, label: room.name }))
  }, [rooms.data, selectedDepartmentId])

  React.useEffect(() => {
    if (!selectedDepartmentId) return

    const currentRoomId = form.getFieldValue('medexalReceiveId')
    const departmentRooms = (rooms.data || []).filter(room => room.idh === selectedDepartmentId)
    const currentRoomInDepartment = departmentRooms.some(room => room.id === currentRoomId)
    if (currentRoomInDepartment) return

    form.setFieldValue('medexalReceiveId', departmentRooms[0]?.id)
  }, [form, rooms.data, selectedDepartmentId])

  const handleDepartmentChange = (departmentId?: number) => {
    if (!departmentId) {
      form.setFieldValue('medexalReceiveId', undefined)
      return
    }

    const firstRoom = (rooms.data || []).find(room => room.idh === departmentId)
    form.setFieldValue('medexalReceiveId', firstRoom?.id)
  }

  const handleSearch = (values: EmrPatientFormValues) => {
    void departments.refetch()
    void rooms.refetch()

    setFilters({
      departmentId: values.departmentId,
      medexalReceiveId: values.medexalReceiveId,
      dateFrom: toApiDate(values.dateFrom, '00:00:00'),
      dateTo: toApiDate(values.dateTo, '23:59:59'),
      typeList: values.typeList || 'ListPatientIn',
      offset: 0,
      limit: 1000,
      requestKey: Date.now()
    })
    setSelectedId(null)
  }

  const columns: ColumnsType<EmrPatientRow> = [
    { title: 'Mã bệnh nhân', dataIndex: 'hospCode', width: 135,  fixed: 'left'},
    { title: 'Mã tiếp nhận', dataIndex: 'encounterCode', width: 140},
    { title: 'Mã y tế', dataIndex: 'patientCode', width: 135 },
    {
      title: 'Tên bệnh nhân',
      dataIndex: 'fullName',
      width: 210,
      render: (value, record) => (
        <Tooltip title={record.address || record.phone || value}>
          <strong>{value}</strong>
        </Tooltip>
      )
    },
    { title: 'Ngày sinh', dataIndex: 'dateOfBirth', width: 110, align: 'center' },
    { title: 'GT', dataIndex: 'gender', width: 70, align: 'center' },
    { title: 'Số BHYT', dataIndex: 'insuranceNumber', width: 150, render: value => value || <Text type="secondary">-</Text> },
    { title: 'Phòng / Giường', key: 'roomBed', width: 160, render: (_, record) => `${record.room || '-'} / ${record.bed || '-'}` },
    { title: 'Bác sĩ ĐT', dataIndex: 'attendingDoctor', width: 170, ellipsis: true },
    { title: 'Ngày vào viện', dataIndex: 'admissionDate', width: 150 },
    { title: 'Chẩn đoán', dataIndex: 'diagnosis', width: 320, ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'status', width: 150, render: value => <Tag color={statusColor(value)}>{value || '-'}</Tag> },
    { title: 'TKBA', dataIndex: 'isSummarized', width: 85, align: 'center', render: value => yes(value) ? <Tag color="green">Đã TK</Tag> : <Tag>Chưa</Tag> }
  ]

  return (
    <div className="emr-page">
      <div className="emr-page__hero">
        <div>
          <Title level={2} style={{ margin: 0 }}>Danh sách bệnh nhân EMR</Title>
        </div>
      </div>

      <Card className="emr-page__board" styles={{ body: { padding: 8 } }}>
        <Form form={form} layout="inline" initialValues={defaultFilterValues} onFinish={handleSearch} style={{ gap: 10, rowGap: 8 }}>
          
          <Form.Item name="dateFrom" label="Nhập viện từ ngày:">
            <DatePicker format="DD/MM/YYYY" allowClear={false} style={{ width: 150 }} />
          </Form.Item>

          <Form.Item name="dateTo" label="Đến ngày:">
            <DatePicker format="DD/MM/YYYY" allowClear={false} style={{ width: 150 }} />
          </Form.Item>

          <Form.Item name="departmentId" label="Khoa:">
            <Select
              allowClear
              showSearch
              loading={departments.isLoading}
              optionFilterProp="label"
              options={departmentOptions}
              style={{ width: 250 }}
              onChange={handleDepartmentChange}
            />
          </Form.Item>

          <Form.Item name="medexalReceiveId" label="Khu vực:" rules={[{ required: true, message: 'Chọn khu vực' }]}>
            <Select
              allowClear
              showSearch
              loading={rooms.isLoading}
              optionFilterProp="label"
              options={roomOptions}
              style={{ width: 230 }}
            />
          </Form.Item>
          <Form.Item name="typeList" label="Tình trạng:">
            <Select options={TYPE_LIST_OPTIONS} style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={patients.isFetching}>
              Tìm kiếm
            </Button>
          </Form.Item>
        </Form>

        <Table
          rowKey="encounterId"
          columns={columns}
          dataSource={rows}
          loading={patients.isLoading || patients.isFetching}
          size="small"
          bordered
          locale={{ emptyText: <Empty description="Chọn khu vực và bấm Tìm kiếm" /> }}
          scroll={{ x: 1880, y: 520 }}
          pagination={{ pageSize: 20, showSizeChanger: false, showTotal: total => `${total} bệnh nhân` }}
          rowClassName={record => record.encounterId === selectedId ? 'emr-row-selected' : ''}
          onRow={(record) => ({ onClick: () => setSelectedId(record.encounterId) })}
        />
      </Card>
    </div>
  )
}
