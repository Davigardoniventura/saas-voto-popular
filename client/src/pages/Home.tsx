import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import EduCraciaChat from "@/components/EduCraciaChat";
import {
  CheckCircle,
  Lock,
  Users,
  BarChart3,
  ArrowRight,
  Shield,
  Zap,
  Globe,
} from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showSuperAdminHint, setShowSuperAdminHint] = useState(false);

  // Easter egg: clique 3 vezes no logo para acessar Super Admin
  let logoClickCount = 0;
  const handleLogoClick = () => {
    logoClickCount++;
    if (logoClickCount === 3) {
      setShowSuperAdminHint(true);
      logoClickCount = 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={handleLogoClick}
              title="Clique 3 vezes para acessar Super Admin"
            >
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-auto" />}
              <span className="text-2xl font-bold text-blue-600">{APP_TITLE}</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-slate-600">Bem-vindo, {user?.name}</span>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    Entrar
                  </Button>
                  <Button
                    onClick={() => navigate("/register")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Cadastrar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Participação Cidadã
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Segura e Transparente
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Voto Popular é uma plataforma legislativa moderna que conecta cidadãos, vereadores e
            administradores municipais em um ambiente seguro e democrático.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6 px-8 rounded-lg"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="text-lg py-6 px-8 rounded-lg border-2 border-slate-300"
            >
              Já tenho conta
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 hover:bg-white">
            <CheckCircle className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Votação Segura</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Sistema de votação criptografado com verificação de identidade por CPF.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 hover:bg-white">
            <Lock className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Máxima Segurança</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Arquitetura multi-tenant com isolamento completo de dados por município.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 hover:bg-white">
            <Users className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Gestão de Usuários</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Hierarquia clara: Cidadão, Vereador, Admin e Super Admin com acesso granular.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 hover:bg-white">
            <BarChart3 className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Relatórios</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Geração de relatórios PDF consolidados e análise de propostas em tempo real.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-20 text-center">Como Funciona</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                number: 1,
                title: "Cadastro Seguro",
                description:
                  "Cidadãos se registram com CPF, data de nascimento e CEP para verificação de identidade.",
                icon: Shield,
              },
              {
                number: 2,
                title: "Propostas Legislativas",
                description:
                  "Vereadores criam propostas que são moderadas pelos administradores municipais.",
                icon: Zap,
              },
              {
                number: 3,
                title: "Votação Participativa",
                description:
                  "Cidadãos votam em propostas aprovadas de seu município de forma segura e verificada.",
                icon: Globe,
              },
              {
                number: 4,
                title: "Relatórios e Análise",
                description:
                  "Gere relatórios consolidados e acompanhe o progresso das propostas em tempo real.",
                icon: BarChart3,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 font-bold text-xl mx-auto mb-4">
                    {item.number}
                  </div>
                  <Icon className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-4xl font-bold text-slate-900 mb-20 text-center">
          Recursos Principais
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Validação Robusta de CPF
                </h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Algoritmo oficial de validação do CPF brasileiro com detecção de fraudes.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Imutabilidade de Dados
                </h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  CPF, data de nascimento e CEP não podem ser alterados após o primeiro login.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Rate Limiting Inteligente
                </h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Proteção contra força bruta com limite de 5 tentativas a cada 15 minutos.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Verificação de Jurisdição
                </h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Cidadãos só veem propostas de seu município baseado no CEP cadastrado.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Personalização por Cidade
                </h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Super Admin pode personalizar cores, logos e temas para cada município.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Logs de Auditoria
                </h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Todas as ações críticas são registradas para rastreabilidade completa.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Relatórios em PDF
                </h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Gere relatórios consolidados de propostas com estatísticas detalhadas.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Proteção OWASP Top 10
                </h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Implementação de segurança contra as vulnerabilidades mais comuns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Pronto para Participar?</h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Cadastre-se agora e comece a fazer parte da democracia participativa.
          </p>
          <Button
            onClick={() => navigate("/register")}
            className="bg-white hover:bg-slate-100 text-blue-600 text-lg py-6 px-8 rounded-lg font-semibold"
          >
            Cadastrar Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* EduCracia Chatbot */}
      <EduCraciaChat context="citizen" />

      {/* Super Admin Hint */}
      {showSuperAdminHint && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded-lg shadow-lg max-w-xs z-50">
          <p className="text-sm mb-3">
            🔐 Acesso Super Admin detectado. Deseja acessar o painel administrativo?
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/superadmin/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3"
            >
              Acessar
            </Button>
            <Button
              onClick={() => setShowSuperAdminHint(false)}
              variant="outline"
              className="text-white border-slate-600 text-sm py-1 px-3"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-white font-semibold mb-4">Sobre</h3>
              <p className="text-sm leading-relaxed">
                Voto Popular é uma plataforma de participação cidadã segura e democrática.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentação
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Suporte
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Termos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Segurança
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contato</h3>
              <p className="text-sm">
                <a href="mailto:contato@votopopular.com.br" className="hover:text-white transition-colors">
                  contato@votopopular.com.br
                </a>
              </p>
              <p className="text-sm mt-2">(31) 3000-0000</p>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 text-center">
            <p className="text-sm">© 2025 Voto Popular. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
