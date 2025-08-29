import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import Layout from '../components/Layout';
import { DollarSign, History, Package, Wallet } from 'lucide-react';

const creditPackages = [
  { id: 1, credits: 1, priceCents: 1000, description: '1 Crédito' }, // R$ 10,00
  { id: 3, credits: 3, priceCents: 2700, description: '3 Créditos (10% off)' }, // R$ 9,00/crédito
  { id: 5, credits: 5, priceCents: 4000, description: '5 Créditos (20% off)' }, // R$ 8,00/crédito
  { id: 10, credits: 10, priceCents: 7000, description: '10 Créditos (30% off)' }, // R$ 7,00/crédito
];

const formatCurrency = (cents) => {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Credits = () => {
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState(null); // null, 'pending', 'success', 'failed'
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBalanceAndTransactions();
    }
  }, [isAuthenticated, fetchUser]);

  const fetchUserBalanceAndTransactions = async () => {
    try {
      setLoading(true);
      // User balance is already in authStore, but we can refetch if needed
      // const userResponse = await api.get('/me'); 
      // console.log('User data from /me:', userResponse.data);
      
      const transactionsResponse = await api.get('/auth/me/credit-transactions');
      setTransactions(transactionsResponse.data.transactions);
    } catch (err) {
      console.error('Error fetching credits data:', err);
      setError('Erro ao carregar dados de créditos.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (credits, priceCents) => {
    setPurchaseStatus('pending');
    setError(null);
    try {
      const response = await api.post('/credits/checkout', { amountCredits: credits });
      const { paymentId, checkoutUrl: pspCheckoutUrl } = response.data;
      setCheckoutUrl(pspCheckoutUrl);
      setPurchaseStatus('success'); // In a real scenario, this would depend on PSP callback
      alert(`Compra iniciada! Payment ID: ${paymentId}. Redirecionando para: ${pspCheckoutUrl}`);
      // For simulation, just alert. In real app, redirect or show QR code
      // window.location.href = pspCheckoutUrl; 

      // After initiating, poll for status or rely on webhook/websocket
      // For MVP, user can refresh or we'll refetch on page load
      setTimeout(() => {
        fetchUserBalanceAndTransactions(); // Refresh data after a delay
        setPurchaseStatus(null);
        setCheckoutUrl(null);
      }, 5000); 

    } catch (err) {
      console.error('Error during credit purchase:', err);
      setError(err.response?.data?.error || 'Erro ao processar compra de créditos.');
      setPurchaseStatus('failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] py-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Acesso Negado</h2>
          <p className="text-lg text-gray-600 mb-8">Você precisa estar logado para acessar esta página.</p>
          <Link to="/login" className="btn-primary px-6 py-3 text-lg">Fazer Login</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Meus Créditos</h1>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-primary-600 to-emerald-600 text-white rounded-2xl shadow-lg p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Wallet className="w-10 h-10" />
            <div>
              <p className="text-sm opacity-90">Saldo Atual</p>
              <h2 className="text-4xl font-extrabold">{user?.balance || 0} Crédito{user?.balance === 1 ? '' : 's'}</h2>
            </div>
          </div>
          {user?.balance === 0 && (
             <button 
                onClick={() => document.getElementById('purchase_modal').showModal()}
                className="bg-white text-primary-700 hover:bg-gray-100 font-semibold py-2 px-5 rounded-full shadow-md transition-colors"
             >
                Comprar Créditos
             </button>
          )}
        </div>

        {/* Purchase Packages */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Comprar Pacotes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPackages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col items-center text-center">
                <Package className="w-12 h-12 text-primary-500 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">{pkg.credits} Crédito{pkg.credits === 1 ? '' : 's'}</h3>
                <p className="text-gray-600 mb-1">{pkg.description}</p>
                <p className="text-3xl font-bold text-primary-700 mb-4">{formatCurrency(pkg.priceCents)}</p>
                <button 
                  onClick={() => handlePurchase(pkg.credits, pkg.priceCents)}
                  className="w-full btn-primary py-2 px-4 text-lg"
                  disabled={purchaseStatus === 'pending'}
                >
                  {purchaseStatus === 'pending' ? 'Processando...' : 'Comprar'}
                </button>
              </div>
            ))}
          </div>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
          {purchaseStatus === 'pending' && <p className="text-blue-600 mt-4 text-center">Processando sua compra...</p>}
          {purchaseStatus === 'success' && checkoutUrl && (
            <p className="text-emerald-600 mt-4 text-center">
              Compra iniciada! Por favor, siga as instruções em <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="underline">{checkoutUrl}</a> para finalizar.
            </p>
          )}
        </section>

        {/* Transaction History */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Histórico de Transações</h2>
          {loading ? (
            <p className="text-gray-600">Carregando histórico...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-600">Nenhuma transação encontrada.</p>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créditos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.type}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{tx.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modal for purchase CTA when balance is zero - This modal won't show by default, but can be triggered by a parent component if needed */}
      <dialog id="purchase_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Você não tem créditos suficientes!</h3>
          <p className="py-4">Por favor, compre créditos para iniciar uma nova consulta.</p>
          <div className="modal-action">
            <form method="dialog">
              <Link to="/creditos" className="btn btn-primary mr-2">Comprar Créditos</Link>
              <button className="btn">Fechar</button>
            </form>
          </div>
        </div>
      </dialog>
    </Layout>
  );
};

export default Credits; 