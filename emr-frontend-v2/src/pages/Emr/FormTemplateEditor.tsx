import React from 'react'
import { Button, Card, Col, Divider, Empty, Form, Input, InputNumber, Row, Select, Space, Switch, Tabs, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createEmrFormTemplate,
  getEmrFormTemplate,
  updateEmrFormTemplate,
  type EmrFormTemplatePayload
} from '../../services/emrFormTemplates'
import { listEmrPrintTemplates } from '../../services/emrPrintTemplates'

const { Text, Title } = Typography

type FormFieldOption = { label: string; value: string }
type FormFieldSchema = {
  id: string
  label: string
  path: string
  type: string
  span?: number
  required?: boolean
  readonly?: boolean
  placeholder?: string
  defaultValue?: string
  options?: FormFieldOption[]
  min?: number
  max?: number
}

type FormSectionSchema = {
  id: string
  title: string
  columns: number
  fields: FormFieldSchema[]
}

type FormLayoutSchema = {
  sections: FormSectionSchema[]
}

type FormValues = Omit<EmrFormTemplatePayload, 'layoutJson' | 'defaultDataJson'> & {
  defaultDataJson?: string | null
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Số' },
  { value: 'date', label: 'Ngày' },
  { value: 'datetime', label: 'Ngày giờ' },
  { value: 'textarea', label: 'Nội dung dài' },
  { value: 'select', label: 'Select' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'table', label: 'Bảng' },
  { value: 'file', label: 'Tệp đính kèm' },
  { value: 'image', label: 'Hình ảnh' },
  { value: 'signature', label: 'Chữ ký' }
]

const DEFAULT_LAYOUT = `{
  "sections": [
    {
      "title": "Thông tin hành chính",
      "columns": 2,
      "fields": [
        { "label": "Họ và tên", "path": "patient.fullName", "type": "text", "required": true },
        { "label": "Mã bệnh nhân", "path": "patient.hospCode", "type": "text", "required": true },
        { "label": "Ngày sinh", "path": "patient.dateOfBirth", "type": "date" },
        { "label": "Giới tính", "path": "patient.gender", "type": "radio", "options": [{ "label": "Nam", "value": "Nam" }, { "label": "Nữ", "value": "Nu" }] },
        { "label": "Địa chỉ", "path": "patient.address", "type": "textarea", "span": 2 }
      ]
    }
  ]
}`

const DEFAULT_DATA = `{}`
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

function safeParseJson<T>(value?: string | null, fallback?: T): T {
  if (!value) return fallback as T
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback as T
  }
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function normalizeField(field: Partial<FormFieldSchema>): FormFieldSchema {
  return {
    id: field.id || createId(),
    label: field.label || field.path || 'Trường dữ liệu',
    path: field.path || '',
    type: field.type || 'text',
    span: Number(field.span || 1),
    required: Boolean(field.required),
    readonly: Boolean(field.readonly),
    placeholder: field.placeholder,
    defaultValue: field.defaultValue,
    options: field.options || [],
    min: field.min,
    max: field.max
  }
}

function withIds(layout: Partial<FormLayoutSchema>): FormLayoutSchema {
  return {
    sections: (layout.sections?.length ? layout.sections : safeParseJson<FormLayoutSchema>(DEFAULT_LAYOUT, { sections: [] }).sections).map(section => ({
      id: section.id || createId(),
      title: section.title || 'Nhóm thông tin',
      columns: Number(section.columns || 2),
      fields: (section.fields || []).map(normalizeField)
    }))
  }
}

function cleanField(field: FormFieldSchema) {
  return {
    label: field.label,
    path: field.path,
    type: field.type,
    span: field.span,
    required: field.required,
    readonly: field.readonly,
    placeholder: field.placeholder,
    defaultValue: field.defaultValue,
    options: field.options?.length ? field.options : undefined,
    min: field.min,
    max: field.max
  }
}

function stripIds(layout: FormLayoutSchema): FormLayoutSchema {
  return {
    sections: layout.sections.map(section => ({
      id: undefined as never,
      title: section.title,
      columns: section.columns,
      fields: section.fields.map(cleanField) as FormFieldSchema[]
    }))
  }
}

function renderInputPreview(field: FormFieldSchema) {
  if (field.type === 'textarea') return <Input.TextArea rows={2} placeholder={field.placeholder} disabled={field.readonly} />
  if (field.type === 'number') return <InputNumber min={field.min} max={field.max} placeholder={field.placeholder} disabled={field.readonly} style={{ width: '100%' }} />
  if (['select', 'radio'].includes(field.type)) return <Select placeholder={field.placeholder} disabled={field.readonly} options={field.options || []} />
  if (field.type === 'checkbox') return <Switch disabled={field.readonly} />
  if (['file', 'image', 'signature'].includes(field.type)) return <Input placeholder="Vùng nhập dữ liệu đặc biệt" disabled />
  return <Input placeholder={field.placeholder} disabled={field.readonly} />
}

export default function FormTemplateEditor(): JSX.Element {
  const [form] = Form.useForm<FormValues>()
  const navigate = useNavigate()
  const params = useParams()
  const queryClient = useQueryClient()
  const id = params.id ? Number(params.id) : 0
  const isCreate = !id
  const [layout, setLayout] = React.useState<FormLayoutSchema>(() => withIds(safeParseJson(DEFAULT_LAYOUT, { sections: [] })))
  const defaultDataJson = Form.useWatch('defaultDataJson', form)

  const templateQuery = useQuery({
    queryKey: ['emr-form-template', id],
    queryFn: () => getEmrFormTemplate(id),
    enabled: !isCreate
  })

  const printTemplatesQuery = useQuery({
    queryKey: ['emr-print-templates'],
    queryFn: listEmrPrintTemplates
  })

  React.useEffect(() => {
    if (!templateQuery.data) return
    const template = templateQuery.data
    form.setFieldsValue({
      code: template.code,
      name: template.name,
      description: template.description,
      templateGroup: template.templateGroup,
      printTemplateCode: template.printTemplateCode,
      version: template.version,
      defaultDataJson: template.defaultDataJson || DEFAULT_DATA,
      isActive: template.isActive,
      isDefault: template.isDefault
    })
    setLayout(withIds(safeParseJson(template.layoutJson, {})))
  }, [form, templateQuery.data])

  React.useEffect(() => {
    if (!isCreate) return
    form.setFieldsValue({
      code: '',
      name: '',
      description: '',
      templateGroup: 'EMR',
      printTemplateCode: undefined,
      version: 1,
      defaultDataJson: DEFAULT_DATA,
      isActive: true,
      isDefault: false
    })
  }, [form, isCreate])

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: EmrFormTemplatePayload = {
        ...values,
        layoutJson: prettyJson(stripIds(layout)),
        defaultDataJson: values.defaultDataJson || null
      }
      return isCreate ? createEmrFormTemplate(payload) : updateEmrFormTemplate(id, payload)
    },
    onSuccess: async (response) => {
      if (!response.success) {
        message.error(response.message || 'Không lưu được cấu hình form')
        return
      }
      message.success('Đã lưu cấu hình form')
      await queryClient.invalidateQueries({ queryKey: ['emr-form-templates'] })
      navigate('/emr/form-templates')
    }
  })

  const updateSection = (sectionId: string, patch: Partial<FormSectionSchema>) => {
    setLayout(current => ({
      ...current,
      sections: current.sections.map(section => section.id === sectionId ? { ...section, ...patch } : section)
    }))
  }

  const addSection = () => {
    setLayout(current => ({
      ...current,
      sections: [...current.sections, { id: createId(), title: 'Nhóm thông tin mới', columns: 2, fields: [] }]
    }))
  }

  const removeSection = (sectionId: string) => {
    setLayout(current => ({ ...current, sections: current.sections.filter(section => section.id !== sectionId) }))
  }

  const addField = (sectionId: string) => {
    setLayout(current => ({
      ...current,
      sections: current.sections.map(section => section.id === sectionId
        ? { ...section, fields: [...section.fields, normalizeField({ label: 'Trường mới', path: 'newField', type: 'text' })] }
        : section)
    }))
  }

  const updateField = (sectionId: string, fieldId: string, patch: Partial<FormFieldSchema>) => {
    setLayout(current => ({
      ...current,
      sections: current.sections.map(section => section.id === sectionId
        ? { ...section, fields: section.fields.map(field => field.id === fieldId ? { ...field, ...patch } : field) }
        : section)
    }))
  }

  const removeField = (sectionId: string, fieldId: string) => {
    setLayout(current => ({
      ...current,
      sections: current.sections.map(section => section.id === sectionId
        ? { ...section, fields: section.fields.filter(field => field.id !== fieldId) }
        : section)
    }))
  }

  const updateOption = (sectionId: string, field: FormFieldSchema, index: number, patch: Partial<FormFieldOption>) => {
    const options = [...(field.options || [])]
    options[index] = { ...options[index], ...patch }
    updateField(sectionId, field.id, { options })
  }

  const addOption = (sectionId: string, field: FormFieldSchema) => {
    updateField(sectionId, field.id, { options: [...(field.options || []), { label: 'Lựa chọn mới', value: 'new_value' }] })
  }

  const removeOption = (sectionId: string, field: FormFieldSchema, index: number) => {
    updateField(sectionId, field.id, { options: (field.options || []).filter((_, itemIndex) => itemIndex !== index) })
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    if (!layout.sections.length) {
      message.error('Form cần ít nhất một section')
      return
    }
    saveMutation.mutate(values)
  }

  return (
    <div style={{ minHeight: '100%', background: '#f6f7f9' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/emr/form-templates')} />
            <div>
              <Title level={4} style={{ margin: 0 }}>{isCreate ? 'Tạo form nhập liệu' : 'Chỉnh sửa form nhập liệu'}</Title>
              <Text type="secondary">Cấu hình field theo từng biểu mẫu. Path sẽ là key dữ liệu dùng chung với mẫu in và API sau này.</Text>
            </div>
          </Space>
          <Space>
            <Button onClick={addSection} icon={<PlusOutlined />}>Thêm section</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} onClick={handleSave}>Lưu form</Button>
          </Space>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Card styles={{ body: { padding: 12 } }} style={{ marginBottom: 12 }}>
          <Form form={form} layout="vertical">
            <Row gutter={10}>
              <Col xs={24} md={8}><Form.Item name="code" label="Mã form" rules={[{ required: true }]}><Input placeholder="VD: BA_VAO_VIEN_FORM" /></Form.Item></Col>
              <Col xs={24} md={16}><Form.Item name="name" label="Tên form" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24}><Form.Item name="description" label="Mô tả"><Input /></Form.Item></Col>
              <Col xs={12} md={6}><Form.Item name="templateGroup" label="Nhóm"><Input /></Form.Item></Col>
              <Col xs={12} md={6}><Form.Item name="version" label="Phiên bản"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col xs={24} md={8}>
                <Form.Item name="printTemplateCode" label="Liên kết mẫu in">
                  <Select
                    allowClear
                    loading={printTemplatesQuery.isLoading}
                    options={(printTemplatesQuery.data || []).map(item => ({ value: item.code, label: `${item.code} - ${item.name}` }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}><Form.Item name="isActive" label="Đang dùng" valuePropName="checked"><Switch /></Form.Item></Col>
              <Col xs={12} md={4}><Form.Item name="isDefault" label="Mặc định" valuePropName="checked"><Switch /></Form.Item></Col>
            </Row>
          </Form>
        </Card>

        <Tabs
          items={[
            {
              key: 'builder',
              label: 'Cấu hình form',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  {layout.sections.map(section => (
                    <Card
                      key={section.id}
                      size="small"
                      title={<Input value={section.title} onChange={event => updateSection(section.id, { title: event.target.value })} />}
                      extra={
                        <Space>
                          <Text type="secondary">Cột</Text>
                          <InputNumber min={1} max={4} size="small" value={section.columns} onChange={value => updateSection(section.id, { columns: Number(value || 1) })} />
                          <Button size="small" icon={<PlusOutlined />} onClick={() => addField(section.id)}>Thêm field</Button>
                          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeSection(section.id)} />
                        </Space>
                      }
                      styles={{ body: { padding: 10 } }}
                    >
                      {!section.fields.length ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có field" />
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {section.fields.map(field => (
                            <Card key={field.id} size="small" styles={{ body: { padding: 10 } }}>
                              <Row gutter={[8, 8]} align="middle">
                                <Col xs={24} md={5}><Input addonBefore="Label" value={field.label} onChange={event => updateField(section.id, field.id, { label: event.target.value })} /></Col>
                                <Col xs={24} md={5}><Input addonBefore="Path" value={field.path} onChange={event => updateField(section.id, field.id, { path: event.target.value })} /></Col>
                                <Col xs={12} md={3}><Select value={field.type} onChange={value => updateField(section.id, field.id, { type: value })} options={FIELD_TYPES} style={{ width: '100%' }} /></Col>
                                <Col xs={12} md={3}><InputNumber addonBefore="Span" min={1} max={section.columns} value={field.span || 1} onChange={value => updateField(section.id, field.id, { span: Number(value || 1) })} style={{ width: '100%' }} /></Col>
                                <Col xs={12} md={2}><Switch checkedChildren="Bắt buộc" unCheckedChildren="Không" checked={field.required} onChange={checked => updateField(section.id, field.id, { required: checked })} /></Col>
                                <Col xs={12} md={2}><Switch checkedChildren="Readonly" unCheckedChildren="Sửa" checked={field.readonly} onChange={checked => updateField(section.id, field.id, { readonly: checked })} /></Col>
                                <Col xs={24} md={3}><Input placeholder="Placeholder" value={field.placeholder} onChange={event => updateField(section.id, field.id, { placeholder: event.target.value })} /></Col>
                                <Col xs={24} md={1}><Button danger icon={<DeleteOutlined />} onClick={() => removeField(section.id, field.id)} /></Col>
                                {['select', 'radio'].includes(field.type) && (
                                  <Col xs={24}>
                                    <Divider orientation="left" plain>Lựa chọn</Divider>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                      {(field.options || []).map((option, index) => (
                                        <Space key={`${field.id}-${index}`} align="start">
                                          <Input placeholder="Label" value={option.label} onChange={event => updateOption(section.id, field, index, { label: event.target.value })} />
                                          <Input placeholder="Value" value={option.value} onChange={event => updateOption(section.id, field, index, { value: event.target.value })} />
                                          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeOption(section.id, field, index)} />
                                        </Space>
                                      ))}
                                      <Button size="small" onClick={() => addOption(section.id, field)}>Thêm lựa chọn</Button>
                                    </Space>
                                  </Col>
                                )}
                                <Col xs={24}>
                                  <Form.Item label="Preview" style={{ marginBottom: 0 }} required={field.required}>
                                    {renderInputPreview(field)}
                                  </Form.Item>
                                </Col>
                              </Row>
                            </Card>
                          ))}
                        </Space>
                      )}
                    </Card>
                  ))}
                </Space>
              )
            },
            { key: 'json', label: 'JSON', children: <Input.TextArea rows={20} readOnly value={prettyJson(stripIds(layout))} style={{ fontFamily: 'Consolas, monospace', fontSize: 13 }} /> },
            { key: 'data', label: 'Dữ liệu mặc định', children: <Form form={form} layout="vertical"><Form.Item name="defaultDataJson"><Input.TextArea rows={20} style={{ fontFamily: 'Consolas, monospace', fontSize: 13 }} /></Form.Item></Form> },
            { key: 'preview', label: 'Preview', children: <Card><Text type="secondary">Dữ liệu mặc định: {defaultDataJson ? 'đã cấu hình' : 'chưa có'}</Text></Card> }
          ]}
        />
      </div>
    </div>
  )
}
