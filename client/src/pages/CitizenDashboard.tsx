import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { LogOut, FileText, Vote } from "lucide-react";

export default function CitizenDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const { data: proposals, isLoading } = trpc.proposals.getApprovedProposals.useQuery(
    { municipalityId: user?.municipalityId?.toString() || "" },
    { enabled: !!user?.municipalityId }
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voto Popular</h1>
            <p className="text-sm text-gray-600">Bem-vindo, {user.name}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* User Info Card */}
        <Card className="mb-8 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informações da Conta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nome</p>
              <p className="text-base font-medium text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-base font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CPF</p>
              <p className="text-base font-medium text-gray-900">
                {user.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CEP</p>
              <p className="text-base font-medium text-gray-900">
                {user.zipCode?.replace(/(\d{5})(\d{3})/, "$1-$2") || "N/A"}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Nota: CPF, data de nascimento e CEP não podem ser alterados após o primeiro cadastro.
          </p>
        </Card>

        {/* Proposals Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Propostas Disponíveis para Votação
          </h2>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando propostas...</p>
            </div>
          ) : proposals && proposals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{proposal.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{proposal.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {proposal.voteCount} votos
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <Button
                    onClick={() => navigate(`/proposal/${proposal.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Ver Proposta e Votar
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma proposta aprovada disponível no momento.</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
