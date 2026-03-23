import React from 'react'

const InputField = ({ label, name, type = "text", value, onChange, onBlur, placeholder, error, touched, required, ...props }) => (
  <div className="space-y-1">
    <label className="text-gray-700 text-[10px] font-bold uppercase tracking-widest ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    {type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-white border ${error && touched ? 'border-red-500/50 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} rounded-2xl px-5 py-3.5 text-gray-900 text-sm transition-all focus:bg-gray-50 outline-none`}
        {...props}
      />
    ) : (
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-white border ${error && touched ? 'border-red-500/50 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} rounded-2xl px-5 py-3.5 text-gray-900 text-sm transition-all focus:bg-gray-50 outline-none`}
        {...props}
      />
    )}
    {error && touched && (
      <p className="text-red-600 text-[9px] font-bold uppercase tracking-tighter ml-1 animate-fadeIn">{error}</p>
    )}
  </div>
)

export default InputField
