import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'

const LabCatalog = () => {
  const { getLabCatalog, updateLabCatalog, labCatalog } = useContext(AdminContext)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true)
      const data = await getLabCatalog()
      if (data?.success) {
        const next = data.categories || []
        setCategories(next)
        const testsCategory = next.find(c => (c.name || '').toLowerCase().includes('test'))
        setSelectedCategoryKey((testsCategory?.key || testsCategory?.name) || (next[0]?.key || next[0]?.name) || '')
      } else if (labCatalog?.length) {
        setCategories(labCatalog)
        const testsCategory = labCatalog.find(c => (c.name || '').toLowerCase().includes('test'))
        setSelectedCategoryKey((testsCategory?.key || testsCategory?.name) || (labCatalog[0]?.key || labCatalog[0]?.name) || '')
      }
      setLoading(false)
    }
    fetchCatalog()
  }, [])

  const onCategoryNameChange = (index, value) => {
    const next = [...categories]
    next[index] = { ...next[index], name: value }
    setCategories(next)
  }

  const onItemChange = (catIndex, itemIndex, field, value) => {
    const next = [...categories]
    const items = [...(next[catIndex].items || [])]
    items[itemIndex] = { ...items[itemIndex], [field]: value }
    next[catIndex] = { ...next[catIndex], items }
    setCategories(next)
  }

  const addCategory = () => {
    const key = `cat_${Date.now()}`
    setCategories(prev => ([
      ...prev,
      { key, name: '', items: [] }
    ]))
    setSelectedCategoryKey(key)
  }

  const removeCategory = (index) => {
    setCategories(prev => {
      const remaining = prev.filter((_, i) => i !== index)
      setSelectedCategoryKey((remaining[0]?.key || remaining[0]?.name) || '')
      return remaining
    })
  }

  const addItem = (catIndex) => {
    const next = [...categories]
    const items = [...(next[catIndex].items || [])]
    items.push({ name: '', price: 0 })
    next[catIndex] = { ...next[catIndex], items }
    setCategories(next)
  }

  const removeItem = (catIndex, itemIndex) => {
    const next = [...categories]
    const items = [...(next[catIndex].items || [])]
    next[catIndex] = { ...next[catIndex], items: items.filter((_, i) => i !== itemIndex) }
    setCategories(next)
  }

  const normalizedCategories = useMemo(() => {
    return categories.map(cat => {
      const name = (cat.name || '').trim()
      const key = cat.key || name.toLowerCase().replace(/\s+/g, '_') || `cat_${Date.now()}`
      const items = (cat.items || [])
        .map(it => ({
          name: (it.name || '').trim(),
          price: Number(it.price || 0)
        }))
        .filter(it => it.name)
      return { key, name, items }
    }).filter(cat => cat.name)
  }, [categories])

  const selectedCategoryIndex = useMemo(() => {
    if (!selectedCategoryKey) return -1
    return categories.findIndex(c => (c.key || c.name) === selectedCategoryKey)
  }, [categories, selectedCategoryKey])

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryIndex === -1) {
      setSelectedCategoryKey((categories[0]?.key || categories[0]?.name) || '')
    }
  }, [categories, selectedCategoryIndex])

  const selectedCategory = selectedCategoryIndex >= 0 ? categories[selectedCategoryIndex] : null

  const filteredItems = useMemo(() => {
    const items = selectedCategory?.items || []
    if (!searchTerm.trim()) return items
    const q = searchTerm.trim().toLowerCase()
    return items.filter(it => (it.name || '').toLowerCase().includes(q))
  }, [selectedCategory, searchTerm])

  const onSave = async () => {
    if (normalizedCategories.length === 0) {
      toast.error('Add at least one category')
      return
    }
    setSaving(true)
    await updateLabCatalog(normalizedCategories)
    setSaving(false)
  }

  return (
    <div className='m-5 w-full'>
      <div className='flex items-center justify-between mb-4'>
        <p className='text-xl font-semibold text-gray-700'>Lab Catalog</p>
        <div className='flex items-center gap-2'>
          <button
            onClick={addCategory}
            className='bg-primary text-white px-4 py-2 rounded-lg text-sm'
          >
            Add Category
          </button>
          <button
            onClick={onSave}
            className='bg-violet-600 text-white px-4 py-2 rounded-lg text-sm'
          >
            {saving ? 'Saving...' : 'Save Catalog'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className='bg-white border rounded-xl p-6 text-sm text-gray-500'>Loading catalog...</div>
      ) : (
        <div className='space-y-4'>
          <div className='bg-white border rounded-xl p-5'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 items-end'>
              <div>
                <p className='text-xs text-gray-500 mb-1'>Category</p>
                <select
                  value={selectedCategoryKey}
                  onChange={(e) => setSelectedCategoryKey(e.target.value)}
                  className='w-full border rounded-lg px-3 py-2 text-sm'
                >
                  {categories.map((cat, idx) => (
                    <option key={cat.key || idx} value={cat.key || cat.name}>
                      {cat.name || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className='text-xs text-gray-500 mb-1'>Search Tests</p>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full border rounded-lg px-3 py-2 text-sm'
                  placeholder='Search by test name'
                />
              </div>
              <div className='flex items-center gap-2'>
                {selectedCategoryIndex >= 0 && (
                  <button
                    onClick={() => addItem(selectedCategoryIndex)}
                    className='px-3 py-2 rounded-lg text-sm bg-violet-600 text-white'
                  >
                    Add Item
                  </button>
                )}
                {selectedCategoryIndex >= 0 && (
                  <button
                    onClick={() => removeCategory(selectedCategoryIndex)}
                    className='px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600'
                  >
                    Remove Category
                  </button>
                )}
              </div>
            </div>

            {selectedCategory ? (
              <>
                <div className='mt-4'>
                  <p className='text-xs text-gray-500 mb-1'>Category Name</p>
                  <input
                    value={selectedCategory.name || ''}
                    onChange={(e) => onCategoryNameChange(selectedCategoryIndex, e.target.value)}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                    placeholder='e.g. Blood tests'
                  />
                </div>

                <div className='mt-4 space-y-3'>
                  {filteredItems.length === 0 ? (
                    <p className='text-xs text-gray-400'>No items found.</p>
                  ) : (
                    filteredItems.map((item, itemIndex) => {
                      const actualIndex = (selectedCategory.items || []).findIndex(
                        it => it === item
                      )
                      return (
                        <div key={itemIndex} className='grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3 items-center'>
                          <input
                            value={item.name || ''}
                            onChange={(e) => onItemChange(selectedCategoryIndex, actualIndex, 'name', e.target.value)}
                            className='border rounded-lg px-3 py-2 text-sm'
                            placeholder='Test name'
                          />
                          <input
                            type='number'
                            value={item.price ?? 0}
                            onChange={(e) => onItemChange(selectedCategoryIndex, actualIndex, 'price', e.target.value)}
                            className='border rounded-lg px-3 py-2 text-sm'
                            placeholder='Price'
                            min='0'
                          />
                          <button
                            onClick={() => removeItem(selectedCategoryIndex, actualIndex)}
                            className='px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-600'
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            ) : (
              <p className='text-sm text-gray-400 mt-4'>No category selected.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LabCatalog
