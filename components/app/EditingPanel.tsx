'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { TemplateSelector } from './TemplateSelector'

type Tab = 'photo' | 'data' | 'template' | 'ratio'

export function EditingPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('template')
  const { currentActivity } = useAppStore()

  return (
    <div className="h-44 border-t border-gray-800 bg-black">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('photo')}
          className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
            activeTab === 'photo'
              ? 'bg-white text-black font-semibold'
              : 'hover:bg-gray-900'
          }`}
        >
          Photo
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
            activeTab === 'data'
              ? 'bg-white text-black font-semibold'
              : 'hover:bg-gray-900'
          }`}
        >
          Data
        </button>
        <button
          onClick={() => setActiveTab('template')}
          className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
            activeTab === 'template'
              ? 'bg-white text-black font-semibold'
              : 'hover:bg-gray-900'
          }`}
        >
          Template
        </button>
        <button
          onClick={() => setActiveTab('ratio')}
          className={`px-4 py-2 text-sm uppercase tracking-wider transition-colors ${
            activeTab === 'ratio'
              ? 'bg-white text-black font-semibold'
              : 'hover:bg-gray-900'
          }`}
        >
          Ratio
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 h-32 overflow-y-auto">
        {activeTab === 'photo' && (
          <div className="space-y-2">
            <button className="w-full px-4 py-2 border border-gray-800 hover:border-white transition-colors text-sm uppercase tracking-wider">
              Upload Photo
            </button>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="flex flex-wrap gap-2">
            {currentActivity && (
              <>
                <button className="px-3 py-1 border border-gray-800 hover:border-white transition-colors text-xs uppercase">
                  Distance
                </button>
                <button className="px-3 py-1 border border-gray-800 hover:border-white transition-colors text-xs uppercase">
                  Elevation
                </button>
                <button className="px-3 py-1 border border-gray-800 hover:border-white transition-colors text-xs uppercase">
                  Time
                </button>
                <button className="px-3 py-1 border border-gray-800 hover:border-white transition-colors text-xs uppercase">
                  Speed/Avg
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'template' && <TemplateSelector />}

        {activeTab === 'ratio' && (
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-white bg-white text-black text-sm uppercase tracking-wider">
              9:16
            </button>
            <button className="px-4 py-2 border border-gray-800 hover:border-white transition-colors text-sm uppercase tracking-wider">
              4:5
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

