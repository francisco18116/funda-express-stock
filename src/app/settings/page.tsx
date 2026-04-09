'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function SettingsPage() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const embedUrl = `${baseUrl}/embed`

  const [width, setWidth] = useState('100%')
  const [height, setHeight] = useState('800')
  const [copied, setCopied] = useState(false)

  const iframeCode = `<iframe src="${embedUrl}" width="${width}" height="${height}px" frameborder="0" style="border: none; border-radius: 12px; overflow: hidden;"></iframe>`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iframeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Funda Express"
                width={180}
                height={50}
                className="h-10 w-auto"
                priority
              />
            </div>
            <Link
              href="/"
              className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-brand-cyan hover:bg-cyan-50 rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Stock
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
          <p className="text-sm text-gray-400 mt-1">Personaliza e integra tu inventario</p>
        </div>

        {/* Embed Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Embeber en otra pagina</h2>
                <p className="text-xs text-gray-400">Copia el codigo y pegalo en tu sitio web</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Dimension Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">Ancho</label>
                <select
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                >
                  <option value="100%">100% (ancho completo)</option>
                  <option value="800px">800px</option>
                  <option value="600px">600px</option>
                  <option value="400px">400px (compacto)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">Alto (px)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                />
              </div>
            </div>

            {/* Code Block */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 ml-1">Codigo HTML</label>
                <button
                  onClick={copyToClipboard}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-press flex items-center gap-1.5 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-brand-pink hover:text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-emerald-400 font-mono whitespace-pre-wrap break-all">
                  {iframeCode}
                </code>
              </div>
            </div>

            {/* Direct URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">URL directa del embed</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={embedUrl}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 text-gray-600 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(embedUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors btn-press"
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Vista previa</h2>
                <p className="text-xs text-gray-400">Asi se vera el embed en otra pagina</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50/50">
            <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
              {baseUrl && (
                <iframe
                  src={`${baseUrl}/embed`}
                  width={width}
                  height={`${height}px`}
                  style={{ border: 'none', maxWidth: '100%' }}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
