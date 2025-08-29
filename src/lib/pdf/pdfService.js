// Simple PDF export stub. Replace with pdfmake/react-pdf implementation later.

export const pdfService = {
  async exportEvolution({ consultationId, content }) {
    const blob = new Blob([`Evolução - Consulta ${consultationId}\n\n${content}`], { type: 'text/plain' })
    downloadBlob(blob, `evolucao_${consultationId}.txt`)
  },
  async exportPrescription({ consultationId, items }) {
    const text = items.map((i, idx) => `${idx + 1}. ${i.name} - ${i.dosage} - ${i.instructions}`).join('\n')
    const blob = new Blob([`Receita - Consulta ${consultationId}\n\n${text}`], { type: 'text/plain' })
    downloadBlob(blob, `receita_${consultationId}.txt`)
  },
  async exportCertificate({ consultationId, certificate }) {
    const body = JSON.stringify(certificate, null, 2)
    const blob = new Blob([`Atestado - Consulta ${consultationId}\n\n${body}`], { type: 'text/plain' })
    downloadBlob(blob, `atestado_${consultationId}.txt`)
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}


