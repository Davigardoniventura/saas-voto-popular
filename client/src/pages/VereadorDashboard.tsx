import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import EduCraciaChat from "@/components/EduCraciaChat";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { LogOut, Plus, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function VereadorDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const { data: proposals, isLoading } = trpc.proposals.getMyProposals.useQuery();
  const createMutation = trpc.proposals.createProposal.useMutation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error("Por favor, preencha o título e a descrição da proposta.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        municipalityId: user?.municipalityId?.toString() || "",
      });

      setFormData({ title: "", description: "" });
      setShowCreateForm(false);
      toast.success("Proposta criada com sucesso! Ela está pendente de moderação.");
    } catch (error: any) {
      toast.error("Erro ao criar proposta: " + (error.message || "Erro desconhecido."));
    }
  };

  if (!user || (user.role !== "vereador" && user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-red-600 font-bold">
            Acesso negado. Apenas vereadores podem acessar.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* EduCracia Chatbot para Vereador */}
      <EduCraciaChat context="vereador" />
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel do Vereador</h1>
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

        {/* Create Proposal Section */}
        <Card className="mb-8 p-6">
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Criar Nova Proposta
            </Button>
          ) : (
            <form onSubmit={handleCreateProposal} className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Nova Proposta</h2>

              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Título da proposta"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  placeholder="Descrição detalhada da proposta"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 mt-2"
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Criando..." : "Criar Proposta"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Proposals List */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Minhas Propostas
          </h2>

          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600">Carregando propostas...</p>
              </Card>
            ) : proposals && proposals.length > 0 ? (
              proposals.map((proposal) => (
                <Card key={proposal.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{proposal.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                    </div>
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ml-4 ${
                        proposal.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : proposal.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {proposal.status === "pending" && "Pendente"}
                      {proposal.status === "approved" && "Aprovada"}
                      {proposal.status === "rejected" && "Rejeitada"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{proposal.voteCount} votos</span>
                    <span>{new Date(proposal.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Você ainda não criou nenhuma proposta.</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
