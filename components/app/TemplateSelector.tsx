'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function TemplateSelector() {
  const { templates, currentTemplate, setCurrentTemplate } = useAppStore()
  const [selectedTab, setSelectedTab] = useState('template')

  if (templates.length === 0) {
    return null
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Design presets</span>
        <div className="text-sm mt-1">
          {currentTemplate 
            ? templates.find(t => t.id === currentTemplate)?.name || 'Select template'
            : 'Select a template'
          }
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => setCurrentTemplate(template.id)}
            className={`p-3 border transition-colors text-left ${
              currentTemplate === template.id
                ? 'border-white bg-white text-black'
                : 'border-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="text-xs font-semibold mb-1">{template.name}</div>
            {template.description && (
              <div className="text-xs text-gray-500">{template.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

