import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { memberEndpoints } from '../../data/member'

const MemberCertificate = () => {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const { user } = useSelector(state => state.auth.member || {})

  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfError, setPdfError] = useState(false)

  const isApproved = profile?.status === 'approved' || profile?.certificate?.generated

  useEffect(() => {

    const fetchProfile = async () => {
      try {
        const response = await memberEndpoints.profile.getProfile()
        if (response && response.success) {
          setProfile(response.data.member)
        } else {
          setError('Failed to load certificate data')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('An error occurred while loading your certificate')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (isApproved) {
      const loadPdf = async () => {
        try {
          const blob = await memberEndpoints.profileUpdates.getCertificateBlob(true)
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
          setPdfUrl(url)
        } catch (err) {
          console.error("Failed to load PDF preview", err)
          setPdfError(true)
        }
      }
      loadPdf()
    }
  }, [isApproved])

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const blob = await memberEndpoints.profileUpdates.getCertificateBlob(false)
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Membership_Certificate_${profile?.member?.fullName?.replace(/\s+/g, '_') || 'Member'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download certificate. Please try again later.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fadeUp">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Membership Certificate</h1>
        <p className="text-slate-500 text-sm font-medium">Official recognition of your active standing in the association.</p>
      </div>

      {!isApproved ? (
        <div className="bg-white border border-slate-200 rounded-[32px] p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">⏳</div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Verification in Progress</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Your membership certificate will be available for download once your application is approved and payment is confirmed.
          </p>
          <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center gap-8">
             <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                <p className="text-xs font-bold text-amber-600 uppercase bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 italic">
                  {profile?.status || 'Processing'}
                </p>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Preview Card */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-[40px] p-1 shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-50 pointer-events-none"></div>
              
              {/* Live PDF Preview via Blob URL */}
              <div className="bg-white m-4 rounded-[32px] overflow-hidden min-h-[500px] border border-slate-200 relative flex flex-col">
                 {pdfUrl ? (
                   <iframe 
                     src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                     className="w-full h-[600px] border-0 flex-1"
                     title="Membership Certificate Preview"
                   />
                 ) : pdfError ? (
                   <div className="w-full h-[600px] flex items-center justify-center text-red-400 font-bold bg-slate-50">
                     Failed to load PDF preview.
                   </div>
                 ) : (
                   <div className="w-full h-[600px] flex items-center justify-center bg-slate-50">
                     <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                   </div>
                 )}
                 
                 {/* Fallback overlay */}
                 <div className="absolute inset-0 pointer-events-none border-8 border-white rounded-[32px]"></div>
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="space-y-6">
             <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Actions</h3>
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`w-full bg-blue-600 text-white rounded-2xl py-4 font-bold text-sm tracking-wide shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 ${
                    isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  {isDownloading ? (
                    <div className="flex bg-blue-600 items-center gap-2">
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       Downloading...
                    </div>
                  ) : (
                    <>
                      <span className="text-lg">📥</span>
                      Download PDF
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 mt-4 text-center leading-relaxed">
                  The official PDF includes digital signatures and watermarks for verification.
                </p>
             </div>

             <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Certificate Details</h3>
                <div className="space-y-4">
                   <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Issued On</span>
                      <span className="text-xs font-bold text-slate-700">
                        {profile?.certificate?.issueDate ? new Date(profile.certificate.issueDate).toLocaleDateString() : 'N/A'}
                      </span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Term</span>
                      <span className="text-xs font-bold text-slate-700">12 Months</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Active
                      </span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberCertificate
