import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { memberEndpoints } from '../../data/member'

const UserProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await memberEndpoints.profile.getProfile()
      if (response && response.success) {
        setProfile(response.data?.member || null)

        // Non-critical fetch for payment status
        try {
          const payRes = await memberEndpoints.payments.getStatus()
          if (payRes?.success) setPaymentStatus(payRes.data)
        } catch (payErr) {
          console.error('Non-critical: Failed to fetch payment status', payErr)
        }
      } else {
        setError('Failed to load profile details')
      }
    } catch (err) {
      console.error('Error fetching member profile:', err)
      setError('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }, [location.state])

  const loadRazorpayScript = () => new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handlePayment = async () => {
    if (processingPayment) return
    try {
      setProcessingPayment(true)
      setError(null)
      const resScript = await loadRazorpayScript()
      if (!resScript) { setError('Payment gateway failed to load.'); setProcessingPayment(false); return }

      const orderRes = await memberEndpoints.payments.createOrder()
      if (!orderRes.success) { setError(orderRes.message || 'Failed to create payment order'); setProcessingPayment(false); return }

      const orderData = orderRes.data || {}
      const { orderId, amount, currency, keyId, memberDetails, notes } = orderData
      if (!orderId || !keyId) { setError('Invalid payment data from server.'); setProcessingPayment(false); return }

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'TechFinit Association',
        description: profile.membershipType === 'new' ? 'Registration Fee' : 'Membership Renewal Fee',
        order_id: orderId,
        handler: async (response) => {
          try {
            setProcessingPayment(true)
            const verifyRes = await memberEndpoints.payments.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            if (verifyRes.success) {
              setSuccessMessage(verifyRes.message || 'Payment successful!')
              await fetchProfile()
            } else setError(verifyRes.message || 'Payment verification failed')
          } catch (err) {
            console.error('Payment verification error:', err)
            setError('Error verifying payment. Please contact support.')
          } finally { setProcessingPayment(false) }
        },
        prefill: {
          name: memberDetails.name,
          email: memberDetails.email,
          contact: memberDetails.contact,
        },
        notes,
        theme: { color: '#10b981' },
        modal: { ondismiss: () => setProcessingPayment(false) }
      }

      if (!window.Razorpay) { setError('Payment gateway failed to load.'); setProcessingPayment(false); return }
      const paymentObject = new window.Razorpay(options)
      paymentObject.open()
    } catch (err) {
      console.error('Payment initialization error:', err)
      setError('Failed to initialize payment')
      setProcessingPayment(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 animate-fadeUp">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (error || !profile) return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fadeUp">
      <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center max-w-lg mx-auto">
        <p className="text-red-600 font-bold mb-4">{error || 'Profile not found'}</p>
        <button onClick={fetchProfile} className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all">Retry</button>
      </div>
    </div>
  )

  const Card = ({ title, icon, children, className = '' }) => (
    <div className={`compact-card p-6 bg-white rounded-2xl shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{icon}</div>
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">{children}</div>
    </div>
  )

  const LabelValue = ({ label, value, highlight = false }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
      <p className={`text-sm font-bold truncate ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>{value || <span className="text-slate-300 font-medium italic">Not Specified</span>}</p>
    </div>
  )

  // helper to render document entries; supports arrays or single object
  const isImageUrl = (url = '') => {
    return /\.(jpe?g|png|gif|svg)$/i.test(url)
  }

  const renderDocumentEntry = (doc) => {
    if (!doc) return <p className="text-[10px] text-slate-300 font-bold italic">Not Uploaded</p>

    const renderSingle = (d) => {
      const url = d?.url || ''
      const name = d?.publicId || url || 'Document'
      return (
        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden">
            {url && isImageUrl(url) ? (
              <img src={url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-blue-600 text-2xl">📄</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-slate-800 truncate">{name}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Uploaded on {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all">View</a>
          )}
        </div>
      )
    }

    if (Array.isArray(doc)) {
      return doc.map((d, i) => (
        <div key={i}>{renderSingle(d)}</div>
      ))
    }

    return renderSingle(doc)
  }

  const rejections = (() => {
    if (!profile?.approvals) return []
    return Object.entries(profile.approvals)
      .filter(([role, data]) => data?.approved === false && data?.approvedAt)
      .map(([role, data]) => ({ role, ...data }))
  })()

  return (
    <div className="space-y-6 animate-fadeUp pb-10">
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl font-bold animate-fadeUp flex items-center gap-3">
          <span>✅</span> {successMessage}
        </div>
      )}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-3xl bg-white/20 border border-white/30 flex items-center justify-center text-4xl font-extrabold overflow-hidden">
            {profile.documents?.memberPhoto?.url ? (
              <img src={profile.documents.memberPhoto.url} alt="Member" className="w-full h-full object-cover" />
            ) : (
              profile.member?.fullName?.charAt(0) || 'U'
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 truncate">{profile.member?.fullName}</h1>
            <p className="text-sm text-slate-500">{profile.member?.roleInAgency} • {profile.member?.officeType}</p>
            <div className="flex gap-3 mt-3">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-2"><span>📧</span>{profile.email}</p>
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-2"><span>📞</span>{profile.member?.mobile}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Case 1: Pay Now button for new members */}
          {(['approved', 'verified'].includes(profile.status)) && profile.membershipType === 'new' && profile.payment?.status !== 'completed' && (
            <button 
              onClick={handlePayment} 
              disabled={processingPayment}
              className={`px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex flex-col items-center leading-tight hover:shadow-lg hover:shadow-emerald-200 transition-all ${processingPayment ? 'opacity-70 grayscale cursor-not-allowed' : ''}`}
            >
              <span>{processingPayment ? 'Processing...' : 'Pay Registration Fee'}</span>
              {paymentStatus?.amount && (
                <span className="text-[10px] font-bold opacity-80 mt-1">₹{Number(paymentStatus.amount.totalAmount || paymentStatus.amount.total || 0).toLocaleString('en-IN')}</span>
              )}
            </button>
          )}

          {/* Case 3: Renew Now button for transfers / old members new to app */}
          {(['approved', 'verified'].includes(profile.status)) && profile.membershipType === 'renewal' && !profile.certificate?.generated && profile.payment?.status !== 'completed' && (
            <button 
              onClick={handlePayment} 
              disabled={processingPayment}
              className={`px-6 py-3 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex flex-col items-center leading-tight hover:shadow-lg hover:shadow-orange-200 transition-all ${processingPayment ? 'opacity-70 grayscale cursor-not-allowed' : ''}`}
            >
              <span>{processingPayment ? 'Processing...' : 'Complete Renewal'}</span>
              {paymentStatus?.amount && (
                <span className="text-[10px] font-bold opacity-80 mt-1">₹{Number(paymentStatus.amount.totalAmount || paymentStatus.amount.total || 0).toLocaleString('en-IN')}</span>
              )}
            </button>
          )}
          
          {/* Case 2: Renew Now for existing members with expiring certificates */}
          {profile.status === 'approved' && ['new', 'renewal'].includes(profile.membershipType) && profile.certificate?.generated && profile.certificate?.expiryDate && (
            (() => {
              const expiryDate = new Date(profile.certificate.expiryDate);
              const today = new Date();
              const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
              
              if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                return (
                  <button 
                    onClick={handlePayment} 
                    disabled={processingPayment}
                    className={`px-6 py-3 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex flex-col items-center leading-tight hover:shadow-lg hover:shadow-orange-200 transition-all ${processingPayment ? 'opacity-70 grayscale cursor-not-allowed' : ''}`}
                  >
                    <span>{processingPayment ? 'Renewing...' : 'Renew Now'}</span>
                    {paymentStatus?.amount && (
                      <span className="text-[10px] font-bold opacity-80 mt-1">₹{Number(paymentStatus.amount.totalAmount || paymentStatus.amount.total || 0).toLocaleString('en-IN')}</span>
                    )}
                  </button>
                );
              }
              return null;
            })()
          )}
          
          <button onClick={() => navigate('/member/profile/edit')} className="px-6 py-3 bg-slate-50 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-slate-200 hover:bg-white hover:shadow-md transition-all">Edit Profile</button>

          {/* Agency Logo */}
          {profile.documents?.agencyLogo?.url && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl p-1 shadow-sm border border-slate-100 overflow-hidden ml-2">
              <img src={profile.documents.agencyLogo.url} alt="Agency Logo" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      </div>

      {rejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className="font-bold text-red-800 text-sm uppercase tracking-wider">Application Needs Attention</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rejections.map((rej, idx) => (
              <div key={idx} className="bg-white/60 rounded-xl p-4 border border-red-100 shadow-sm">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Rejected by {rej.role}</span>
                  <span className="text-red-400">{new Date(rej.approvedAt).toLocaleDateString()}</span>
                </p>
                <p className="text-sm text-red-900 font-medium leading-relaxed">{rej.remarks || 'No additional remarks provided.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Establishment" icon="🏢">
            <LabelValue label="Business Name" value={profile.establishment?.name} highlight />
            <LabelValue label="Trade Name" value={profile.establishment?.tradeName} />
            <LabelValue label="Year Established" value={profile.establishment?.yearOfEstablishment} />
            <LabelValue label="Classification" value={profile.establishment?.officialClassification} />
            <LabelValue label="Business Type" value={profile.establishment?.businessType} />
            <LabelValue label="Official Email" value={profile.establishment?.officialEmail} />
            <LabelValue label="GST Number" value={profile.establishment?.gstNumber} />
            <LabelValue label="Website" value={profile.establishment?.website} />
          </Card>

          <Card title="Location & Address" icon="📍">
            <LabelValue label="State" value={profile.location?.state} />
            <LabelValue label="District" value={profile.location?.district} />
            <LabelValue label="City" value={profile.location?.city} />
            <LabelValue label="Region" value={profile.location?.region} />
            <LabelValue label="Pin Code" value={profile.location?.pinCode} />
            <div className="md:col-span-2"><LabelValue label="Registered Address" value={profile.location?.registeredAddress} /></div>
            {!profile.location?.isSameAddress && (<div className="md:col-span-2"><LabelValue label="Communication Address" value={profile.location?.communicationAddress} /></div>)}
          </Card>

          <Card title="Representative" icon="👤">
            <LabelValue label="Full Name" value={profile.member?.fullName} highlight />
            <LabelValue label="Role" value={profile.member?.roleInAgency} />
            <LabelValue label="Office Type" value={profile.member?.officeType} />
            <LabelValue label="DOB" value={profile.member?.dateOfBirth ? new Date(profile.member.dateOfBirth).toLocaleDateString() : 'N/A'} />
            <LabelValue label="Mobile" value={profile.member?.mobile} />
            <LabelValue label="Landline" value={profile.member?.landline} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Staff Contacts" icon="👥">
            <LabelValue label="Name" value={profile.staff?.name} />
            <LabelValue label="Mobile" value={profile.staff?.mobile} />
          </Card>

          <Card title="Partner" icon="🤝">
            <LabelValue label="Name" value={profile.partner?.name} />
            <LabelValue label="Mobile" value={profile.partner?.mobile} />
          </Card>

          <Card title="Certificate" icon="📜">
            <LabelValue label="Status" value={profile.certificate?.status} />
            <LabelValue label="Generated" value={profile.certificate?.generated ? 'Yes' : 'No'} />
            <LabelValue label="Certificate No" value={profile.certificate?.certificateNumber} />
            <LabelValue label="Issue Date" value={profile.certificate?.issueDate ? new Date(profile.certificate.issueDate).toLocaleDateString() : 'N/A'} />
            <LabelValue label="Expiry Date" value={profile.certificate?.expiryDate ? new Date(profile.certificate.expiryDate).toLocaleDateString() : 'N/A'} />
          </Card>
        </div>
      </div>

      <Card title="Verification Documents" icon="📁">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { key: 'agencyAddressProof', label: 'Agency Address Proof', icon: '📄' },
            { key: 'activityLicense', label: 'Activity License', icon: '📜' },
            { key: 'shopPhoto', label: 'Shop Photo', icon: '🖼️' },
            { key: 'businessCard', label: 'Business Card', icon: '📇' },
            { key: 'agencyLogo', label: 'Agency Logo', icon: '🏢' },
            { key: 'memberPhoto', label: 'Member Photo', icon: '👤' },
            { key: 'additionalDoc', label: 'Additional Document', icon: '📎' },
          ].map((docType) => (
            <div key={docType.key} className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{docType.label}</p>
              {profile.documents?.[docType.key] ? (
                Array.isArray(profile.documents[docType.key]) ? (
                  profile.documents[docType.key].map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">{docType.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-800 truncate">{d.publicId || d.url || `${docType.label} ${i + 1}`}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Uploaded on {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all">View</a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">{docType.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-slate-800 truncate">{profile.documents[docType.key].publicId || profile.documents[docType.key].url || docType.label}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Uploaded on {profile.documents[docType.key].uploadedAt ? new Date(profile.documents[docType.key].uploadedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    {profile.documents[docType.key].url && (
                      <a href={profile.documents[docType.key].url} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all">View</a>
                    )}
                  </div>
                )
              ) : (
                <p className="text-[10px] text-slate-300 font-bold italic">Not Uploaded</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="bg-slate-100 rounded-3xl p-6 sm:px-10 flex flex-col sm:flex-row justify-between items-center gap-4 border border-slate-200/50">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Member ID: <span className="text-slate-900 font-mono tracking-normal">{profile._id || 'N/A'}</span></div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Registered Since: <span className="text-slate-900 tracking-normal">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span></div>
      </div>
    </div>
  )
}

export default UserProfile
