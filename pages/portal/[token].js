import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AvatarLogo } from '../../src/components/LogoComponent'

const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PublicClientPortal() {
  const router = useRouter()
  const { token } = router.query

  const [portal, setPortal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [openComments, setOpenComments] = useState(null)
  const [comments, setComments] = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (token) {
      loadPortal()
    }
  }, [token])

  const loadPortal = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/public/${token}`)
      if (!res.ok) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      setPortal(data)
    } catch (err) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/public/${token}/documents`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.detail || 'Upload failed.')
        return
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadPortal()
    } catch (err) {
      setUploadError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (documentId, filename) => {
    setDownloadError('')
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/public/${token}/documents/${documentId}/download`
      )
      if (!res.ok) {
        setDownloadError('Could not download this document. Please try again.')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError('Could not download this document. Please try again.')
    }
  }

  const toggleComments = async (documentId) => {
    if (openComments === documentId) {
      setOpenComments(null)
      return
    }
    setOpenComments(documentId)
    setLoadingComments(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/public/${token}/documents/${documentId}/comments`
      )
      const data = await res.json()
      setComments(data.comments || [])
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddComment = async (documentId) => {
    if (!commentBody.trim()) return
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/public/${token}/documents/${documentId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: commentBody }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        setComments((prev) => [...prev, data])
        setCommentBody('')
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
          <AvatarLogo size="sm" />
          <span className="font-garamond font-medium text-navy text-lg">BlissPoint Access</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        {loading ? (
          <p className="font-inter text-gray-600">Loading...</p>
        ) : notFound ? (
          <div className="bg-white border border-lightgray p-10 text-center">
            <h1 className="font-garamond text-2xl text-navy mb-3">Link Not Found</h1>
            <p className="font-inter text-gray-600">
              This portal link is invalid or has been revoked. Please contact whoever shared it
              with you for a new link.
            </p>
          </div>
        ) : (
          <>
            <p className="font-inter text-xs tracking-[0.2em] uppercase text-gold mb-2">Shared Documents</p>
            <h1 className="font-garamond text-4xl font-medium text-navy mb-10">
              Welcome, {portal.client_name}
            </h1>

            <div className="bg-white border border-lightgray p-8 mb-10">
              <h2 className="font-garamond text-xl text-navy mb-4">Send a Document</h2>
              <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-4">
                <input ref={fileInputRef} type="file" required className="font-inter text-sm" />
                <button type="submit" disabled={uploading} className="btn-primary text-sm disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </form>
              {uploadError && <p className="font-inter text-sm text-error mt-3">{uploadError}</p>}
              <p className="font-inter text-xs text-gray-500 mt-3">Max file size: 15MB.</p>
            </div>

            <h2 className="font-garamond text-xl text-navy mb-4">Documents</h2>
            {downloadError && <p className="font-inter text-sm text-error mb-4">{downloadError}</p>}
            {portal.documents.length === 0 ? (
              <p className="font-inter text-gray-600">No documents have been shared with you yet.</p>
            ) : (
              <div className="space-y-4">
                {portal.documents.map((doc) => (
                  <div key={doc.id} className="bg-white border border-lightgray p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-inter font-medium text-navy">{doc.filename}</p>
                        <p className="font-inter text-xs text-gray-500 mt-1">
                          {fmtSize(doc.file_size)} · Uploaded by{' '}
                          <span className={doc.uploaded_by === 'owner' ? 'text-gold font-medium' : ''}>
                            {doc.uploaded_by === 'owner' ? 'BlissPoint Access' : 'You'}
                          </span>{' '}
                          · {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleComments(doc.id)} className="font-inter text-sm text-gold hover:underline">
                          {openComments === doc.id ? 'Hide Comments' : 'Comments'}
                        </button>
                        <button onClick={() => handleDownload(doc.id, doc.filename)} className="btn-secondary text-sm">
                          Download
                        </button>
                      </div>
                    </div>

                    {openComments === doc.id && (
                      <div className="mt-6 pt-6 border-t border-lightgray">
                        {loadingComments ? (
                          <p className="font-inter text-sm text-gray-600">Loading comments...</p>
                        ) : comments.length === 0 ? (
                          <p className="font-inter text-sm text-gray-500 mb-4">No comments yet.</p>
                        ) : (
                          <div className="space-y-3 mb-4">
                            {comments.map((c) => (
                              <div key={c.id} className="border-l-4 border-gold pl-4 py-1">
                                <p className="font-inter text-xs text-gray-500 mb-1">
                                  {c.author === 'owner' ? 'BlissPoint Access' : 'You'} ·{' '}
                                  {new Date(c.created_at).toLocaleString()}
                                </p>
                                <p className="font-inter text-sm text-navy">{c.body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={commentBody}
                            onChange={(e) => setCommentBody(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-4 py-2 border border-lightgray focus:outline-none focus:border-gold font-inter text-sm"
                          />
                          <button onClick={() => handleAddComment(doc.id)} className="btn-primary text-sm">
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-navy text-offwhite py-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="font-inter text-xs text-gray-400">© 2026 BlissPoint Access. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
