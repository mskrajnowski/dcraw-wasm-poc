import React, {
  ChangeEvent,
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from "react"
import { hot } from "react-hot-loader"

import { extractThumbnail } from "./raw/raw"

const App: FunctionComponent = () => {
  const [thumbnail, setThumbnail] = useState<Blob | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = thumbnail ? URL.createObjectURL(thumbnail) : null
    setThumbnailUrl(url)

    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [thumbnail])

  const handleFileChanged = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.item(0)
      if (!file) return
      setThumbnail(await extractThumbnail(file))
    },
    [],
  )

  return (
    <div>
      <h1>dcraw-wasm-test</h1>
      <p>
        <input type="file" onChange={handleFileChanged} />
      </p>
      <p>
        {thumbnailUrl && (
          <img alt="" src={thumbnailUrl} style={{ maxWidth: "400px" }} />
        )}
      </p>
    </div>
  )
}

export default hot(module)(App)
