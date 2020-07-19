import { memoize } from "lodash"
import { v4 as uuid } from "uuid"

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
  const module = await getModule()

  const tmp = `/tmp/${uuid()}`
  const imagePath = `${tmp}/raw`
  const thumbPath = `${tmp}/thumb`
  module.FS.mkdir(tmp)
  module.FS.writeFile(imagePath, new Uint8Array(await image.arrayBuffer()))
  module.FS.writeFile(thumbPath, "")

  try {
    const errorCode: number = module.ccall(
      "extract_thumbnail",
      "number",
      ["string", "string"],
      [imagePath, thumbPath],
    )

    if (errorCode) {
      throw Error("Failed to extract thumbnail")
    }

    return new Blob([module.FS.readFile(thumbPath)], { type: "image/jpeg" })
  } finally {
    module.FS.unlink(imagePath)
    module.FS.unlink(thumbPath)
    module.FS.rmdir(tmp)
  }
}
