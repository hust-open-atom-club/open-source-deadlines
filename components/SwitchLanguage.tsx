'use client'

import i18next, { supportedLngDisplayNames } from '@/i18n/config'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import * as Select from '@radix-ui/react-select'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function SwitchLanguage() {
    const { i18n } = useTranslation()
    const [currentLng, setCurrentLng] = useState(i18n.language)

    const handleChange = (value: string) => {
        i18next.changeLanguage(value)
        setCurrentLng(value)
    }

    return (
        <Select.Root value={currentLng} onValueChange={handleChange}>
            <Select.Trigger
                className="inline-flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition min-w-[120px]"
                aria-label="Language"
            >
                <Select.Value />
                <Select.Icon>
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content className="rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                    <Select.Viewport className="p-1">
                        {Object.entries(supportedLngDisplayNames).map(([lng, label]) => (
                            <Select.Item
                                key={lng}
                                value={lng}
                                className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-slate-900 outline-none hover:bg-slate-100 data-[state=checked]:bg-primary/10"
                            >
                                <Select.ItemText>{label}</Select.ItemText>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    )
}
