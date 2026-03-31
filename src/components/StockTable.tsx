'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

type Product = {
  id: number
  brand: string
  model: string
  stock: number
  created_at: string
  updated_at: string
}

function supabase() {
  return createClient()
}

const BRAND_COLORS: Record<string, string> = {
  Apple: 'bg-slate-100 text-slate-700 border-slate-200',
  Samsung: 'bg-blue-50 text-blue-700 border-blue-200',
  Xiaomi: 'bg-amber-50 text-amber-700 border-amber-200',
  HONOR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export default function StockTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({ brand: '', model: '', stock: 0 })
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' }>({
    key: 'brand',
    direction: 'asc',
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase()
      .from('products')
      .select('*')
      .order('brand', { ascending: true })
      .order('model', { ascending: true })

    if (error) {
      showToast('Error cargando productos', 'error')
      console.error(error)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    let result = [...products]

    if (search) {
      const s = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.model.toLowerCase().includes(s) ||
          p.brand.toLowerCase().includes(s)
      )
    }

    if (brandFilter !== 'all') {
      result = result.filter((p) => p.brand === brandFilter)
    }

    if (stockFilter === 'in_stock') {
      result = result.filter((p) => p.stock > 0)
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter((p) => p.stock === 0)
    } else if (stockFilter === 'low_stock') {
      result = result.filter((p) => p.stock > 0 && p.stock <= 20)
    }

    result.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    setFilteredProducts(result)
  }, [products, search, brandFilter, stockFilter, sortConfig])

  const handleSort = (key: keyof Product) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const startEditing = (id: number, field: string, currentValue: string | number) => {
    setEditingCell({ id, field })
    setEditValue(String(currentValue))
  }

  const saveEdit = async (id: number, field: string) => {
    setSaving(id)
    const value = field === 'stock' ? parseInt(editValue) || 0 : editValue.trim()

    if (!value && field !== 'stock') {
      showToast('El campo no puede estar vacio', 'error')
      setSaving(null)
      return
    }

    const { error } = await supabase()
      .from('products')
      .update({ [field]: value })
      .eq('id', id)

    if (error) {
      showToast('Error al guardar', 'error')
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      )
      showToast('Guardado', 'success')
    }

    setEditingCell(null)
    setSaving(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: number, field: string) => {
    if (e.key === 'Enter') {
      saveEdit(id, field)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const updateStock = async (id: number, delta: number) => {
    const product = products.find((p) => p.id === id)
    if (!product) return

    const newStock = Math.max(0, product.stock + delta)
    setSaving(id)

    const { error } = await supabase()
      .from('products')
      .update({ stock: newStock })
      .eq('id', id)

    if (error) {
      showToast('Error al actualizar stock', 'error')
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
      )
    }
    setSaving(null)
  }

  const deleteProduct = async (id: number) => {
    if (!confirm('Eliminar este producto?')) return

    const { error } = await supabase().from('products').delete().eq('id', id)
    if (error) {
      showToast('Error al eliminar', 'error')
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id))
      showToast('Producto eliminado', 'success')
    }
  }

  const addProduct = async () => {
    if (!newProduct.brand.trim() || !newProduct.model.trim()) {
      showToast('Marca y modelo son obligatorios', 'error')
      return
    }

    const { data, error } = await supabase()
      .from('products')
      .insert([newProduct])
      .select()
      .single()

    if (error) {
      showToast('Error al agregar producto', 'error')
    } else {
      setProducts((prev) => [...prev, data])
      setNewProduct({ brand: '', model: '', stock: 0 })
      setShowAddForm(false)
      showToast('Producto agregado', 'success')
    }
  }

  const totalStock = filteredProducts.reduce((sum, p) => sum + p.stock, 0)
  const brands = [...new Set(products.map((p) => p.brand))].sort()

  const getStockBadge = (stock: number) => {
    if (stock === 0) return 'bg-red-50 text-red-600 border-red-200'
    if (stock <= 20) return 'bg-amber-50 text-amber-600 border-amber-200'
    return 'bg-emerald-50 text-emerald-600 border-emerald-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 rounded-full" />
            <div className="w-12 h-12 border-4 border-transparent border-t-brand-pink rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-[fadeIn_0.2s_ease] ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Modelos</p>
              <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Stock Total</p>
              <p className="text-2xl font-bold text-brand-pink">{totalStock.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Sin Stock</p>
              <p className="text-2xl font-bold text-red-500">
                {filteredProducts.filter((p) => p.stock === 0).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Marcas</p>
              <p className="text-2xl font-bold text-gray-900">{brands.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por marca o modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/30 focus:border-brand-pink bg-gray-50/50 placeholder:text-gray-400"
            />
          </div>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/30 focus:border-brand-pink"
          >
            <option value="all">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/30 focus:border-brand-pink"
          >
            <option value="all">Todo el stock</option>
            <option value="in_stock">Con stock</option>
            <option value="low_stock">Stock bajo</option>
            <option value="out_of_stock">Sin stock</option>
          </select>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-2.5 bg-gradient-to-r from-brand-pink to-brand-pink-dark text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand-pink/25 transition-all btn-press flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full md:w-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Marca</label>
              <select
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
              >
                <option value="">Seleccionar</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="__custom">+ Nueva marca</option>
              </select>
            </div>
            {newProduct.brand === '__custom' && (
              <div className="flex-1 w-full md:w-auto">
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Nueva marca</label>
                <input
                  type="text"
                  placeholder="Nombre"
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
                />
              </div>
            )}
            <div className="flex-1 w-full md:w-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Modelo</label>
              <input
                type="text"
                placeholder="IP16-PRO"
                value={newProduct.model}
                onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
              />
            </div>
            <div className="w-full md:w-28">
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Stock</label>
              <input
                type="number"
                placeholder="0"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addProduct}
                className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors btn-press"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewProduct({ brand: '', model: '', stock: 0 })
                }}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th
                  onClick={() => handleSort('brand')}
                  className="px-5 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-brand-pink select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Marca
                    {sortConfig.key === 'brand' && (
                      <span className="text-brand-pink">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('model')}
                  className="px-5 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-brand-pink select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Modelo
                    {sortConfig.key === 'model' && (
                      <span className="text-brand-pink">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stock')}
                  className="px-5 py-4 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-brand-pink select-none transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Stock
                    {sortConfig.key === 'stock' && (
                      <span className="text-brand-pink">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-5 py-4 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  Ajuste
                </th>
                <th className="px-5 py-4 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, idx) => (
                <tr
                  key={product.id}
                  className={`stock-row border-b border-gray-50 ${
                    saving === product.id ? 'opacity-50' : ''
                  } ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                >
                  {/* Brand */}
                  <td className="px-5 py-3.5">
                    {editingCell?.id === product.id && editingCell?.field === 'brand' ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(product.id, 'brand')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'brand')}
                        className="w-full px-3 py-1.5 border-2 border-brand-pink rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                      />
                    ) : (
                      <span
                        onClick={() => startEditing(product.id, 'brand', product.brand)}
                        className={`stock-badge inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          BRAND_COLORS[product.brand] || 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {product.brand}
                      </span>
                    )}
                  </td>

                  {/* Model */}
                  <td className="px-5 py-3.5">
                    {editingCell?.id === product.id && editingCell?.field === 'model' ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(product.id, 'model')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'model')}
                        className="w-full px-3 py-1.5 border-2 border-brand-pink rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                      />
                    ) : (
                      <span
                        onClick={() => startEditing(product.id, 'model', product.model)}
                        className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-brand-cyan transition-colors"
                      >
                        {product.model}
                      </span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-5 py-3.5 text-center">
                    {editingCell?.id === product.id && editingCell?.field === 'stock' ? (
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(product.id, 'stock')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'stock')}
                        className="w-20 mx-auto px-3 py-1.5 border-2 border-brand-pink rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                      />
                    ) : (
                      <span
                        onClick={() => startEditing(product.id, 'stock', product.stock)}
                        className={`stock-badge inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${getStockBadge(product.stock)}`}
                      >
                        {product.stock}
                      </span>
                    )}
                  </td>

                  {/* Quick adjust */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => updateStock(product.id, -10)}
                        className="w-9 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-[10px] font-bold transition-colors btn-press"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => updateStock(product.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm font-bold transition-colors btn-press"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateStock(product.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 hover:bg-emerald-100 text-sm font-bold transition-colors btn-press"
                      >
                        +
                      </button>
                      <button
                        onClick={() => updateStock(product.id, 10)}
                        className="w-9 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 hover:bg-emerald-100 text-[10px] font-bold transition-colors btn-press"
                      >
                        +10
                      </button>
                    </div>
                  </td>

                  {/* Delete */}
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 text-gray-300">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm font-medium">No se encontraron productos</p>
            <p className="text-xs mt-1">Intenta con otros filtros</p>
          </div>
        )}
      </div>

      {/* Footer tip */}
      <p className="text-[11px] text-gray-300 text-center font-medium tracking-wide">
        Clic en cualquier celda para editar &middot; Botones +/- para ajuste rapido
      </p>
    </div>
  )
}
