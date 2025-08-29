import { useState } from 'react'
import toast from 'react-hot-toast'

// Placeholder for future Memed integration
// Intended flow: add items -> validate -> send to Memed API -> persist URL/id
const PrescriptionForm = ({ onSubmit }) => {
  const [items, setItems] = useState([{ name: '', dosage: '', instructions: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (index, field, value) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it))
  }

  const addItem = () => {
    setItems(prev => [...prev, { name: '', dosage: '', instructions: '' }])
  }

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const filtered = items.filter(i => i.name.trim())
      if (filtered.length === 0) {
        toast.error('Adicione pelo menos um item')
        return
      }
      onSubmit && onSubmit(filtered)
      toast.success('Receita preparada (integração Memed em breve)')
    } catch (error) {
      toast.error('Erro ao preparar receita')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-200">Medicamento</label>
              <input
                value={item.name}
                onChange={(e) => handleChange(index, 'name', e.target.value)}
                className="w-full rounded-md bg-gray-800 text-white p-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nome / princípio ativo"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-200">Posologia</label>
              <input
                value={item.dosage}
                onChange={(e) => handleChange(index, 'dosage', e.target.value)}
                className="w-full rounded-md bg-gray-800 text-white p-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex.: 1 cp 8/8h"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-200">Instruções</label>
              <input
                value={item.instructions}
                onChange={(e) => handleChange(index, 'instructions', e.target.value)}
                className="w-full rounded-md bg-gray-800 text-white p-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Duração, horários, etc."
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="w-full md:w-auto px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                disabled={items.length === 1}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <button
          type="button"
          onClick={addItem}
          className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white"
        >
          Adicionar medicamento
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white"
        >
          {isSubmitting ? 'Gerando...' : 'Preparar receita'}
        </button>
      </div>
    </form>
  )
}

export default PrescriptionForm


