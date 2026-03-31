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
  Apple: 'bg-gray-100 text-gray-800 border-gray-300',
  Samsung: 'bg-blue-50 text-blue-800 border-blue-300',
  Xiaomi: 'bg-orange-50 text-orange-800 border-orange-300',
  HONOR: 'bg-green-50 text-green-800 border-green-300',
}

const BRAND_ICONS: Record<string, string> = {
  Apple: '',
  Samsung: '',
  Xiaomi: '',
  HONOR: '',
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
      showToast('El campo no puede estar vacío', 'error')
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
      showToast('Guardado correctamente', 'success')
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
    if (!confirm('¿Estás seguro de eliminar este producto?')) return

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
    if (stock === 0) return 'bg-red-100 text-red-700 border-red-200'
    if (stock <= 20) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Modelos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredProducts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Stock Total</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalStock}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Sin Stock</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {filteredProducts.filter((p) => p.stock === 0).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Marcas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{brands.length}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por marca o modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
            />
          </div>

          {/* Brand filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {BRAND_ICONS[b]} {b}
              </option>
            ))}
          </select>

          {/* Stock filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todo el stock</option>
            <option value="in_stock">Con stock</option>
            <option value="low_stock">Stock bajo (&le;20)</option>
            <option value="out_of_stock">Sin stock</option>
          </select>

          {/* Add button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row gap-3">
            <select
              value={newProduct.brand}
              onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar marca</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              <option value="__custom">+ Nueva marca</option>
            </select>
            {newProduct.brand === '__custom' && (
              <input
                type="text"
                placeholder="Nombre de marca"
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
            <input
              type="text"
              placeholder="Modelo (ej: IP16-PRO)"
              value={newProduct.model}
              onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Stock"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
              className="w-24 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={addProduct}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewProduct({ brand: '', model: '', stock: 0 })
                }}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th
                  onClick={() => handleSort('brand')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    Marca
                    {sortConfig.key === 'brand' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('model')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    Modelo
                    {sortConfig.key === 'model' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stock')}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    Stock
                    {sortConfig.key === 'stock' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ajuste rápido
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    saving === product.id ? 'opacity-60' : ''
                  }`}
                >
                  {/* Brand */}
                  <td className="px-4 py-3">
                    {editingCell?.id === product.id && editingCell?.field === 'brand' ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(product.id, 'brand')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'brand')}
                        className="w-full px-2 py-1 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <span
                        onClick={() => startEditing(product.id, 'brand', product.brand)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 ${
                          BRAND_COLORS[product.brand] || 'bg-purple-50 text-purple-800 border-purple-300'
                        }`}
                      >
                        {BRAND_ICONS[product.brand]} {product.brand}
                      </span>
                    )}
                  </td>

                  {/* Model */}
                  <td className="px-4 py-3">
                    {editingCell?.id === product.id && editingCell?.field === 'model' ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(product.id, 'model')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'model')}
                        className="w-full px-2 py-1 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <span
                        onClick={() => startEditing(product.id, 'model', product.model)}
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        {product.model}
                      </span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3 text-center">
                    {editingCell?.id === product.id && editingCell?.field === 'stock' ? (
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(product.id, 'stock')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'stock')}
                        className="w-20 mx-auto px-2 py-1 border border-indigo-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <span
                        onClick={() => startEditing(product.id, 'stock', product.stock)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border cursor-pointer hover:opacity-80 ${getStockBadge(
                          product.stock
                        )}`}
                      >
                        {product.stock}
                      </span>
                    )}
                  </td>

                  {/* Quick adjust */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => updateStock(product.id, -10)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors"
                        title="-10"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => updateStock(product.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-bold transition-colors"
                        title="-1"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateStock(product.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-sm font-bold transition-colors"
                        title="+1"
                      >
                        +
                      </button>
                      <button
                        onClick={() => updateStock(product.id, 10)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 text-xs font-bold transition-colors"
                        title="+10"
                      >
                        +10
                      </button>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Tip */}
      <p className="text-xs text-gray-400 text-center">
        Hacé clic en cualquier celda para editarla. Usá los botones +/- para ajuste rápido de stock.
      </p>
    </div>
  )
}
