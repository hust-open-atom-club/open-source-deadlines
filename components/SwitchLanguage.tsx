'use client'

import { useTranslation } from 'react-i18next'
import i18next from '@/i18n/config'
import { useState } from 'react'
import { supportedLngDisplayNames } from '@/i18n/config'

export function SwitchLanguage() {
    const { i18n } = useTranslation()
    const [currentLng, setCurrentLng] = useState(i18n.language)

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextLng = e.target.value
        i18next.changeLanguage(nextLng)
        setCurrentLng(nextLng)
    }

    return (
        <div className="relative">
            <select
                value={currentLng}
                onChange={handleChange}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
                {Object.entries(supportedLngDisplayNames).map(([lng, label]) => (
                    <option key={lng} value={lng}>
                        {label}
                    </option>
                ))}
            </select>
        </div>
    )
}
