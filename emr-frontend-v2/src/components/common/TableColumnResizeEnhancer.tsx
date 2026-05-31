import React from 'react'
import './TableColumnResizeEnhancer.css'

const MIN_COLUMN_WIDTH = 56
const RESIZE_HANDLE_CLASS = 'emr-table-resize-handle'
const BOUND_ATTR = 'data-emr-resizable-column'

function getColumnIndex(cell: HTMLTableCellElement): number {
  const siblings = Array.from(cell.parentElement?.children || []) as HTMLTableCellElement[]
  let index = 0

  for (const sibling of siblings) {
    if (sibling === cell) return index
    index += Number(sibling.colSpan || 1)
  }

  return cell.cellIndex
}

function setColumnWidth(container: HTMLElement, columnIndex: number, width: number) {
  const normalizedWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(width))
  const tables = Array.from(container.querySelectorAll('table')) as HTMLTableElement[]

  tables.forEach((table) => {
    table.style.tableLayout = 'fixed'

    const colgroups = Array.from(table.querySelectorAll('colgroup'))
    colgroups.forEach((colgroup) => {
      const col = colgroup.children.item(columnIndex) as HTMLTableColElement | null
      if (!col) return
      col.style.width = `${normalizedWidth}px`
      col.style.minWidth = `${normalizedWidth}px`
    })
  })

  const headerRows = Array.from(container.querySelectorAll('.ant-table-thead > tr'))
  headerRows.forEach((row) => {
    let currentIndex = 0
    Array.from(row.children).forEach((child) => {
      const cell = child as HTMLTableCellElement
      const span = Number(cell.colSpan || 1)
      if (span === 1 && currentIndex === columnIndex) {
        cell.style.width = `${normalizedWidth}px`
        cell.style.minWidth = `${normalizedWidth}px`
      }
      currentIndex += span
    })
  })
}

function attachResizeHandles(root: ParentNode = document) {
  const headerCells = Array.from(root.querySelectorAll('.ant-table-thead > tr > th')) as HTMLTableCellElement[]

  headerCells.forEach((cell) => {
    if (cell.getAttribute(BOUND_ATTR) === 'true') return
    if (Number(cell.colSpan || 1) > 1) return

    cell.setAttribute(BOUND_ATTR, 'true')
    cell.classList.add('emr-table-resizable-header')

    const handle = document.createElement('span')
    handle.className = RESIZE_HANDLE_CLASS
    handle.setAttribute('aria-hidden', 'true')
    handle.title = 'Kéo để đổi độ rộng cột'
    handle.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
    })

    handle.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()

      const container = cell.closest('.ant-table-container') as HTMLElement | null
      if (!container) return

      const columnIndex = getColumnIndex(cell)
      const startX = event.clientX
      const startWidth = cell.getBoundingClientRect().width
      document.body.classList.add('emr-table-resizing')

      const onMouseMove = (moveEvent: MouseEvent) => {
        const nextWidth = startWidth + moveEvent.clientX - startX
        setColumnWidth(container, columnIndex, nextWidth)
      }

      const onMouseUp = () => {
        document.body.classList.remove('emr-table-resizing')
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    })

    cell.appendChild(handle)
  })
}

export default function TableColumnResizeEnhancer(): null {
  React.useEffect(() => {
    let frame = 0
    const scheduleAttach = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => attachResizeHandles())
    }

    scheduleAttach()

    const observer = new MutationObserver(scheduleAttach)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return null
}
