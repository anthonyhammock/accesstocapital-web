import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ClientPortalDetail() {
  const { user, ready } = useAuthGuard()
  const router = useRouter()
  const { clientId } = router.query

  const [client, setClient] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [linkBusy, setLinkBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [openComments, setOpenComments] = useState(null)
  const [comments, setComments] = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (ready && clientId) {
      loadClient()
    }
  }, [ready, clientId])

  const loadClient = async () => {
    setLoadingData(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients/${clientId}`, {
        headers: authHeaders(),
      })
      if (!res.ok) {
        router.push('/tools/client-portal')
        return
      }
      const data = await res.json()
      setClient(data)
    } catch (err) {
      console.error('Failed to load client:', err)
    } finally {
      setLoadingData(false)
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients/${clientId}/documents`,
        { method: 'POST', headers: authHeaders(), body: formData }
      )
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.detail || 'Upload failed.')
        return
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadClient()
    } catch (err) {
      setUploadError('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId) => {
    if (!confirm('Delete this document? This cannot be undone.')) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/documents/${documentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      await loadClient()
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  }

  const downloadUrl = (documentId) =>
    `${process.env.NEXT_PUBLIC_API_URL}/api/portal/documents/${documentId}/download`

  const handleDownload = async (documentId, filename) => {
    setDownloadError('')
    try {
      const res = await fetch(downloadUrl(documentId), { headers: authHeaders() })
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

  const portalUrl = client ? `${window.location.origin}/portal/${client.portal_token}` : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleRevoke = async () => {
    setLinkBusy(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients/${clientId}/revoke`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await loadClient()
    } finally {
      setLinkBusy(false)
    }
  }

  const handleReactivate = async () => {
    setLinkBusy(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients/${clientId}/reactivate`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await loadClient()
    } finally {
      setLinkBusy(false)
    }
  }

  const handleRegenerate = async () => {
    if (!confirm('This invalidates the current link — anyone using the old link will lose access. Continue?')) return
    setLinkBusy(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients/${clientId}/regenerate-link`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await loadClient()
    } finally {
      setLinkBusy(false)
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/documents/${documentId}/comments`,
        { headers: authHeaders() }
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/documents/${documentId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
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

  if (!ready || loadingData || !client) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader
        user={user}
        breadcrumbs={[{ label: 'Client Portal', href: '/tools/client-portal' }, { label: client.name }]}
      />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-garamond text-4xl font-medium text-gold mb-2">{client.name}</h1>
            {client.email && <p className="font-inter text-gray-600">{client.email}</p>}
            {client.notes && <p className="font-inter text-sm text-gray-500 mt-1">{client.notes}</p>}
          </div>
          <span
            className={`font-inter text-xs uppercase tracking-wide px-3 py-1 ${
              client.is_active ? 'bg-gold bg-opacity-10 text-gold' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {client.is_active ? 'Link Active' : 'Link Revoked'}
          </span>
        </div>

        <div className="bg-white border border-lightgray p-8 mb-10">
          <h2 className="font-garamond text-xl text-navy mb-4">Portal Link</h2>
          <p className="font-inter text-sm text-gray-600 mb-4">
            Send this link to {client.name} — they can view and download shared documents, upload
            their own, and leave comments without creating an account.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              readOnly
              value={portalUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-[240px] px-4 py-3 border border-lightgray bg-offwhite font-inter text-sm text-navy"
            />
            <button onClick={handleCopy} className="btn-secondary text-sm">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {client.is_active ? (
              <button onClick={handleRevoke} disabled={linkBusy} className="btn-secondary text-sm disabled:opacity-50">
                Revoke
              </button>
            ) : (
              <button onClick={handleReactivate} disabled={linkBusy} className="btn-secondary text-sm disabled:opacity-50">
                Reactivate
              </button>
            )}
            <button onClick={handleRegenerate} disabled={linkBusy} className="btn-secondary text-sm disabled:opacity-50">
              Regenerate Link
            </button>
          </div>
        </div>

        <div className="bg-white border border-lightgray p-8 mb-10">
          <h2 className="font-garamond text-xl text-navy mb-4">Upload a Document</h2>
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
        {client.documents.length === 0 ? (
          <p className="font-inter text-gray-600">No documents yet.</p>
        ) : (
          <div className="space-y-4">
            {client.documents.map((doc) => (
              <div key={doc.id} className="bg-white border border-lightgray p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-inter font-medium text-navy">{doc.filename}</p>
                    <p className="font-inter text-xs text-gray-500 mt-1">
                      {fmtSize(doc.file_size)} · Uploaded by{' '}
                      <span className={doc.uploaded_by === 'client' ? 'text-gold font-medium' : ''}>
                        {doc.uploaded_by === 'client' ? client.name : 'You'}
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
                    <button onClick={() => handleDelete(doc.id)} className="font-inter text-sm text-error hover:underline">
                      Delete
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
                              {c.author === 'client' ? client.name : 'You'} ·{' '}
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
      </main>
    </div>
  )
}
