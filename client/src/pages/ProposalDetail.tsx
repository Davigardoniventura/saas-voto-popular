import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, ThumbsUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProposalDetailProps {
  params?: { id: string };
}

export default function ProposalDetail() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [hasVoted, setHasVoted] = useState(false);

  // Obter ID da URL
  const pathParts = window.location.pathname.split("/");
  const proposalId = pathParts[pathParts.length - 1];

  // Queries e mutations
  const { data: proposals, isLoading } = trpc.proposals.getApprovedProposals.useQuery(
    { municipalityId: user?.municipalityId?.toString() || "" },
    { enabled: !!user?.municipalityId }
  );

  const voteMutation = trpc.votes.voteOnProposal.useMutation();
  const checkVoteMutation = trpc.votes.hasUserVoted.useQuery(
    { proposalId: parseInt(proposalId) },
    { enabled: !!user && user.role === "citizen" }
  );

  // Encontrar a proposta
  const proposal = proposals?.find((p) => p.proposalId === proposalId);

  const handleVote = async () => {
    if (!user || user.role !== "citizen") {
      toast.error("Apenas cidadãos podem votar");
      return;
    }

    try {
      await voteMutation.mutateAsync({
        proposalId: parseInt(proposalId),
        municipalityId: user.municipalityId?.toString() || "",
      });

      setHasVoted(true);
      toast.success("Seu voto foi registrado com sucesso!");
    } catch (error: any) {
      if (error.message.includes("já votou")) {
        toast.error("Você já votou nesta proposta");
      } else {
        toast.error("Erro ao registrar voto: " + (error.message || "Erro desconhecido"));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-slate-600">Carregando proposta...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Card className="p-8 text-center">
            <p className="text-red-600 font-semibold">Proposta não encontrada</p>
          </Card>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "Pendente" },
    approved: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", label: "Aprovada" },
    rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Rejeitada" },
    archived: { icon: Clock, color: "text-slate-600", bg: "bg-slate-50", label: "Arquivada" },
  };

  const status = statusConfig[proposal.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <Card className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{proposal.title}</h1>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${status.bg}`}>
                    <StatusIcon className={`h-5 w-5 ${status.color}`} />
                    <span className={`font-semibold ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-900">{proposal.voteCount}</span> votos
                  </div>
                  <div className="text-slate-600">
                    {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 pb-8 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Descrição</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{proposal.description}</p>
            </div>

            {/* Vote Section */}
            {proposal.status === "approved" && user?.role === "citizen" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5" />
                  Participar da Votação
                </h3>
                <p className="text-blue-800 mb-6">
                  Esta proposta está aberta para votação. Clique no botão abaixo para registrar seu voto.
                </p>
                <Button
                  onClick={handleVote}
                  disabled={voteMutation.isPending || checkVoteMutation.data}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
                >
                  {voteMutation.isPending ? (
                    "Registrando voto..."
                  ) : checkVoteMutation.data ? (
                    "✓ Você já votou"
                  ) : (
                    <>
                      <ThumbsUp className="h-5 w-5 mr-2" />
                      Votar Nesta Proposta
                    </>
                  )}
                </Button>
              </div>
            )}

            {proposal.status !== "approved" && (
              <div className="bg-slate-100 border border-slate-300 rounded-lg p-6 text-center">
                <p className="text-slate-600">
                  Esta proposta não está disponível para votação no momento.
                </p>
              </div>
            )}

            {user?.role !== "citizen" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <p className="text-amber-800">
                  Apenas cidadãos podem votar em propostas.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Related Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Informações da Proposta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-2">ID da Proposta</p>
              <p className="font-mono text-slate-900">{proposal.proposalId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Criada em</p>
              <p className="text-slate-900">
                {new Date(proposal.createdAt).toLocaleDateString("pt-BR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Total de Votos</p>
              <p className="text-2xl font-bold text-blue-600">{proposal.voteCount}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
