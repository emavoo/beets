import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type UploadResult } from '../api/client'
import { ChevronLeftIcon, MusicIcon, XIcon } from '../components/ui/Icons'
import { formatSize } from '../utils/format'

const AUDIO_TYPES = new Set([
  'audio/mpeg', 'audio/flac', 'audio/ogg', 'audio/mp4', 'audio/aac',
  'audio/wav', 'audio/aiff', 'audio/x-aiff', 'audio/opus', 'audio/x-m4a',
])
const AUDIO_EXTS = /\.(mp3|flac|ogg|m4a|aac|wma|wav|aiff|aif|opus|ape|wv|mpc)$/i

function isAudioFile(f: File) {
  return AUDIO_TYPES.has(f.type) || AUDIO_EXTS.test(f.name)
}

function isImageFile(f: File) {
  return f.type.startsWith('image/')
}

type Phase = 'select' | 'uploading' | 'done' | 'error'

export function Upload() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<File[]>([])
  const [cover, setCover] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('select')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const audio: File[] = []
    let img: File | null = null
    for (const f of Array.from(incoming)) {
      if (isAudioFile(f)) audio.push(f)
      else if (isImageFile(f) && !cover) img = f
    }
    if (audio.length) {
      setFiles((prev) => {
        const names = new Set(prev.map((f) => f.name))
        return [...prev, ...audio.filter((f) => !names.has(f.name))]
      })
    }
    if (img) {
      setCover(img)
      setCoverPreview(URL.createObjectURL(img))
    }
  }, [cover])

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCover(null)
    setCoverPreview(null)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleUpload = async () => {
    if (!files.length) return
    setPhase('uploading')
    setProgress(0)
    try {
      const res = await api.uploadAlbum(files, cover ?? undefined, setProgress)
      setResult(res)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
      setPhase('error')
    }
  }

  const reset = () => {
    setFiles([])
    removeCover()
    setPhase('select')
    setProgress(0)
    setResult(null)
    setErrorMsg('')
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0)

  return (
    <div className="pb-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Upload Album</h1>
      </div>

      {phase === 'select' && (
        <div className="px-4 space-y-4 animate-fade-in">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-text-tertiary'
            }`}
          >
            <MusicIcon size={40} className="mx-auto mb-3 text-text-tertiary" />
            <p className="text-sm text-text-secondary">
              Drag & drop audio files here, or <span className="text-accent">browse</span>
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              MP3, FLAC, OGG, M4A, WAV, AIFF, OPUS, and more
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
          />

          {/* Cover art */}
          <div className="flex items-center gap-3">
            {coverPreview ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); removeCover() }}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                >
                  <XIcon size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center text-text-tertiary hover:border-text-tertiary hover:text-text-secondary transition-colors shrink-0"
              >
                <span className="text-xs text-center leading-tight">Add<br/>cover</span>
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && isImageFile(f)) {
                  setCover(f)
                  setCoverPreview(URL.createObjectURL(f))
                }
                e.target.value = ''
              }}
            />
            <p className="text-xs text-text-tertiary">
              Optional cover art (JPG, PNG)
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-sm text-text-secondary">
                  {files.length} file{files.length !== 1 ? 's' : ''} &middot; {formatSize(totalSize)}
                </span>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-text-tertiary hover:text-error transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-0.5 rounded-lg bg-surface-raised p-2">
                {files.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-hover group"
                  >
                    <MusicIcon size={14} className="text-text-tertiary shrink-0" />
                    <span className="text-sm text-text-primary truncate flex-1">{f.name}</span>
                    <span className="text-xs text-text-tertiary tabular-nums">{formatSize(f.size)}</span>
                    <button
                      onClick={() => removeFile(f.name)}
                      className="p-0.5 text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!files.length}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Upload {files.length ? `${files.length} file${files.length !== 1 ? 's' : ''}` : ''}
          </button>
        </div>
      )}

      {phase === 'uploading' && (
        <div className="px-4 py-12 text-center animate-fade-in">
          <div className="w-48 h-2 bg-surface-overlay rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-text-secondary mt-4">
            Uploading... {progress}%
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {files.length} file{files.length !== 1 ? 's' : ''} &middot; {formatSize(totalSize)}
          </p>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="px-4 py-8 text-center animate-fade-in space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">Upload complete</p>
            {result.album && (
              <p className="text-sm text-text-secondary mt-1">
                {result.album.album} &mdash; {result.album.albumartist}
              </p>
            )}
            {result.items && !result.album && (
              <p className="text-sm text-text-secondary mt-1">
                {result.items.length} track{result.items.length !== 1 ? 's' : ''} added
              </p>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="bg-error/10 border border-error/30 rounded-lg p-3 text-left">
              <p className="text-sm font-medium text-error mb-1">Some files had issues:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-error/80">{e.file}: {e.error}</p>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            {result.album && (
              <button
                onClick={() => navigate(`/album/${result.album!.id}`)}
                className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors"
              >
                View Album
              </button>
            )}
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-surface-overlay hover:bg-surface-hover text-text-primary text-sm font-medium rounded-xl transition-colors"
            >
              Upload More
            </button>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="px-4 py-12 text-center animate-fade-in space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-error/20 flex items-center justify-center">
            <XIcon size={28} className="text-error" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">Upload failed</p>
            <p className="text-sm text-text-secondary mt-1">{errorMsg}</p>
          </div>
          <button
            onClick={() => setPhase('select')}
            className="px-5 py-2.5 bg-surface-overlay hover:bg-surface-hover text-text-primary text-sm font-medium rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
