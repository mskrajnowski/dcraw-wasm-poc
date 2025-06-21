import { memoize } from "lodash"

import emCreateModule from "./wasm/raw.js"
import wasmBinaryUrl from "./wasm/raw.wasm.bin"

const fetchWasmBinary = memoize(async () => {
  const response = await fetch(wasmBinaryUrl)

  if (response.ok) {
    return await response.arrayBuffer()
  } else {
    throw new Error(
      `Failed to fetch ${wasmBinaryUrl}: ${response.status} ${response.statusText}`,
    )
  }
})

const getModule = memoize(async () => {
  const wasmBinary = await fetchWasmBinary()
  return await emCreateModule({
    wasmBinary,
    print: str => console.log(str),
    printErr: str => console.warn(str),
  })
})

export async function extractThumbnail(image: File | Blob): Promise<Blob> {
  const imageData = new Uint8Array(await image.arrayBuffer())
  const module = await getModule()

  // write image data to module memory
  const imageBuffer = module._malloc(image.size)
  module.HEAPU8.set(imageData, imageBuffer)

  // prepare output pointers
  const thumbnailBufferPointer = module._malloc(4)
  const thumbnailSizePointer = module._malloc(4)
  module.setValue(thumbnailBufferPointer, 0, "*")
  module.setValue(thumbnailBufferPointer, 0, "*")

  try {
    const errorCode: number = module.ccall(
      // int extract_thumbnail(
      //   const char *raw_data,
      //   size_t raw_size,
      //   char **thumb_data,
      //   size_t *thumb_size
      // )
      "extract_thumbnail",
      "number",
      ["number", "number", "number", "number"],
      [imageBuffer, image.size, thumbnailBufferPointer, thumbnailSizePointer],
    )

    if (errorCode) {
      throw Error("Failed to extract thumbnail")
    }

    // read outputs
    const thumbnailBuffer = module.getValue(thumbnailBufferPointer, "*")
    const thumbnailSize = module.getValue(thumbnailSizePointer, "i32")

    // read the thumbnail
    const thumbnail = new Blob(
      [
        module.HEAPU8.subarray(
          thumbnailBuffer,
          thumbnailBuffer + thumbnailSize,
        ),
      ],
      { type: "image/jpeg" },
    )

    return thumbnail
  } finally {
    const thumbnailBuffer = module.getValue(thumbnailBufferPointer, "*")
    if (thumbnailBuffer) {
      module._free(thumbnailBuffer)
    }

    module._free(thumbnailSizePointer)
    module._free(thumbnailBufferPointer)
    module._free(imageBuffer)
  }
}

export async function extractThumbnailResized(
  image: File | Blob,
  options: { maxWidth: number; maxHeight: number; quality?: number },
): Promise<Blob> {
  const imageData = new Uint8Array(await image.arrayBuffer())
  const module = await getModule()

  // write image data to module memory
  const imageBuffer = module._malloc(image.size)
  module.HEAPU8.set(imageData, imageBuffer)

  // prepare output pointers
  const thumbnailBufferPointer = module._malloc(4)
  const thumbnailSizePointer = module._malloc(4)
  module.setValue(thumbnailBufferPointer, 0, "*")
  module.setValue(thumbnailBufferPointer, 0, "*")

  try {
    const errorCode: number = module.ccall(
      // int extract_thumbnail_resized(
      //   const unsigned char *raw_data,
      //   size_t raw_size,
      //   unsigned char **resized_data,
      //   size_t *resized_size,
      //   size_t max_width,
      //   size_t max_height,
      //   int quality
      // )
      "extract_thumbnail_resized",
      "number",
      ["number", "number", "number", "number", "number", "number", "number"],
      [
        imageBuffer,
        image.size,
        thumbnailBufferPointer,
        thumbnailSizePointer,
        options.maxWidth,
        options.maxHeight,
        options.quality || 90,
      ],
    )

    if (errorCode) {
      throw Error("Failed to extract thumbnail")
    }

    // read outputs
    const thumbnailBuffer = module.getValue(thumbnailBufferPointer, "*")
    const thumbnailSize = module.getValue(thumbnailSizePointer, "i32")

    // read the thumbnail
    const thumbnail = new Blob(
      [
        module.HEAPU8.subarray(
          thumbnailBuffer,
          thumbnailBuffer + thumbnailSize,
        ),
      ],
      { type: "image/jpeg" },
    )

    return thumbnail
  } finally {
    const thumbnailBuffer = module.getValue(thumbnailBufferPointer, "*")
    if (thumbnailBuffer) {
      module._free(thumbnailBuffer)
    }

    module._free(thumbnailSizePointer)
    module._free(thumbnailBufferPointer)
    module._free(imageBuffer)
  }
}
