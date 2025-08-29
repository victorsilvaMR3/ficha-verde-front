import { useState } from 'react'
import toast from 'react-hot-toast'

// Placeholder for future Memed integration
// Intended flow: fill fields -> preview -> send to Memed API -> persist URL/id
const MedicalCertificateForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    patientName: '',
    diagnosis: '',
    restDays: '',
    observations: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // For now only notify; backend endpoint will be added with Memed
      onSubmit && onSubmit(form)
      toast.success('Atestado preparado (integração Memed em breve)')
    } catch (error) {
      toast.error('Erro ao preparar atestado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-200">Nome do paciente</label>
        <input
          name="patientName"
          value={form.patientName}
          onChange={handleChange}
          className="w-full rounded-md bg-gray-800 text-white p-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Nome completo"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-200">Diagnóstico</label>
        <input
          name="diagnosis"
          value={form.diagnosis}
          onChange={handleChange}
          className="w-full rounded-md bg-gray-800 text-white p-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="CID / descrição"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-200">Dias de afastamento</label>
          <input
            name="restDays"
            type="number"
            min="0"
            value={form.restDays}
            onChange={handleChange}
            className="w-full rounded-md bg-gray-800 text-white p-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-200">Observações</label>
        <textarea
          name="observations"
          value={form.observations}
          onChange={handleChange}
          className="w-full h-24 rounded-md bg-gray-800 text-white p-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Detalhes adicionais..."
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white"
        >
          {isSubmitting ? 'Gerando...' : 'Preparar atestado'}
        </button>
      </div>
    </form>
  )
}

export default MedicalCertificateForm


