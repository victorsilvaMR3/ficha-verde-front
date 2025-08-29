// Stub client for Memed integration

export const memedClient = {
  async authenticate() {
    // TODO: integrate real auth
    return { token: 'stub-token', expiresAt: Date.now() + 3600_000 }
  },
  async searchDrugs(q) {
    // TODO: call real Memed API
    return [
      { id: '1', name: `Dipirona 500mg - match(${q})` },
      { id: '2', name: `Paracetamol 750mg - match(${q})` }
    ]
  },
  async createPrescription(payload) {
    // TODO: send payload to Memed and return signed URL/id
    return { id: `rx_${Date.now()}`, url: `https://memed.example/prescription/${Date.now()}` }
  }
}


