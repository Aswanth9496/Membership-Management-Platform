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

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await memberEndpoints.profile.getProfile()
      if (response && response.success) {
        setProfile(response.data?.member || null)
        
        // Also fetch payment status for dynamic amounts - isolate try-catch
        try {
          const payRes = await memberEndpoints.payments.getStatus()
          if (payRes?.success) {
            setPaymentStatus(payRes.data)
          }
        } catch (payErr) {
          console.error('Non-critical error: Failed to fetch payment status:', payErr)
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


  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Load Razorpay script
      const resScript = await loadRazorpayScript()
      if (!resScript) {
        setError('Razorpay SDK failed to load. Check your internet connection.')
        setLoading(false)
        return
      }

      // 2. Create order on backend
      const orderRes = await memberEndpoints.payments.createOrder()
      if (!orderRes.success) {
        setError(orderRes.message || 'Failed to create payment order')
        setLoading(false)
        return
      }

      const orderData = orderRes.data || {}
      const { orderId, amount, currency, keyId, memberDetails, notes } = orderData
      
      if (!orderId || !keyId) {
        setError('Received invalid payment data from server.')
        setLoading(false)
        return
      }

      // 3. Initialize Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'TechFinit Association',
        description: profile.payment?.type === 'new' ? 'Membership Registration' : 'Membership Renewal',
        order_id: orderId,
        handler: async (response) => {
          try {
            setLoading(true)
            // 4. Verify payment on backend
            const verifyRes = await memberEndpoints.payments.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verifyRes.success) {
              setSuccessMessage(verifyRes.message || 'Payment successful! Your membership is now active.')
              await fetchProfile()
            } else {
              setError(verifyRes.message || 'Payment verification failed')
            }
          } catch (err) {
            console.error('Payment verification error:', err)
            setError('Error verifying payment. Please contact support.')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: memberDetails.name,
          email: memberDetails.email,
          contact: memberDetails.contact,
        },
        notes: notes,
        theme: {
          color: '#2563EB',
        },
      }

      if (!window.Razorpay) {
        setError('Payment gateway failed to load. Please disable adblockers or try another browser.')
        setLoading(false)
        return
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.open()
    } catch (err) {
      console.error('Payment initialization error:', err)
      setError('Failed to initialize payment')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fadeUp">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 animate-fadeUp">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center max-w-lg mx-auto">
          <p className="text-red-600 font-bold mb-4">{error || 'Profile not found'}</p>
          <button onClick={fetchProfile} className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all">Retry</button>
        </div>
      </div>
    )
  }

  const Card = ({ title, icon, children, className = "" }) => (
    <div className={`compact-card p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        {children}
      </div>
    </div>
  )

  const LabelValue = ({ label, value, highlight = false }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
      <p className={`text-sm font-bold truncate ${highlight ? 'text-blue-600' : 'text-slate-700'}`}>
        {value || 'Not Specified'}
      </p>
    </div>
  )

  return (
    <div className="space-y-8 animate-fadeUp">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-sm text-slate-500">Manage your association membership and establishment details.</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between animate-fadeUp">
          <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="text-lg">✓</span> {successMessage}
          </p>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* Profile Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl font-extrabold shadow-inner shrink-0">
            {profile.member?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="text-center md:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                {profile.member?.fullName}
              </h1>
              <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${profile.status === 'approved'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100'
                  : 'bg-amber-500/20 border-amber-500/30 text-amber-100'
                }`}>
                {profile.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 opacity-80">
              <p className="text-xs font-semibold flex items-center gap-2">
                <span className="opacity-60 text-base">📧</span> {profile.email}
              </p>
              <p className="text-xs font-semibold flex items-center gap-2">
                <span className="opacity-60 text-base">📞</span> {profile.member?.mobile}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 bg-white/10 rounded-md">
                {profile.membershipType}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex gap-3 flex-wrap justify-center md:justify-end">
            {/* Conditional Payment Button */}
            {profile.status === 'verified' &&
              profile.approvals?.president?.approved &&
              profile.approvals?.secretary?.approved &&
              profile.approvals?.treasurer?.approved &&
              profile.payment?.status === 'pending' && (
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="text-sm">💳</span>
                  {loading ? 'Processing...' : (
                    profile.payment?.type === 'new'
                      ? `Complete Payment ${paymentStatus?.amount?.totalAmount ? `(₹${paymentStatus.amount.totalAmount})` : ''}`
                      : `Renew Membership ${paymentStatus?.amount?.totalAmount ? `(₹${paymentStatus.amount.totalAmount})` : ''}`
                  )}
                </button>
              )}

            {!['rejected', 'submitted', 'change_requested'].includes(profile.status) && (
              <button
                onClick={() => navigate('/member/profile/edit')}
                className="px-6 py-2.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Establishment Details */}
        <Card title="Establishment Details" icon="🏢">
          <LabelValue label="Business Name" value={profile.establishment?.name} highlight />
          <LabelValue label="Trade Name" value={profile.establishment?.tradeName} />
          <LabelValue label="Year Established" value={profile.establishment?.yearOfEstablishment} />
          <LabelValue label="Classification" value={profile.establishment?.officialClassification} />
          <LabelValue label="Business Type" value={profile.establishment?.businessType} />
          <LabelValue label="GST Number" value={profile.establishment?.gstNumber} />
          <LabelValue label="Official Email" value={profile.establishment?.officialEmail} />
          <LabelValue label="Website" value={profile.establishment?.website} />
          <div className="md:col-span-2">
            <LabelValue label="GST Status" value={profile.establishment?.gstRegistered ? 'GST Registered Organization' : 'Non-GST Registered'} />
          </div>
        </Card>

        <div className="space-y-8">
          {/* Location Details */}
          <Card title="Location & Address" icon="📍">
            <LabelValue label="City" value={profile.location?.city} highlight />
            <LabelValue label="District" value={profile.location?.district} />
            <LabelValue label="Pin Code" value={profile.location?.pinCode} />
            <div className="md:col-span-2">
              <LabelValue label="Full Address" value={profile.location?.registeredAddress} />
            </div>
          </Card>

          {/* Representative Details */}
          <Card title="Representative Details" icon="👤">
            <LabelValue label="Role in Agency" value={profile.member?.roleInAgency} />
            <LabelValue label="Office Type" value={profile.member?.officeType} />
            <LabelValue label="Date of Birth" value={profile.member?.dateOfBirth ? new Date(profile.member.dateOfBirth).toLocaleDateString() : 'N/A'} />
            <LabelValue label="Landline" value={profile.member?.landline} />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Partner Details" icon="🤝">
          <LabelValue label="Name" value={profile.partner?.name} />
          <LabelValue label="Mobile" value={profile.partner?.mobile} />
        </Card>
        <Card title="Staff Contact" icon="👥">
          <LabelValue label="Name" value={profile.staff?.name} />
          <LabelValue label="Mobile" value={profile.staff?.mobile} />
        </Card>
      </div>

      {/* Documents Section */}
      <Card title="Verification Documents" icon="📁" className="bg-slate-50/50">
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Agency Address Proof</p>
          {profile.documents?.agencyAddressProof ? (
            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">📄</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-800 truncate">Address_Proof.pdf</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  Uploaded on {profile.documents.agencyAddressProof.uploadedAt ? new Date(profile.documents.agencyAddressProof.uploadedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <a
                href={profile.documents.agencyAddressProof.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all"
              >
                View
              </a>
            </div>
          ) : (
            <p className="text-[10px] text-slate-300 font-bold italic">Not Uploaded</p>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Shop Photo / Logo</p>
          {profile.documents?.shopPhoto ? (
            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">🖼️</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-800 truncate">Shop_Photo.pdf</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  Uploaded on {profile.documents.shopPhoto.uploadedAt ? new Date(profile.documents.shopPhoto.uploadedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <a
                href={profile.documents.shopPhoto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all"
              >
                View
              </a>
            </div>
          ) : (
            <p className="text-[10px] text-slate-300 font-bold italic">Not Uploaded</p>
          )}
        </div>
      </Card>

      {/* Admin Info Section */}
      <div className="bg-slate-100 rounded-3xl p-6 sm:px-10 flex flex-col sm:flex-row justify-between items-center gap-4 border border-slate-200/50">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Member ID: <span className="text-slate-900 font-mono tracking-normal">{profile._id || 'N/A'}</span>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Registered Since: <span className="text-slate-900 tracking-normal">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
