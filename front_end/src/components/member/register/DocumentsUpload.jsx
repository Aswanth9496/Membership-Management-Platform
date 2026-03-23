import React from 'react'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

const DEFAULT_FIELDS = ['agencyAddressProof','activityLicense','shopPhoto','businessCard','agencyLogo','memberPhoto','additionalDoc']

const DocumentsUpload = ({ files = {}, errors = {}, touched = {}, handleFileChange, fileErrors = {}, removeShopPhoto }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2 px-1">
        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
        <h2 className="text-gray-900 text-sm font-bold uppercase tracking-widest">Verification Documents</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DEFAULT_FIELDS.map((key) => {
          const isShop = key === 'shopPhoto'
          const shopFiles = Array.isArray(files.shopPhoto) ? files.shopPhoto : []
          const singleFile = files[key] || null

          return (
            <div key={key} className="space-y-4">
              <div className={`bg-white border ${(errors && errors[key]) && (touched && touched[key]) ? 'border-red-500/50' : 'border-gray-300'} rounded-3xl p-6 transition-all hover:bg-gray-50 hover:border-blue-500/30 group relative min-h-[140px] flex items-center justify-center shadow-sm`}>
                <div className="text-center group-hover:scale-105 transition-transform duration-500">
                  <div className="text-xl mb-2">
                    {key === 'agencyLogo' ? '🖼️' : key === 'memberPhoto' ? '👤' : '📄'}
                  </div>
                  <p className="text-gray-900 text-[10px] font-bold uppercase tracking-widest mb-1 pointer-events-none">
                    {key === 'agencyAddressProof' && 'Agency Address Proof'}
                    {key === 'activityLicense' && 'Activity License'}
                    {key === 'shopPhoto' && 'Shop Photo'}
                    {key === 'businessCard' && 'Business Card'}
                    {key === 'agencyLogo' && 'Agency Logo'}
                    {key === 'memberPhoto' && 'Main Member Photo'}
                    {key === 'additionalDoc' && 'Additional Document'}
                  </p>
                  <p className="text-gray-500 text-[8px] uppercase tracking-tighter pointer-events-none">
                    {isShop ? 'You may upload up to 4 shop photos. JPG/PNG • 5MB each' : 'JPG, PNG or PDF • 5MB'}
                  </p>
                </div>

                <input
                  type="file"
                  name={key}
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  accept=".jpg,.jpeg,.png,.pdf"
                  multiple={isShop}
                  aria-label={`Upload ${key}`}
                />

                <div className="absolute top-2 right-2 text-xs text-left">
                  {isShop && shopFiles.length > 0 ? (
                    <div className="flex flex-col items-end gap-2">
                      {shopFiles.map((f, idx) => {
                        const name = (f && f.name) ? f.name : String(f || '')
                        const display = name.length > 20 ? name.substring(0, 20) + '...' : name
                        return (
                          <div key={idx} className="bg-blue-50 border border-blue-200 rounded-xl px-2 py-1 flex items-center gap-2 text-blue-600 font-bold uppercase text-[10px]">
                            <span>{display}</span>
                            <button type="button" onClick={() => removeShopPhoto(idx)} className="ml-2 text-red-500 bg-red-50 rounded-full w-5 h-5 flex items-center justify-center">✕</button>
                          </div>
                        )
                      })}
                    </div>
                  ) : singleFile ? (
                    <div className="flex items-center gap-1.5 text-blue-600 text-[8px] font-bold uppercase bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 animate-scaleIn">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      {(((singleFile && singleFile.name) || '')).length > 15 ? (((singleFile && singleFile.name) || '')).substring(0, 15) + '...' : ((singleFile && singleFile.name) || '')}
                    </div>
                  ) : (errors && errors[key]) && (touched && touched[key]) ? (
                    <div className="flex items-center gap-1.5 text-red-600 text-[8px] font-bold uppercase bg-red-50 px-2 py-1 rounded-lg border border-red-200 animate-scaleIn">Required</div>
                  ) : key === 'additionalDoc' ? (
                    <div className="flex items-center gap-1.5 text-gray-500 text-[8px] font-bold uppercase bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">Optional</div>
                  ) : null}
                </div>

                {fileErrors && fileErrors[key] && (
                  <p className="absolute -bottom-5 left-4 text-red-600 text-[9px] font-bold uppercase tracking-tighter animate-fadeIn">{fileErrors[key]}</p>
                )}
              </div>
            </div>
          )})}
      </div>
    </div>
  )
}

export default DocumentsUpload
