import { Globe, Languages } from 'lucide-react'
import { LANGUAGES } from '../lib/languages'

export function LanguageSelector({
  sourceLanguage,
  translateToEnglish,
  onSourceLanguageChange,
  onTranslateChange,
  disabled,
}) {
  const translateDisabled = disabled || sourceLanguage === 'en'

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-slate-400 shrink-0" />
        <select
          value={sourceLanguage}
          onChange={(e) => onSourceLanguageChange(e.target.value)}
          disabled={disabled}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 disabled:opacity-40 cursor-pointer"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-slate-900">
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <label
        className={`flex items-center gap-2 cursor-pointer select-none ${translateDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <input
          type="checkbox"
          checked={translateToEnglish}
          onChange={(e) => onTranslateChange(e.target.checked)}
          disabled={translateDisabled}
          className="w-4 h-4 accent-violet-500"
        />
        <Languages size={16} className="text-slate-400" />
        <span className="text-sm text-slate-300">Translate to English</span>
      </label>
    </div>
  )
}
