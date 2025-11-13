import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import EduCraciaChat from "@/components/EduCraciaChat";
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewMunicipalityForm, setShowNewMunicipalityForm] = useState(false);
  const [newMunicipality, setNewMunicipality] = useState({
    id: "",
    nome: "",
    logoUrl: "",
    corPrimaria: "#0066cc",
    corSecundaria: "#f0f0f0",
  });

  // HOOK: Listar todos os municípios
  const { data: municipios, isLoading, error, refetch } = trpc.municipio.listAll.useQuery();

  // HOOK: Criar novo município
  const createMutation = trpc.municipio.createMunicipio.useMutation({
    onSuccess: () => {
      toast.success("Município criado com sucesso!");
      setNewMunicipality({
        id: "",
        nome: "",
        logoUrl: "",
        corPrimaria: "#0066cc",
        corSecundaria: "#f0f0f0",
      });
      setShowNewMunicipalityForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar município: ${error.message}`);
    },
  });

  const filteredMunicipalities = municipios?.filter(
    (m) =>
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddMunicipality = () => {
    if (!newMunicipality.id || !newMunicipality.nome) {
      toast.error("Preencha todos os campos obrigatórios (ID e Nome)");
      return;
    }

    // Validar formato do ID (slug)
    const idRegex = /^[a-z0-9-]+$/;
    if (!idRegex.test(newMunicipality.id)) {
      toast.error("ID deve conter apenas letras minúsculas, números e hífens (ex: muriae-mg)");
      return;
    }

    createMutation.mutate({
      id: newMunicipality.id,
      nome: newMunicipality.nome,
      logoUrl: newMunicipality.logoUrl || undefined,
      corPrimaria: newMunicipality.corPrimaria,
      corSecundaria: newMunicipality.corSecundaria,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* EduCracia Chatbot para Super Admin */}
      <EduCraciaChat context="superadmin" />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Painel Super Admin</h1>
              <p className="text-slate-600 mt-1">Gerenciamento de Clientes (Municípios)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                {municipios?.length || 0} Municípios
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Search and Add */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar município por nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setShowNewMunicipalityForm(!showNewMunicipalityForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Município
            </Button>
          </div>

          {/* New Municipality Form */}
          {showNewMunicipalityForm && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Adicionar Novo Cliente (Município)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id" className="text-slate-700 mb-2 block">
                    ID do Município (slug) *
                  </Label>
                  <Input
                    id="id"
                    placeholder="Ex: muriae-mg"
                    value={newMunicipality.id}
                    onChange={(e) =>
                      setNewMunicipality({ 
                        ...newMunicipality, 
                        id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                      })
                    }
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Apenas letras minúsculas, números e hífens
                  </p>
                </div>
                <div>
                  <Label htmlFor="nome" className="text-slate-700 mb-2 block">
                    Nome do Município *
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Prefeitura de Muriaé"
                    value={newMunicipality.nome}
                    onChange={(e) =>
                      setNewMunicipality({ ...newMunicipality, nome: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl" className="text-slate-700 mb-2 block">
                    URL do Logo (opcional)
                  </Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://exemplo.com/logo.png"
                    value={newMunicipality.logoUrl}
                    onChange={(e) =>
                      setNewMunicipality({ ...newMunicipality, logoUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="corPrimaria" className="text-slate-700 mb-2 block">
                    Cor Primária
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="corPrimaria"
                      type="color"
                      value={newMunicipality.corPrimaria}
                      onChange={(e) =>
                        setNewMunicipality({ ...newMunicipality, corPrimaria: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={newMunicipality.corPrimaria}
                      onChange={(e) =>
                        setNewMunicipality({ ...newMunicipality, corPrimaria: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="corSecundaria" className="text-slate-700 mb-2 block">
                    Cor Secundária
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="corSecundaria"
                      type="color"
                      value={newMunicipality.corSecundaria}
                      onChange={(e) =>
                        setNewMunicipality({ ...newMunicipality, corSecundaria: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={newMunicipality.corSecundaria}
                      onChange={(e) =>
                        setNewMunicipality({ ...newMunicipality, corSecundaria: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddMunicipality}
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Criar Município
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowNewMunicipalityForm(false)}
                  variant="outline"
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Carregando municípios...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Erro ao carregar municípios</h3>
                  <p className="text-sm text-red-700 mt-1">{error.message}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Municipalities Table */}
          {!isLoading && !error && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Cores
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredMunicipalities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          {searchTerm ? "Nenhum município encontrado" : "Nenhum município cadastrado"}
                        </td>
                      </tr>
                    ) : (
                      filteredMunicipalities.map((municipio) => (
                        <tr key={municipio.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                              <span className="text-sm font-medium text-slate-900">
                                {municipio.id}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">{municipio.nome}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-slate-200"
                                style={{ backgroundColor: municipio.corPrimaria || "#0066cc" }}
                                title={`Primária: ${municipio.corPrimaria || "#0066cc"}`}
                              />
                              <div
                                className="w-6 h-6 rounded border border-slate-200"
                                style={{ backgroundColor: municipio.corSecundaria || "#f0f0f0" }}
                                title={`Secundária: ${municipio.corSecundaria || "#f0f0f0"}`}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(municipio.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4 text-slate-600" />
                              </button>
                              <button
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
