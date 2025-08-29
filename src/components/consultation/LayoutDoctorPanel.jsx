import EvolucaoEditor from '../evolucao/EvolucaoEditor'
import ReceitaForm from '../receita/ReceitaForm'
import AtestadoForm from '../atestado/AtestadoForm'
import { useConsultationStore } from '../../lib/state/consultationStore'
import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Button } from '../ui/button'
import PatientHistoryPanel from './PatientHistoryPanel'

const LayoutDoctorPanel = ({ consultation }) => {
  const { activeModule, setActiveModule, loadFromStorage, drafts } = useConsultationStore()
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const [selectedHistoryEvolution, setSelectedHistoryEvolution] = useState(undefined)

  useEffect(() => {
    if (consultation?.id) loadFromStorage(consultation.id)
  }, [consultation?.id, loadFromStorage])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <Tabs value={activeModule} onValueChange={setActiveModule}>
          <TabsList className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-1 inline-flex">
            <TabsTrigger value="EVOLUCAO" active={activeModule === 'EVOLUCAO'} onClick={() => setActiveModule('EVOLUCAO')} className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-md px-3 py-1.5">Evolução</TabsTrigger>
            <TabsTrigger value="RECEITA" active={activeModule === 'RECEITA'} onClick={() => setActiveModule('RECEITA')} className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-md px-3 py-1.5">Receita</TabsTrigger>
            <TabsTrigger value="ATESTADO" active={activeModule === 'ATESTADO'} onClick={() => setActiveModule('ATESTADO')} className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-md px-3 py-1.5">Atestado</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className={`grid grid-cols-1 ${activeModule === 'EVOLUCAO' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
          <div className="lg:col-span-2">
            {activeModule === 'EVOLUCAO' && (
              <EvolucaoEditor
                consultationId={consultation?.id}
                onFinalized={() => setHistoryRefresh((v) => v + 1)}
                externalValue={selectedHistoryEvolution}
                onRequestNew={() => {
                  setActiveModule('EVOLUCAO')
                  setSelectedHistoryEvolution(undefined)
                }}
              />
            )}
            {activeModule === 'RECEITA' && (
              <ReceitaForm consultationId={consultation?.id} />
            )}
            {activeModule === 'ATESTADO' && (
              <AtestadoForm consultationId={consultation?.id} />
            )}
          </div>
          {activeModule === 'EVOLUCAO' && (
            <aside className="lg:col-span-1">
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                <div className="text-sm font-semibold text-gray-900 mb-2">Histórico do paciente</div>
                <PatientHistoryPanel
                  patientId={consultation?.patientId}
                  refreshToken={historyRefresh}
                  onSelect={(item) => {
                    if (item.type === 'EVOLUTION') {
                      setActiveModule('EVOLUCAO')
                      setSelectedHistoryEvolution(item.content || '')
                    }
                  }}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

export default LayoutDoctorPanel


