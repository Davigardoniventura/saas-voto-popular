import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import EduCraciaChat from "@/components/EduCraciaChat";
import { useLocation } from "wouter";
import { LogOut, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">(
    "pending"
  );

  const { data: proposals, isLoading } = trpc.proposals.getAllProposalsForAdmin.useQuery(
    { municipalityId: user?.municipalityId?.toString() || "" },
    { enabled: !!user?.municipalityId }
  );

  const approveMutation = trpc.proposals.approveProposal.useMutation();
  const rejectMutation = trpc.proposals.rejectProposal.useMutation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleApprove = async (proposalId: string) => {
    try {
      await approveMutation.mutateAsync({
        proposalId,
        municipalityId: user?.municipalityId?.toString() || "",
      });
      alert("Proposta aprovada com sucesso!");
    } catch (error: any) {
      alert("Erro ao aprovar proposta: " + error.message);
    }
  };

  const handleReject = async (proposalId: string) => {
    const reason = prompt("Motivo da rejeição:");
    if (!reason) return;

    try {
      await rejectMutation.mutateAsync({
        proposalId,
        municipalityId: user?.municipalityId?.toString() || "",
        reason,
      });
      alert("Proposta rejeitada com sucesso!");
    } catch (error: any) {
      alert("Erro ao rejeitar proposta: " + error.message);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-red-600 font-bold">Acesso negado. Apenas administradores podem acessar.</p>
        </Card>
      </div>
    );
  }

  const filteredProposals = proposals?.filter((p) => {
    if (filterStatus === "all") return true;
    return p.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* EduCracia Chatbot para Admin */}
      <EduCraciaChat context="admin" />
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel do Administrador</h1>
            <p className="text-sm text-gray-600">{user.name}</p>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-3xl font-bold text-gray-900">
              {proposals?.filter((p) => p.status === "pending").length || 0}
            </div>
            <p className="text-sm text-gray-600">Propostas Pendentes</p>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-green-600">
              {proposals?.filter((p) => p.status === "approved").length || 0}
            </div>
            <p className="text-sm text-gray-600">Propostas Aprovadas</p>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-red-600">
              {proposals?.filter((p) => p.status === "rejected").length || 0}
            </div>
            <p className="text-sm text-gray-600">Propostas Rejeitadas</p>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {proposals?.length || 0}
            </div>
            <p className="text-sm text-gray-600">Total de Propostas</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status === "all" && "Todas"}
              {status === "pending" && "Pendentes"}
              {status === "approved" && "Aprovadas"}
              {status === "rejected" && "Rejeitadas"}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">Carregando propostas...</p>
            </Card>
          ) : filteredProposals && filteredProposals.length > 0 ? (
            filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{proposal.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {proposal.status === "pending" && (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    {proposal.status === "approved" && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {proposal.status === "rejected" && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      proposal.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : proposal.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }`}>
                      {proposal.status === "pending" && "Pendente"}
                      {proposal.status === "approved" && "Aprovada"}
                      {proposal.status === "rejected" && "Rejeitada"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{proposal.voteCount} votos</span>
                  <span>{new Date(proposal.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>

                {proposal.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(proposal.proposalId)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleReject(proposal.proposalId)}
                      variant="outline"
                      className="flex-1"
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-600">Nenhuma proposta encontrada.</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
