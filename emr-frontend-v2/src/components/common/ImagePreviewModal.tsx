import React from 'react'
import { Button, Empty, Modal } from 'antd'

export type PreviewImageItem = {
  url: string
  name?: string
}

type Props = {
  open: boolean
  images: PreviewImageItem[]
  index: number
  onClose: () => void
  onChangeIndex: (next: number) => void
  title?: string
  width?: number
}

export default function ImagePreviewModal({
  open,
  images,
  index,
  onClose,
  onChangeIndex,
  title,
  width = 900
}: Props) {
  const hasImages = images.length > 0
  const safeIndex = Math.min(Math.max(index, 0), Math.max(images.length - 1, 0))
  const current = hasImages ? images[safeIndex] : null

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={width}
      title={title || current?.name || 'Preview ảnh'}
      destroyOnHidden
    >
      {hasImages ? (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <img
              src={current?.url}
              alt={current?.name || 'Preview'}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              disabled={safeIndex <= 0}
              onClick={() => onChangeIndex(Math.max(0, safeIndex - 1))}
            >
              Ảnh trước
            </Button>
            <span>{safeIndex + 1}/{images.length}</span>
            <Button
              disabled={safeIndex >= images.length - 1}
              onClick={() => onChangeIndex(Math.min(images.length - 1, safeIndex + 1))}
            >
              Ảnh sau
            </Button>
          </div>
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có ảnh" />
      )}
    </Modal>
  )
}
