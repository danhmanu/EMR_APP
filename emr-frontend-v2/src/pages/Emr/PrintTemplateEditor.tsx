import React from 'react'
import {
  Badge,
  Button,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FontSizeOutlined,
  FormOutlined,
  NumberOutlined,
  PlusOutlined,
  SaveOutlined,
  TableOutlined
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createEmrPrintTemplate,
  getEmrPrintTemplate,
  updateEmrPrintTemplate,
  type EmrPrintTemplatePayload
} from '../../services/emrPrintTemplates'

const { Text, Title } = Typography

type FieldSchema = {
  id: string
  label: string
  path: string
  value?: string
  span?: number
  type?: string
  unit?: string
  options?: Array<{ label: string; value: string }>
  columns?: Array<{ label: string; path: string; type?: string; width?: number }>
  items?: FieldSchema[]
  display?: 'inline' | 'block'
  width?: number
  height?: number
  fit?: 'contain' | 'cover' | 'fill'
  align?: 'left' | 'center' | 'right'
  alt?: string
}

type SectionSchema = {
  id: string
  title: string
  columns: number
  fields: FieldSchema[]
}

type PrintLayoutSchema = {
  title: string
  subtitle?: string
  sections: SectionSchema[]
  signatures?: Array<{ label?: string; align?: 'left' | 'center' | 'right' }>
}

type TemplateFormValues = Omit<EmrPrintTemplatePayload, 'layoutJson' | 'sampleDataJson'> & {
  sampleDataJson?: string | null
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'static', label: 'Text tĩnh' },
  { value: 'number', label: 'Số' },
  { value: 'date', label: 'Ngày' },
  { value: 'datetime', label: 'Ngày giờ' },
  { value: 'textarea', label: 'Nội dung dài' },
  { value: 'select', label: 'Select' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'table', label: 'Bảng dữ liệu' },
  { value: 'repeater', label: 'Nhóm lặp' },
  { value: 'signature', label: 'Ô chữ ký' },
  { value: 'image', label: 'Ảnh' },
  { value: 'logo', label: 'Logo' },
  { value: 'imageList', label: 'Danh sách ảnh' }
]

const SIMPLE_COLUMN_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Số' },
  { value: 'date', label: 'Ngày' },
  { value: 'datetime', label: 'Ngày giờ' }
]

const FIELD_PALETTE = [
  { type: 'text', label: 'Text', path: 'patient.fullName', icon: <FontSizeOutlined /> },
  { type: 'static', label: 'Text tĩnh', path: '', value: 'Nội dung tĩnh', span: 2, icon: <FileTextOutlined /> },
  { type: 'date', label: 'Ngày', path: 'patient.admissionDate', icon: <FormOutlined /> },
  { type: 'datetime', label: 'Ngày giờ', path: 'patient.admissionDate', icon: <FormOutlined /> },
  { type: 'number', label: 'Số', path: 'patient.age', icon: <NumberOutlined /> },
  { type: 'textarea', label: 'Nội dung dài', path: 'patient.diagnosis', span: 2, icon: <FileTextOutlined /> },
  { type: 'select', label: 'Select', path: 'patient.gender', options: [{ label: 'Nam', value: 'Nam' }, { label: 'Nữ', value: 'Nu' }], icon: <FormOutlined /> },
  { type: 'radio', label: 'Radio', path: 'patient.gender', options: [{ label: 'Nam', value: 'Nam' }, { label: 'Nữ', value: 'Nu' }], icon: <FormOutlined /> },
  { type: 'checkbox', label: 'Checkbox', path: 'form.checked', icon: <CheckSquareOutlined /> },
  { type: 'image', label: 'Ảnh', path: 'patient.avatar', span: 1, width: 120, height: 140, fit: 'cover', align: 'center', alt: 'Ảnh người bệnh', icon: <FileTextOutlined /> },
  { type: 'logo', label: 'Logo', path: 'hospitalLogo', span: 1, width: 120, height: 60, fit: 'contain', align: 'left', alt: 'Logo', icon: <FileTextOutlined /> },
  { type: 'imageList', label: 'Danh sách ảnh', path: 'attachments.images', span: 2, width: 120, height: 90, fit: 'cover', align: 'left', alt: 'Hình ảnh', icon: <FileTextOutlined /> },
  {
    type: 'table',
    label: 'Bảng dữ liệu',
    path: 'vitals',
    span: 2,
    icon: <TableOutlined />,
    columns: [
      { label: 'Thời gian', path: 'time', type: 'datetime' },
      { label: 'Mạch', path: 'pulse', type: 'number' },
      { label: 'Nhiệt độ', path: 'temperature', type: 'number' },
      { label: 'Huyết áp', path: 'bloodPressure', type: 'text' }
    ]
  },
  {
    type: 'repeater',
    label: 'Nhóm lặp',
    path: 'progressNotes',
    span: 2,
    icon: <FileTextOutlined />,
    items: [
      { id: 'note-time', label: 'Thời gian', path: 'time', type: 'datetime', span: 1 },
      { id: 'note-content', label: 'Diễn biến', path: 'content', type: 'textarea', span: 2 }
    ]
  },
  { type: 'signature', label: 'Ô chữ ký', path: '', value: 'Bác sĩ điều trị', span: 1, icon: <FormOutlined /> }
]

const DEFAULT_SAMPLE_DATA = `{
  "hospitalName": "GIADINH HOSPITAL",
  "hospitalLogo": "https://via.placeholder.com/240x100?text=GIADINH",
  "patient": {
    "hospCode": "26336010810",
    "medicalCode": "017900026Y013770yy",
    "fullName": "NGUYỄN VĂN A",
    "dateOfBirth": "1972-01-01",
    "gender": "Nam",
    "address": "Thành phố Hồ Chí Minh",
    "admissionDate": "31/05/2026 08:00",
    "diagnosis": "Chẩn đoán mẫu",
    "avatar": "https://via.placeholder.com/240x280?text=Patient"
  },
  "attachments": {
    "images": [
      "https://via.placeholder.com/240x160?text=Image+1",
      "https://via.placeholder.com/240x160?text=Image+2"
    ]
  },
  "vitals": [
    { "time": "31/05/2026 08:00", "pulse": 80, "temperature": 37, "bloodPressure": "120/80" },
    { "time": "31/05/2026 12:00", "pulse": 78, "temperature": 36.8, "bloodPressure": "118/78" }
  ],
  "progressNotes": [
    { "time": "31/05/2026 08:30", "content": "Người bệnh tỉnh, tiếp xúc tốt." },
    { "time": "31/05/2026 14:00", "content": "Theo dõi tiếp, chưa ghi nhận bất thường." }
  ],
  "form": {
    "checked": true
  }
}`

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

function normalizeField(field: Partial<FieldSchema>): FieldSchema {
  return {
    id: field.id || createId(),
    label: field.label || field.path || 'Trường dữ liệu',
    path: field.path || '',
    value: field.value,
    span: Number(field.span || 1),
    type: field.type || 'text',
    unit: field.unit,
    options: field.options,
    columns: field.columns,
    items: field.items?.map(normalizeField),
    display: field.display,
    width: field.width,
    height: field.height,
    fit: field.fit,
    align: field.align,
    alt: field.alt
  }
}

function withIds(layout: Partial<PrintLayoutSchema>): PrintLayoutSchema {
  return {
    title: layout.title || 'TÊN BIỂU MẪU',
    subtitle: layout.subtitle || '{{hospitalName}}',
    sections: (layout.sections?.length ? layout.sections : [{ title: 'Thông tin chung', columns: 2, fields: [] }]).map(section => ({
      id: section.id || createId(),
      title: section.title || 'Thông tin',
      columns: Number(section.columns || 2),
      fields: (section.fields || []).map(normalizeField)
    })),
    signatures: layout.signatures || [{ label: 'Bác sĩ điều trị', align: 'right' }]
  }
}

function cleanField(field: FieldSchema): Omit<FieldSchema, 'id'> {
  return {
    label: field.label,
    path: field.path,
    value: field.value,
    span: field.span,
    type: field.type,
    unit: field.unit,
    options: field.options,
    columns: field.columns,
    items: field.items?.map(cleanField as any) as FieldSchema[] | undefined,
    display: field.display,
    width: field.width,
    height: field.height,
    fit: field.fit,
    align: field.align,
    alt: field.alt
  }
}

function stripIds(layout: PrintLayoutSchema) {
  return {
    title: layout.title,
    subtitle: layout.subtitle,
    sections: layout.sections.map(section => ({
      title: section.title,
      columns: section.columns,
      fields: section.fields.map(cleanField)
    })),
    signatures: layout.signatures
  }
}

function getValue(data: any, path?: string, fallback?: string) {
  if (!path) return fallback || ''
  const value = path.split('.').reduce((current, key) => current?.[key], data)
  return value === undefined || value === null || value === '' ? fallback || '' : String(value)
}

function getRawValue(data: any, path?: string) {
  if (!path) return undefined
  return path.split('.').reduce((current, key) => current?.[key], data)
}

function renderTemplateText(value: string | undefined, data: any) {
  return String(value || '').replace(/\{\{([^}]+)\}\}/g, (_, path) => getValue(data, String(path).trim()))
}

function renderOptionValue(field: FieldSchema, value: string) {
  return field.options?.find(option => option.value === value || option.label === value)?.label || value
}

function renderPreviewField(field: FieldSchema, data: any, columns: number) {
  const span = Math.max(1, Math.min(field.span || 1, columns))
  const rawValue = getRawValue(data, field.path)
  const value = getValue(data, field.path, field.value)

  if (field.type === 'table') {
    const rows = Array.isArray(rawValue) ? rawValue : []
    const tableColumns = field.columns || []
    return (
      <div key={field.id} style={{ gridColumn: `span ${span}` }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{field.label}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{tableColumns.map(column => <th key={column.path} style={{ border: '1px solid #333', padding: 5, textAlign: 'left' }}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {(rows.length ? rows : [{}]).map((row, rowIndex) => (
              <tr key={rowIndex}>{tableColumns.map(column => <td key={column.path} style={{ border: '1px solid #333', padding: 5 }}>{getValue(row, column.path)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (field.type === 'repeater') {
    const rows = Array.isArray(rawValue) ? rawValue : []
    return (
      <div key={field.id} style={{ gridColumn: `span ${span}` }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{field.label}</div>
        {(rows.length ? rows : [{}]).map((row, rowIndex) => (
          <div key={rowIndex} style={{ border: '1px solid #999', padding: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>#{rowIndex + 1}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '6px 12px' }}>
              {(field.items || []).map(item => renderPreviewField(item, row, columns))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (field.type === 'signature') {
    return (
      <div key={field.id} style={{ gridColumn: `span ${span}`, textAlign: 'center', marginTop: 24 }}>
        <div style={{ fontWeight: 700 }}>{field.value || field.label}</div>
        <div style={{ height: 70 }} />
        <div>.................................</div>
      </div>
    )
  }

  if (field.type === 'image' || field.type === 'logo') {
    const src = value
    const justifyContent = field.align === 'right' ? 'flex-end' : field.align === 'center' ? 'center' : 'flex-start'
    return (
      <div key={field.id} style={{ gridColumn: `span ${span}` }}>
        {field.label && <div style={{ fontWeight: 700, marginBottom: 6 }}>{field.label}</div>}
        <div style={{ display: 'flex', justifyContent }}>
          {src ? (
            <img
              src={src}
              alt={field.alt || field.label}
              style={{
                width: field.width || 120,
                height: field.height || 90,
                objectFit: field.fit || 'contain',
                border: field.type === 'image' ? '1px solid #999' : undefined
              }}
            />
          ) : (
            <div style={{ width: field.width || 120, height: field.height || 90, border: '1px dashed #999', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              Không có ảnh
            </div>
          )}
        </div>
      </div>
    )
  }

  if (field.type === 'imageList') {
    const images = Array.isArray(rawValue) ? rawValue : []
    const justifyContent = field.align === 'right' ? 'flex-end' : field.align === 'center' ? 'center' : 'flex-start'
    return (
      <div key={field.id} style={{ gridColumn: `span ${span}` }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{field.label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent }}>
          {(images.length ? images : ['']).map((src, index) => (
            src ? (
              <img
                key={`${src}-${index}`}
                src={String(src)}
                alt={`${field.alt || field.label} ${index + 1}`}
                style={{ width: field.width || 120, height: field.height || 90, objectFit: field.fit || 'cover', border: '1px solid #999' }}
              />
            ) : (
              <div key={index} style={{ width: field.width || 120, height: field.height || 90, border: '1px dashed #999', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                Không có ảnh
              </div>
            )
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <div key={field.id} style={{ gridColumn: `span ${span}` }}>
        <span>{rawValue === true || rawValue === 'true' || rawValue === 1 ? '☑' : '☐'} </span>
        <span style={{ fontWeight: 700 }}>{field.label}</span>
      </div>
    )
  }

  if (field.type === 'radio') {
    return (
      <div key={field.id} style={{ gridColumn: `span ${span}` }}>
        <span style={{ fontWeight: 700 }}>{field.label}: </span>
        {(field.options || []).map(option => <span key={option.value} style={{ marginRight: 12 }}>{option.value === rawValue || option.label === rawValue ? '◉' : '○'} {option.label}</span>)}
      </div>
    )
  }

  const displayValue = field.type === 'select' ? renderOptionValue(field, value) : value
  return (
    <div key={field.id} style={{ gridColumn: `span ${span}` }}>
      <span style={{ fontWeight: 700 }}>{field.label}: </span>
      <span>{displayValue}</span>
      {field.unit && <span> {field.unit}</span>}
    </div>
  )
}

function PrintPreview({ layout, sampleDataJson }: { layout: PrintLayoutSchema; sampleDataJson?: string | null }) {
  const sampleData = safeParseJson<Record<string, any>>(sampleDataJson, {})
  return (
    <div style={{ background: '#f3f4f6', padding: 16, minHeight: 620, overflow: 'auto' }}>
      <div style={{ width: 794, minHeight: 1123, margin: '0 auto', background: '#fff', color: '#111', padding: 42, boxShadow: '0 8px 28px rgba(15, 23, 42, 0.16)', fontFamily: 'Times New Roman, serif' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid #222', paddingBottom: 12, marginBottom: 18 }}>
          <div style={{ fontSize: 13, textTransform: 'uppercase' }}>{renderTemplateText(layout.subtitle, sampleData)}</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{renderTemplateText(layout.title, sampleData)}</div>
        </div>
        {layout.sections.map(section => (
          <div key={section.id} style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{section.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))`, gap: '7px 16px' }}>
              {section.fields.map(field => renderPreviewField(field, sampleData, section.columns))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Panel({ children, title, extra }: { children: React.ReactNode; title?: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      {(title || extra) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, padding: '8px 12px', borderBottom: '1px solid #eef0f2' }}>
          <Text strong>{title}</Text>
          {extra}
        </div>
      )}
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  )
}

export default function PrintTemplateEditor(): JSX.Element {
  const [form] = Form.useForm<TemplateFormValues>()
  const navigate = useNavigate()
  const params = useParams()
  const queryClient = useQueryClient()
  const id = params.id ? Number(params.id) : 0
  const isCreate = !id
  const [layout, setLayout] = React.useState<PrintLayoutSchema>(() => withIds({ sections: [{ title: 'Thông tin chung', columns: 2, fields: [] }] }))
  const [selectedField, setSelectedField] = React.useState<{ sectionId: string; fieldId: string } | null>(null)
  const sampleDataJson = Form.useWatch('sampleDataJson', form)

  const templateQuery = useQuery({
    queryKey: ['emr-print-template', id],
    queryFn: () => getEmrPrintTemplate(id),
    enabled: !isCreate
  })

  React.useEffect(() => {
    if (!templateQuery.data) return
    const template = templateQuery.data
    form.setFieldsValue({
      code: template.code,
      name: template.name,
      description: template.description,
      templateGroup: template.templateGroup,
      version: template.version,
      paperSize: template.paperSize,
      orientation: template.orientation,
      sampleDataJson: template.sampleDataJson || DEFAULT_SAMPLE_DATA,
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
      version: 1,
      paperSize: 'A4',
      orientation: 'Portrait',
      sampleDataJson: DEFAULT_SAMPLE_DATA,
      isActive: true,
      isDefault: false
    })
  }, [form, isCreate])

  const saveMutation = useMutation({
    mutationFn: async (values: TemplateFormValues) => {
      const payload: EmrPrintTemplatePayload = {
        ...values,
        layoutJson: prettyJson(stripIds(layout)),
        sampleDataJson: values.sampleDataJson || null
      }
      return isCreate ? createEmrPrintTemplate(payload) : updateEmrPrintTemplate(id, payload)
    },
    onSuccess: async (response) => {
      if (!response.success) {
        message.error(response.message || 'Không lưu được mẫu in')
        return
      }
      message.success('Đã lưu mẫu in')
      await queryClient.invalidateQueries({ queryKey: ['emr-print-templates'] })
      navigate('/emr/print-templates')
    }
  })

  const selectedFieldValue = React.useMemo(() => {
    if (!selectedField) return null
    const section = layout.sections.find(item => item.id === selectedField.sectionId)
    return section?.fields.find(item => item.id === selectedField.fieldId) || null
  }, [layout.sections, selectedField])

  const updateLayout = (updater: (current: PrintLayoutSchema) => PrintLayoutSchema) => {
    setLayout(current => updater({ ...current, sections: current.sections.map(section => ({ ...section, fields: [...section.fields] })) }))
  }

  const addSection = () => {
    updateLayout(current => ({ ...current, sections: [...current.sections, { id: createId(), title: 'Nhóm thông tin mới', columns: 2, fields: [] }] }))
  }

  const removeSection = (sectionId: string) => {
    updateLayout(current => ({ ...current, sections: current.sections.filter(section => section.id !== sectionId) }))
    if (selectedField?.sectionId === sectionId) setSelectedField(null)
  }

  const addField = (sectionId: string, paletteType: string) => {
    const palette = FIELD_PALETTE.find(item => item.type === paletteType) || FIELD_PALETTE[0]
    const field = normalizeField({
      type: palette.type,
      label: palette.label,
      path: palette.path,
      value: palette.value,
      span: palette.span || 1,
      options: palette.options,
      columns: palette.columns,
      items: palette.items,
      display: 'inline',
      width: palette.width,
      height: palette.height,
      fit: palette.fit as FieldSchema['fit'],
      align: palette.align as FieldSchema['align'],
      alt: palette.alt
    })
    updateLayout(current => ({ ...current, sections: current.sections.map(section => section.id === sectionId ? { ...section, fields: [...section.fields, field] } : section) }))
    setSelectedField({ sectionId, fieldId: field.id })
  }

  const moveField = (sourceSectionId: string, sourceFieldId: string, targetSectionId: string, targetFieldId?: string) => {
    if (sourceSectionId === targetSectionId && sourceFieldId === targetFieldId) return

    let movingField: FieldSchema | undefined
    updateLayout(current => {
      const sectionsWithoutField = current.sections.map(section => {
        if (section.id !== sourceSectionId) return section
        movingField = section.fields.find(field => field.id === sourceFieldId)
        return { ...section, fields: section.fields.filter(field => field.id !== sourceFieldId) }
      })

      if (!movingField) return current

      return {
        ...current,
        sections: sectionsWithoutField.map(section => {
          if (section.id !== targetSectionId) return section
          const fields = [...section.fields]
          const targetIndex = targetFieldId ? fields.findIndex(field => field.id === targetFieldId) : -1
          if (targetIndex >= 0) {
            fields.splice(targetIndex, 0, movingField!)
          } else {
            fields.push(movingField!)
          }
          return { ...section, fields }
        })
      }
    })

    setSelectedField({ sectionId: targetSectionId, fieldId: sourceFieldId })
  }

  const updateField = (patch: Partial<FieldSchema>) => {
    if (!selectedField) return
    updateLayout(current => ({
      ...current,
      sections: current.sections.map(section => {
        if (section.id !== selectedField.sectionId) return section
        return { ...section, fields: section.fields.map(field => field.id === selectedField.fieldId ? { ...field, ...patch } : field) }
      })
    }))
  }

  const removeField = () => {
    if (!selectedField) return
    updateLayout(current => ({
      ...current,
      sections: current.sections.map(section => section.id === selectedField.sectionId ? { ...section, fields: section.fields.filter(field => field.id !== selectedField.fieldId) } : section)
    }))
    setSelectedField(null)
  }

  const updateFieldOption = (index: number, patch: Partial<{ label: string; value: string }>) => {
    const options = [...(selectedFieldValue?.options || [])]
    options[index] = { ...options[index], ...patch }
    updateField({ options })
  }
  const addFieldOption = () => updateField({ options: [...(selectedFieldValue?.options || []), { label: 'Lựa chọn mới', value: 'new_value' }] })
  const removeFieldOption = (index: number) => updateField({ options: (selectedFieldValue?.options || []).filter((_, itemIndex) => itemIndex !== index) })

  const updateTableColumn = (index: number, patch: Partial<{ label: string; path: string; type: string; width: number }>) => {
    const columns = [...(selectedFieldValue?.columns || [])]
    columns[index] = { ...columns[index], ...patch }
    updateField({ columns })
  }
  const addTableColumn = () => updateField({ columns: [...(selectedFieldValue?.columns || []), { label: 'Cột mới', path: 'newField', type: 'text' }] })
  const removeTableColumn = (index: number) => updateField({ columns: (selectedFieldValue?.columns || []).filter((_, itemIndex) => itemIndex !== index) })

  const updateRepeaterItem = (index: number, patch: Partial<FieldSchema>) => {
    const items = [...(selectedFieldValue?.items || [])]
    items[index] = { ...items[index], ...patch }
    updateField({ items })
  }
  const addRepeaterItem = () => updateField({ items: [...(selectedFieldValue?.items || []), { id: createId(), label: 'Trường mới', path: 'newField', type: 'text', span: 1 }] })
  const removeRepeaterItem = (index: number) => updateField({ items: (selectedFieldValue?.items || []).filter((_, itemIndex) => itemIndex !== index) })

  const handleDrop = (event: React.DragEvent, sectionId: string) => {
    event.preventDefault()
    event.stopPropagation()
    const sourceSectionId = event.dataTransfer.getData('source-section-id')
    const sourceFieldId = event.dataTransfer.getData('source-field-id')
    if (sourceSectionId && sourceFieldId) {
      moveField(sourceSectionId, sourceFieldId, sectionId)
      return
    }

    const fieldType = event.dataTransfer.getData('field-type')
    if (fieldType) addField(sectionId, fieldType)
  }

  const handleFieldDrop = (event: React.DragEvent, targetSectionId: string, targetFieldId: string) => {
    event.preventDefault()
    event.stopPropagation()
    const sourceSectionId = event.dataTransfer.getData('source-section-id')
    const sourceFieldId = event.dataTransfer.getData('source-field-id')
    if (sourceSectionId && sourceFieldId) {
      moveField(sourceSectionId, sourceFieldId, targetSectionId, targetFieldId)
      return
    }

    const fieldType = event.dataTransfer.getData('field-type')
    if (!fieldType) return

    const palette = FIELD_PALETTE.find(item => item.type === fieldType) || FIELD_PALETTE[0]
    const field = normalizeField({
      type: palette.type,
      label: palette.label,
      path: palette.path,
      value: palette.value,
      span: palette.span || 1,
      options: palette.options,
      columns: palette.columns,
      items: palette.items,
      display: 'inline',
      width: palette.width,
      height: palette.height,
      fit: palette.fit as FieldSchema['fit'],
      align: palette.align as FieldSchema['align'],
      alt: palette.alt
    })

    updateLayout(current => ({
      ...current,
      sections: current.sections.map(section => {
        if (section.id !== targetSectionId) return section
        const fields = [...section.fields]
        const targetIndex = fields.findIndex(item => item.id === targetFieldId)
        if (targetIndex >= 0) fields.splice(targetIndex, 0, field)
        else fields.push(field)
        return { ...section, fields }
      })
    }))
    setSelectedField({ sectionId: targetSectionId, fieldId: field.id })
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    if (!layout.sections.length) {
      message.error('Mẫu in cần ít nhất một section')
      return
    }
    saveMutation.mutate(values)
  }

  const fieldCount = layout.sections.reduce((total, section) => total + section.fields.length, 0)

  return (
    <div style={{ minHeight: '100%', background: '#f6f7f9' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Space>
            <Tooltip title="Quay lại danh sách">
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/emr/print-templates')} />
            </Tooltip>
            <div>
              <Title level={4} style={{ margin: 0 }}>{isCreate ? 'Tạo mẫu in' : 'Chỉnh sửa mẫu in'}</Title>
              <Space size={6}>
                <Tag color="blue">{layout.sections.length} section</Tag>
                <Tag color="geekblue">{fieldCount} field</Tag>
                <Text type="secondary">Kéo field vào canvas, chọn field để chỉnh thuộc tính.</Text>
              </Space>
            </div>
          </Space>
          <Space>
            <Button onClick={addSection} icon={<PlusOutlined />}>Thêm section</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} onClick={handleSave}>Lưu mẫu</Button>
          </Space>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Row gutter={[12, 12]} align="top">
          <Col xs={24} xl={5}>
            <div style={{ position: 'sticky', top: 76 }}>
              <Panel title="Thành phần">
                <div style={{ display: 'grid', gap: 8 }}>
                  {FIELD_PALETTE.map(item => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={event => event.dataTransfer.setData('field-type', item.type)}
                      style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: '9px 10px', cursor: 'grab', background: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ color: '#1677ff' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </Col>

          <Col xs={24} xl={13}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Panel title="Thông tin mẫu">
                <Form form={form} layout="vertical">
                  <Row gutter={10}>
                    <Col xs={24} md={8}><Form.Item name="code" label="Mã mẫu" rules={[{ required: true }]}><Input placeholder="VD: BA_VAO_VIEN" /></Form.Item></Col>
                    <Col xs={24} md={16}><Form.Item name="name" label="Tên mẫu" rules={[{ required: true }]}><Input placeholder="Tên biểu mẫu" /></Form.Item></Col>
                    <Col xs={24}><Form.Item name="description" label="Mô tả"><Input placeholder="Mục đích sử dụng hoặc ghi chú nội bộ" /></Form.Item></Col>
                    <Col xs={12} md={6}><Form.Item name="templateGroup" label="Nhóm"><Input /></Form.Item></Col>
                    <Col xs={12} md={6}><Form.Item name="version" label="Phiên bản"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={12} md={6}><Form.Item name="paperSize" label="Khổ giấy"><Select options={[{ value: 'A4', label: 'A4' }, { value: 'A5', label: 'A5' }]} /></Form.Item></Col>
                    <Col xs={12} md={6}><Form.Item name="orientation" label="Hướng giấy"><Select options={[{ value: 'Portrait', label: 'Dọc' }, { value: 'Landscape', label: 'Ngang' }]} /></Form.Item></Col>
                    <Col xs={12} md={6}><Form.Item name="isActive" label="Đang dùng" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col xs={12} md={6}><Form.Item name="isDefault" label="Mặc định" valuePropName="checked"><Switch /></Form.Item></Col>
                  </Row>
                </Form>
              </Panel>

              <Panel>
                <Tabs
                  items={[
                    {
                      key: 'builder',
                      label: 'Thiết kế',
                      children: (
                        <Space direction="vertical" style={{ width: '100%' }} size={12}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <Input value={layout.title} onChange={event => setLayout({ ...layout, title: event.target.value })} placeholder="Tiêu đề mẫu in" />
                            <Input value={layout.subtitle} onChange={event => setLayout({ ...layout, subtitle: event.target.value })} placeholder="Phụ đề, ví dụ {{hospitalName}}" />
                          </div>
                          {layout.sections.map(section => (
                            <div
                              key={section.id}
                              onDragOver={event => event.preventDefault()}
                              onDrop={event => handleDrop(event, section.id)}
                              style={{ border: '1px solid #d9e2ec', borderRadius: 10, background: '#fbfcfe', overflow: 'hidden' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderBottom: '1px solid #e8eef5', background: '#fff' }}>
                                <Input value={section.title} onChange={event => updateLayout(current => ({ ...current, sections: current.sections.map(item => item.id === section.id ? { ...item, title: event.target.value } : item) }))} />
                                <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>Cột</Text>
                                <InputNumber min={1} max={4} size="small" value={section.columns} onChange={value => updateLayout(current => ({ ...current, sections: current.sections.map(item => item.id === section.id ? { ...item, columns: Number(value || 1) } : item) }))} />
                                <Tooltip title="Xoá section">
                                  <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeSection(section.id)} />
                                </Tooltip>
                              </div>
                              <div style={{ minHeight: 118, padding: 10, display: 'grid', gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))`, gap: 8 }}>
                                {section.fields.map(field => (
                                  <div
                                    key={field.id}
                                    draggable
                                    onDragStart={event => {
                                      event.stopPropagation()
                                      event.dataTransfer.setData('source-section-id', section.id)
                                      event.dataTransfer.setData('source-field-id', field.id)
                                    }}
                                    onDragOver={event => event.preventDefault()}
                                    onDrop={event => handleFieldDrop(event, section.id, field.id)}
                                    onClick={() => setSelectedField({ sectionId: section.id, fieldId: field.id })}
                                    style={{
                                      gridColumn: `span ${Math.max(1, Math.min(field.span || 1, section.columns))}`,
                                      border: selectedField?.fieldId === field.id ? '1px solid #1677ff' : '1px solid #d9d9d9',
                                      boxShadow: selectedField?.fieldId === field.id ? '0 0 0 2px rgba(22, 119, 255, 0.12)' : undefined,
                                      borderRadius: 8,
                                      padding: 9,
                                      background: '#fff',
                                      cursor: 'grab'
                                    }}
                                  >
                                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                                        <Text strong>{field.label}</Text>
                                        <Badge count={field.type || 'text'} style={{ backgroundColor: '#64748b' }} />
                                      </Space>
                                      <Text type="secondary" ellipsis>{field.path || field.value || 'Không có path'}</Text>
                                      <Text type="secondary">span {field.span || 1}</Text>
                                    </Space>
                                  </div>
                                ))}
                                {!section.fields.length && (
                                  <div style={{ gridColumn: `span ${section.columns}`, border: '1px dashed #aab7c4', borderRadius: 8, padding: 18, textAlign: 'center', background: '#fff' }}>
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Kéo field từ thanh bên trái vào section này" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </Space>
                      )
                    },
                    { key: 'json', label: 'JSON', children: <Input.TextArea rows={18} readOnly value={prettyJson(stripIds(layout))} style={{ fontFamily: 'Consolas, monospace', fontSize: 13 }} /> },
                    { key: 'sample', label: 'Dữ liệu mẫu', children: <Form form={form} layout="vertical"><Form.Item name="sampleDataJson"><Input.TextArea rows={18} style={{ fontFamily: 'Consolas, monospace', fontSize: 13 }} /></Form.Item></Form> },
                    { key: 'preview', label: 'Preview', children: <PrintPreview layout={layout} sampleDataJson={sampleDataJson} /> }
                  ]}
                />
              </Panel>
            </Space>
          </Col>

          <Col xs={24} xl={6}>
            <div style={{ position: 'sticky', top: 76 }}>
              <Panel title="Thuộc tính field">
                {selectedFieldValue ? (
                  <Space direction="vertical" style={{ width: '100%' }} size={10}>
                    <Tag color="blue">{selectedFieldValue.type || 'text'}</Tag>
                    <Input addonBefore="Label" value={selectedFieldValue.label} onChange={event => updateField({ label: event.target.value })} />
                    <Input addonBefore="Path" value={selectedFieldValue.path} onChange={event => updateField({ path: event.target.value })} />
                    <Input addonBefore="Tĩnh" value={selectedFieldValue.value} onChange={event => updateField({ value: event.target.value })} />
                    <Input addonBefore="Đơn vị" value={selectedFieldValue.unit} onChange={event => updateField({ unit: event.target.value })} />
                    <InputNumber addonBefore="Span" min={1} max={4} value={selectedFieldValue.span || 1} onChange={value => updateField({ span: Number(value || 1) })} style={{ width: '100%' }} />
                    <Select value={selectedFieldValue.type || 'text'} onChange={value => updateField({ type: value })} options={FIELD_TYPES} />

                    {['image', 'logo', 'imageList'].includes(selectedFieldValue.type || '') && (
                      <>
                        <Divider orientation="left" plain>Hình ảnh</Divider>
                        <Input addonBefore="Alt" value={selectedFieldValue.alt} onChange={event => updateField({ alt: event.target.value })} />
                        <Space style={{ width: '100%' }}>
                          <InputNumber addonBefore="Rộng" min={20} max={1000} value={selectedFieldValue.width || 120} onChange={value => updateField({ width: Number(value || 120) })} style={{ width: '50%' }} />
                          <InputNumber addonBefore="Cao" min={20} max={1000} value={selectedFieldValue.height || 90} onChange={value => updateField({ height: Number(value || 90) })} style={{ width: '50%' }} />
                        </Space>
                        <Select
                          value={selectedFieldValue.fit || 'contain'}
                          onChange={value => updateField({ fit: value })}
                          options={[
                            { value: 'contain', label: 'Vừa khung' },
                            { value: 'cover', label: 'Phủ khung' },
                            { value: 'fill', label: 'Kéo giãn' }
                          ]}
                        />
                        <Select
                          value={selectedFieldValue.align || 'left'}
                          onChange={value => updateField({ align: value })}
                          options={[
                            { value: 'left', label: 'Trái' },
                            { value: 'center', label: 'Giữa' },
                            { value: 'right', label: 'Phải' }
                          ]}
                        />
                      </>
                    )}

                    {['select', 'radio'].includes(selectedFieldValue.type || '') && (
                      <>
                        <Divider orientation="left" plain>Lựa chọn</Divider>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {(selectedFieldValue.options || []).map((option, index) => (
                            <Space key={`${option.value}-${index}`} align="start" style={{ width: '100%' }}>
                              <Input placeholder="Label" value={option.label} onChange={event => updateFieldOption(index, { label: event.target.value })} />
                              <Input placeholder="Value" value={option.value} onChange={event => updateFieldOption(index, { value: event.target.value })} />
                              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeFieldOption(index)} />
                            </Space>
                          ))}
                          <Button size="small" block onClick={addFieldOption}>Thêm lựa chọn</Button>
                        </Space>
                      </>
                    )}

                    {selectedFieldValue.type === 'table' && (
                      <>
                        <Divider orientation="left" plain>Cột bảng</Divider>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {(selectedFieldValue.columns || []).map((column, index) => (
                            <Space key={`${column.path}-${index}`} align="start" style={{ width: '100%' }}>
                              <Input placeholder="Label" value={column.label} onChange={event => updateTableColumn(index, { label: event.target.value })} />
                              <Input placeholder="Path" value={column.path} onChange={event => updateTableColumn(index, { path: event.target.value })} />
                              <Select value={column.type || 'text'} style={{ width: 105 }} onChange={value => updateTableColumn(index, { type: value })} options={SIMPLE_COLUMN_TYPES} />
                              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeTableColumn(index)} />
                            </Space>
                          ))}
                          <Button size="small" block onClick={addTableColumn}>Thêm cột</Button>
                        </Space>
                      </>
                    )}

                    {selectedFieldValue.type === 'repeater' && (
                      <>
                        <Divider orientation="left" plain>Field trong nhóm lặp</Divider>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {(selectedFieldValue.items || []).map((item, index) => (
                            <Space key={item.id} align="start" style={{ width: '100%' }}>
                              <Input placeholder="Label" value={item.label} onChange={event => updateRepeaterItem(index, { label: event.target.value })} />
                              <Input placeholder="Path" value={item.path} onChange={event => updateRepeaterItem(index, { path: event.target.value })} />
                              <Select value={item.type || 'text'} style={{ width: 105 }} onChange={value => updateRepeaterItem(index, { type: value })} options={FIELD_TYPES.filter(item => !['table', 'repeater'].includes(item.value))} />
                              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeRepeaterItem(index)} />
                            </Space>
                          ))}
                          <Button size="small" block onClick={addRepeaterItem}>Thêm field</Button>
                        </Space>
                      </>
                    )}

                    <Divider />
                    <Button danger icon={<DeleteOutlined />} onClick={removeField}>Xoá field</Button>
                  </Space>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn một field trong canvas để chỉnh thuộc tính" />
                )}
              </Panel>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  )
}
