export async function loadImage(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = event => reject(event)
    image.src = URL.createObjectURL(file)
  })
}

export async function resizeImage(
  file: Blob,
  { maxWidth, maxHeight }: { maxWidth: number; maxHeight: number },
): Promise<Blob> {
  const image = await loadImage(file)

  try {
    const ratio = image.naturalWidth / image.naturalHeight

    const width = ratio > 1 ? maxWidth : maxHeight * ratio
    const height = ratio < 1 ? maxHeight : maxWidth / ratio

    const canvas = document.createElement("canvas")
    canvas.width = Math.floor(width)
    canvas.height = Math.floor(height)
    const context = canvas.getContext("2d")!
    context.drawImage(image, 0, 0, width, height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        return blob ? resolve(blob) : reject()
      }, "image/jpeg")
    })
  } finally {
    URL.revokeObjectURL(image.src)
  }
}
