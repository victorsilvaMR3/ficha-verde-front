import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Stethoscope, Video, CreditCard, FileText, Users, Clock, Shield, HeartPulse, CalendarDays } from 'lucide-react'

const Home = () => {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50">
      {/* Announcement Bar */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-center text-sm font-medium">
          Saúde sem fila. Cuidado de verdade.
        </div>
      </div>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link to="#" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Ficha Verde" className="w-9 h-9 rounded-lg shadow-sm" />
              <span className="text-xl font-bold tracking-tight text-gray-900">Ficha Verde</span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
              <a href="#sobre" className="hover:text-gray-900 transition-colors">Sobre</a>
              <a href="#beneficios" className="hover:text-gray-900 transition-colors">Benefícios</a>
              <a href="#avaliacoes" className="hover:text-gray-900 transition-colors">Avaliações</a>
              <a href="#planos" className="hover:text-gray-900 transition-colors">Planos</a>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="inline-flex items-center rounded-full bg-primary-600 text-white px-4 py-2 text-sm font-semibold shadow hover:bg-primary-700 transition-colors">Minha Conta</Link>
              ) : (
                <Link to="/login" className="inline-flex items-center rounded-full bg-primary-600 text-white px-4 py-2 text-sm font-semibold shadow hover:bg-primary-700 transition-colors">Entrar</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="sobre" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Coluna de texto */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Sua saúde no mesmo ritmo da sua vida.
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Conecte-se com um médico em poucos cliques — rápido, sem filas e sem burocracia.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated && user?.role === 'PATIENT' ? (
                  <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
                    Iniciar Consulta
                  </Link>
                ) : (
                  <Link to="/register" className="btn-primary text-lg px-8 py-3">
                    Iniciar Consulta
                  </Link>
                )}
                <a href="#beneficios" className="btn-secondary text-lg px-8 py-3">Conheça</a>
              </div>
            </div>

            {/* Coluna de imagem */}
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-14 h-14 bg-primary-600/90 rounded-2xl shadow-md flex items-center justify-center text-white">+
              </div>
              <img
                src="/doctor-hero.jpg"
                alt="Médico sorridente pronto para atender"
                className="rounded-3xl shadow-xl ring-1 ring-black/5 object-cover object-top w-full h-[300px] md:h-[360px] lg:h-[380px]"
                loading="eager"
              />
              <div className="absolute -bottom-6 -right-6 w-14 h-14 bg-emerald-500/90 rounded-2xl shadow-md flex items-center justify-center text-white">❤
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Principais <span className="text-primary-600">Benefícios</span>
            </h2>
            <p className="text-gray-600 mt-2">Descubra o que torna a nossa clínica a escolha certa!</p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
            {/* Imagem destaque + card grande */}
            <div className="space-y-8">
              <img
                src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=1200&auto=format&fit=crop"
                alt="Profissional atendendo paciente"
                className="rounded-2xl shadow ring-1 ring-black/5 object-cover w-full h-64"
              />
              <div className="bg-gray-50 rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Atendimento de qualidade</h3>
                    <p className="text-gray-600 mt-2">
                      Equipe médica altamente qualificada, pronta para oferecer o melhor cuidado em todas as etapas do seu tratamento.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grade de benefícios + CTA */}
            <div className="grid md:grid-rows-2 gap-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                    <HeartPulse className="w-5 h-5 text-primary-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Foco no paciente</h4>
                  <p className="text-gray-600 mt-2">Consultas personalizadas com diagnóstico preciso e foco no bem-estar.</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                    <CalendarDays className="w-5 h-5 text-primary-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Agendamento facilitado</h4>
                  <p className="text-gray-600 mt-2">Processo ágil e acompanhamento contínuo da sua saúde.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                    <Shield className="w-5 h-5 text-primary-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Atenção aos detalhes</h4>
                  <p className="text-gray-600 mt-2">Tecnologia de ponta, conforto e cuidado em cada etapa.</p>
                </div>
                <div className="bg-gradient-to-br from-primary-600 to-emerald-600 text-white rounded-2xl p-6 shadow-sm">
                  <h4 className="text-lg font-semibold">Fale conosco e descubra como podemos cuidar melhor de você.</h4>
                  <Link to="#contato" className="inline-flex mt-4 items-center rounded-full bg-white text-primary-700 px-4 py-2 text-sm font-semibold shadow hover:bg-gray-100 transition-colors">
                    Conheça
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              O que nossos pacientes dizem
            </h2>
            <p className="text-gray-600">Depoimentos reais com fotos geradas por IA</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[{
              name: 'Ana Paula',
              text: 'Atendimento rápido e humano. Resolvi meu problema sem sair de casa.',
              rating: 5,
              avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AnaPaula&backgroundType=gradientLinear'
            },{
              name: 'Carlos Eduardo',
              text: 'Experiência excelente! Qualidade de vídeo ótima e receita no email em minutos.',
              rating: 5,
              avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CarlosEduardo&backgroundType=gradientLinear'
            },{
              name: 'Mariana Silva',
              text: 'Plataforma simples e segura. Recomendo para consultas básicas.',
              rating: 4,
              avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MarianaSilva&backgroundType=gradientLinear'
            }].map((t, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center space-x-4 mb-4">
                  <img src={t.avatar} alt={t.name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary-100" />
                  <div>
                    <div className="font-semibold text-gray-900">{t.name}</div>
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < t.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">“{t.text}”</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section id="app" className="pt-[80px] pb-0 md:pt-[80px] md:pb-0 mb-40 md:mb-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-5xl mx-auto rounded-xl bg-gradient-to-br from-primary-700 to-emerald-700 text-white px-4 py-0 md:px-10 md:py-0 shadow-xl overflow-visible h-[500px]">
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
              {/* Mockup do telefone */}
              <div className="flex justify-center md:justify-center">
                <div className="relative w-[200px] md:w-[280px] aspect-[9/19] -mt-16 md:-mt-20 mb-[-72px] md:mb-[-108px]">
                  {/* Moldura do iPhone */}
                  <div className="absolute inset-0 rounded-[2.2rem] bg-gray-900 shadow-2xl ring-1 ring-black/40"></div>
                  {/* Notch/câmera */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 h-6 w-28 bg-black/70 rounded-b-2xl"></div>
                  {/* Tela */}
                  <div className="absolute inset-2 rounded-[1.9rem] bg-white overflow-hidden">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 360 780"
                      className="w-full h-full"
                      aria-label="Simulação do app em uso"
                    >
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#16a34a" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                      <rect width="360" height="780" fill="#f8fafc" />
                      <rect x="0" y="0" width="360" height="64" fill="url(#g1)" />
                      <circle cx="28" cy="32" r="10" fill="#ffffff" opacity="0.9" />
                      <text x="48" y="38" fontFamily="Inter, sans-serif" fontSize="16" fill="#ffffff" fontWeight="700">Consulta em andamento</text>
                      <rect x="16" y="80" width="328" height="240" rx="16" fill="#111827" />
                      <text x="180" y="205" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="14" fill="#9ca3af">Vídeo do paciente</text>
                      <rect x="16" y="336" width="156" height="90" rx="12" fill="#ffffff" stroke="#e5e7eb" />
                      <text x="32" y="362" fontFamily="Inter, sans-serif" fontSize="12" fill="#111827" fontWeight="600">Próximo passo</text>
                      <text x="32" y="382" fontFamily="Inter, sans-serif" fontSize="11" fill="#6b7280">Prescrever com Memed</text>
                      <rect x="188" y="336" width="156" height="90" rx="12" fill="#ffffff" stroke="#e5e7eb" />
                      <text x="204" y="362" fontFamily="Inter, sans-serif" fontSize="12" fill="#111827" fontWeight="600">Evolução</text>
                      <text x="204" y="382" fontFamily="Inter, sans-serif" fontSize="11" fill="#6b7280">Rascunho salvo</text>
                      <rect x="16" y="442" width="220" height="36" rx="18" fill="#e5e7eb" />
                      <text x="28" y="465" fontFamily="Inter, sans-serif" fontSize="12" fill="#111827">Olá, como posso ajudar hoje?</text>
                      <rect x="132" y="486" width="212" height="36" rx="18" fill="#16a34a" />
                      <text x="144" y="509" fontFamily="Inter, sans-serif" fontSize="12" fill="#ffffff">Estou com dor de cabeça desde ontem.</text>
                      <rect x="0" y="708" width="360" height="72" fill="#ffffff" stroke="#e5e7eb" />
                      <circle cx="120" cy="744" r="20" fill="#ef4444" />
                      <rect x="112" y="742" width="16" height="4" rx="2" fill="#ffffff" />
                      <circle cx="180" cy="744" r="20" fill="#111827" />
                      <circle cx="180" cy="744" r="6" fill="#ffffff" />
                      <circle cx="240" cy="744" r="20" fill="#111827" />
                      <rect x="234" y="740" width="12" height="8" rx="2" fill="#ffffff" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="mt-8 md:mt-14 px-4 md:px-8">
                <h3 className="text-2xl md:text-3xl font-extrabold leading-tight">Seus cuidados na palma da mão</h3>
                <p className="mt-4 text-emerald-50/90 text-base md:text-lg">
                  Agende, acompanhe e consulte com poucos cliques. Acesso rápido a médicos, histórico de atendimentos e
                  notificações em tempo real — tudo em um único app.
                </p>
                <ul className="mt-6 space-y-2 text-emerald-50/90">
                  <li>• Agendamentos e lembretes inteligentes</li>
                  <li>• Receitas e atestados no seu dispositivo</li>
                  <li>• Suporte e notificações instantâneas</li>
                </ul>
                <div className="mt-8 flex items-center gap-3 sm:gap-4 flex-wrap">
                  <a href="#" aria-label="Baixar no Google Play" className="inline-flex h-[60px] w-[200px] items-center justify-center overflow-hidden rounded-xl bg-transparent">
                    <img src="https://play.google.com/intl/pt-BR/badges/static/images/badges/pt-br_badge_web_generic.png" alt="Disponível no Google Play" className="h-full w-full object-contain" />
                  </a>
                  <a href="#" aria-label="Baixar na App Store" className="inline-flex h-[60px] w-[200px] items-center justify-center overflow-hidden rounded-xl bg-transparent [filter:brightness(0.92)]">
                    <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/pt-br-pt-br?size=250x83&releaseDate=1314230400" alt="Baixar na App Store" className="h-full w-full object-contain" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-20 pb-[120px] bg-primary-600 mb-40 md:mb-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para sua consulta?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Cadastre-se agora e tenha acesso a consultas médicas online
          </p>
          
          {!isAuthenticated && (
            <Link 
              to="/register" 
              className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg text-lg transition-colors duration-200"
            >
              Começar Agora
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Ficha Verde</span>
            </div>
            <p className="text-gray-400">
              © 2024 Ficha Verde. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home 