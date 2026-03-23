import React from 'react'

const ReferencesSearch = ({
  formData,
  refSearch,
  setRefSearch,
  refResults,
  isSearching,
  showRefDropdown,
  setShowRefDropdown,
  addReference,
  removeReference,
  errors,
  touched,
  searchContainerRef
}) => {
  return (
    <div className="space-y-6 pt-10 border-t border-gray-200 relative">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
          <h2 className="text-gray-900 text-sm font-bold uppercase tracking-widest">Member References <span className="text-red-500">*</span></h2>
        </div>
        <span className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase transition-all ${errors['references'] && touched['references']
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
          {formData.references.length === 0 ? 'Verification Required' : `${formData.references.length} Reference(s) Added`}
        </span>
      </div>

      <div className="space-y-4">
        <div ref={searchContainerRef} className="relative group">
          <div
            className={`min-h-[64px] bg-white border ${formData.references.length >= 2 ? 'border-gray-200 opacity-60 cursor-not-allowed' : 'border-gray-300 focus-within:border-blue-500 hover:border-gray-400'} rounded-[24px] px-4 py-3 transition-all flex flex-wrap gap-2 items-center shadow-sm`}
            onClick={() => formData.references.length < 2 && setShowRefDropdown(true)}
          >
            <span className="text-gray-400 ml-2">🔍</span>

            {formData.references.map((ref) => (
              <div key={ref._id} className="bg-blue-50 border border-blue-200 rounded-xl pl-3 pr-2 py-1.5 flex items-center gap-2 group/chip animate-scaleIn">
                <span className="text-gray-900 text-[10px] font-bold uppercase tracking-tight">{ref.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeReference(ref._id);
                  }}
                  className="w-5 h-5 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-all transform active:scale-90"
                >
                  ✕
                </button>
              </div>
            ))}

            {formData.references.length < 2 && (
              <input
                type="text"
                placeholder={formData.references.length === 0 ? "Search by member name, agency or ID..." : "Add second reference..."}
                value={refSearch}
                onChange={(e) => {
                  setRefSearch(e.target.value);
                  setShowRefDropdown(true);
                }}
                onFocus={() => setShowRefDropdown(true)}
                className="flex-1 bg-transparent border-none text-gray-900 text-sm focus:ring-0 outline-none min-w-[200px] h-full placeholder-gray-400"
              />
            )}

            {formData.references.length >= 2 && (
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-2 italic">
                Maximum references reached
              </span>
            )}

            {isSearching && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {showRefDropdown && (refSearch.length >= 2 || (refResults.length > 0 && !refSearch)) && (
            <div className="absolute z-50 top-full mt-3 w-full bg-white border border-gray-500 rounded-[28px] shadow-xl overflow-hidden animate-scaleIn origin-top-center p-2">
              {refResults.length > 0 ? (
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] px-5 py-3 border-b border-gray-200">Suggested Partners</p>
                  {refResults.map((member) => (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => addReference(member)}
                      className="w-full text-left px-5 py-4 hover:bg-blue-50 rounded-2xl transition-all border-b border-gray-100 last:border-0 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-lg group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300">
                          👤
                        </div>
                        <div>
                          <p className="text-gray-900 text-xs font-bold mb-0.5 group-hover:text-blue-600 transition-colors uppercase tracking-wide">
                            {member.member?.fullName || member.name}
                          </p>
                          <p className="text-gray-500 text-[9px] uppercase tracking-tighter flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-blue-600 font-bold">{member.establishment?.name || member.company}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>{member.membershipNumber}</span>
                            {member.email && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-gray-400 lowercase">{member.email}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                        ➕
                      </div>
                    </button>
                  ))}
                </div>
              ) : refSearch.length >= 2 ? (
                <div className="p-8 text-center">
                  <div className="text-2xl mb-2 opacity-20">🔍</div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">No members found matching "{refSearch}"</p>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Type to search existing members</p>
                </div>
              )}
            </div>
          )}

          {errors['references'] && touched['references'] && (
            <p className="absolute -bottom-6 left-4 text-red-600 text-[9px] font-bold uppercase tracking-tighter animate-fadeIn">
              {errors['references']}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-2 px-1">
          <div className="flex items-center gap-2 text-gray-500 text-[9px] font-medium uppercase tracking-widest opacity-70">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Trusted Network
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-[9px] font-medium uppercase tracking-widest opacity-70">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Real-time verification
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReferencesSearch
