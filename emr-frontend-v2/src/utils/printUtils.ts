/**
 * Shared A4 iframe-based print utilities.
 * Used by all phiếu / document print features.
 */

export function toAbsoluteImageUrls(root: HTMLElement) {
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src')
    if (!src) return
    try {
      img.setAttribute('src', new URL(src, window.location.href).toString())
    } catch {
      // Keep original src if URL normalization fails.
    }
  })
}

export function waitForImage(img: HTMLImageElement) {
  return new Promise<void>((resolve) => {
    if (img.complete) {
      resolve()
      return
    }
    const done = () => resolve()
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
  })
}

function waitForStylesheets(doc: Document) {
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[]
  if (links.length === 0) return Promise.resolve()

  return Promise.all(
    links.map(
      (link) =>
        new Promise<void>((resolve) => {
          // If stylesheet is already attached, no need to wait for events.
          if (link.sheet) {
            resolve()
            return
          }

          const done = () => resolve()
          link.addEventListener('load', done, { once: true })
          link.addEventListener('error', done, { once: true })
          // Avoid blocking print forever when a stylesheet is slow/unreachable.
          setTimeout(done, 1200)
        })
    )
  ).then(() => undefined)
}

async function waitForRenderReady(doc: Document) {
  await waitForStylesheets(doc)
  if ('fonts' in doc) {
    try {
      await (doc as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready
    } catch {
      // Continue printing even if fonts API fails.
    }
  }

  // Give layout one more frame after styles/fonts settle.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

export async function printWithIframe(el: HTMLElement) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-9999px'
  iframe.style.left = '-9999px'
  iframe.style.width = '210mm'
  iframe.style.height = '297mm'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((s) => s.outerHTML)
    .join('\n')

  const clone = el.cloneNode(true) as HTMLDivElement
  toAbsoluteImageUrls(clone)

  doc.open()
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><base href="${window.location.origin}/">${styles}</head><body>${clone.innerHTML}</body></html>`
  )
  doc.close()

  await waitForRenderReady(doc)

  const iframeImages = Array.from(doc.images || [])
  await Promise.race([
    Promise.all(iframeImages.map((img) => waitForImage(img))),
    new Promise((resolve) => setTimeout(resolve, 1800)),
  ])

  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()

  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe)
    }
  }, 1500)
}
