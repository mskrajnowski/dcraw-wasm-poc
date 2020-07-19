import React, {
  ChangeEvent,
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { hot } from "react-hot-loader"
import { v4 as uuid } from "uuid"

import { extractThumbnail } from "./raw/raw"

interface ImageFile {
  id: string
  file: File
  preview: Blob
  previewUrl: string
}

const App: FunctionComponent = () => {
  const [images, setImages] = useState<ImageFile[]>([])
  const previewUrls = useRef<string[]>([])

  const handleFileChanged = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target
      const files = Array.from(input.files || [])

      const images = await Promise.all(
        files.map(
          async (file): Promise<ImageFile> => {
            const preview =
              file.type === "image/jpeg" ? file : await extractThumbnail(file)
            const previewUrl = URL.createObjectURL(preview)
            previewUrls.current.push(previewUrl)
            return { id: uuid(), file, preview, previewUrl }
          },
        ),
      )

      setImages(current => [...current, ...images])
      input.value = ""
    },
    [],
  )

  useEffect(() => {
    const urls = previewUrls.current

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  return (
    <div>
      <h1>dcraw-wasm-test</h1>
      <p>
        <input
          type="file"
          accept="image/jpeg,.NEF,.ORF"
          multiple
          onChange={handleFileChanged}
        />
      </p>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {images.map(({ id, file, previewUrl }) => (
          <div key={id} style={{ padding: "10px" }}>
            <img
              alt={file.name}
              src={previewUrl}
              style={{
                width: "200px",
                height: "200px",
                objectFit: "scale-down",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default hot(module)(App)
