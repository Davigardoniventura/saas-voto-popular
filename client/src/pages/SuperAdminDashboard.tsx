import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { LogOut, Palette, Building2, Users } from "lucide-react";
import { useState } from "react";

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"themes" | "municipalities" | "admins">("themes");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [themeForm, setThemeForm] = useState({
    primaryColor: "#0066cc",
    secondaryColor: "#f0f0f0",
    accentColor: "#ff6b35",
    logoUrl: "",
    fontFamily: "'Inter', sans-serif",
  });

  const updateThemeMutation = trpc.superadmin.updateThemeConfig.useMutation();
  const getThemeQuery = trpc.superadmin.getThemeConfig.useQuery(
    { municipalityId: selectedMunicipality },
    { enabled: !!selectedMunicipality }
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMunicipality) {
      alert("Selecione um município");
      return;
    }

    try {
      await updateThemeMutation.mutateAsync({
        municipalityId: selectedMunicipality,
        ...themeForm,
      });
      alert("Tema atualizado com sucesso!");
    } catch (error: any) {
      alert("Erro ao atualizar tema: " + error.message);
    }
  };

  if (!user || user.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-red-600 font-bold">Acesso negado. Apenas Super Admin pode acessar.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voto Popular - Super Admin</h1>
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
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("themes")}
            className={`pb-4 px-4 font-medium ${
              activeTab === "themes"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Palette className="inline h-5 w-5 mr-2" />
            Personalização de Temas
          </button>
          <button
            onClick={() => setActiveTab("municipalities")}
            className={`pb-4 px-4 font-medium ${
              activeTab === "municipalities"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Building2 className="inline h-5 w-5 mr-2" />
            Municípios
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`pb-4 px-4 font-medium ${
              activeTab === "admins"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="inline h-5 w-5 mr-2" />
            Administradores
          </button>
        </div>

        {/* Themes Tab */}
        {activeTab === "themes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Theme Form */}
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Personalizar Tema</h2>

              <div className="mb-6">
                <Label htmlFor="municipality">Selecione o Município</Label>
                <Input
                  id="municipality"
                  placeholder="ID do município (ex: muriae-mg)"
                  value={selectedMunicipality}
                  onChange={(e) => setSelectedMunicipality(e.target.value)}
                  className="mt-2"
                />
              </div>

              {selectedMunicipality && (
                <form onSubmit={handleThemeSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="primaryColor">Cor Primária</Label>
                    <div className="flex gap-4 mt-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={themeForm.primaryColor}
                        onChange={(e) =>
                          setThemeForm({ ...themeForm, primaryColor: e.target.value })
                        }
                        className="h-12 w-20"
                      />
                      <Input
                        type="text"
                        value={themeForm.primaryColor}
                        onChange={(e) =>
                          setThemeForm({ ...themeForm, primaryColor: e.target.value })
                        }
                        placeholder="#0066cc"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor">Cor Secundária</Label>
                    <div className="flex gap-4 mt-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={themeForm.secondaryColor}
                        onChange={(e) =>
                          setThemeForm({ ...themeForm, secondaryColor: e.target.value })
                        }
                        className="h-12 w-20"
                      />
                      <Input
                        type="text"
                        value={themeForm.secondaryColor}
                        onChange={(e) =>
                          setThemeForm({ ...themeForm, secondaryColor: e.target.value })
                        }
                        placeholder="#f0f0f0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accentColor">Cor de Destaque</Label>
                    <div className="flex gap-4 mt-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={themeForm.accentColor}
                        onChange={(e) =>
                          setThemeForm({ ...themeForm, accentColor: e.target.value })
                        }
                        className="h-12 w-20"
                      />
                      <Input
                        type="text"
                        value={themeForm.accentColor}
                        onChange={(e) =>
                          setThemeForm({ ...themeForm, accentColor: e.target.value })
                        }
                        placeholder="#ff6b35"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="logoUrl">URL do Logo</Label>
                    <Input
                      id="logoUrl"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={themeForm.logoUrl}
                      onChange={(e) => setThemeForm({ ...themeForm, logoUrl: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fontFamily">Família de Fontes</Label>
                    <Input
                      id="fontFamily"
                      placeholder="'Inter', sans-serif"
                      value={themeForm.fontFamily}
                      onChange={(e) => setThemeForm({ ...themeForm, fontFamily: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={updateThemeMutation.isPending}
                  >
                    {updateThemeMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              )}
            </Card>

            {/* Preview */}
            <Card className="p-6 h-fit">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pré-visualização</h3>
              <div
                className="p-6 rounded-lg text-white"
                style={{
                  backgroundColor: themeForm.primaryColor,
                  fontFamily: themeForm.fontFamily,
                }}
              >
                <h4 className="text-lg font-bold mb-2">Tema Personalizado</h4>
                <p className="text-sm opacity-90 mb-4">
                  Esta é uma pré-visualização de como o tema ficará.
                </p>
                <button
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{ backgroundColor: themeForm.accentColor }}
                >
                  Botão de Ação
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Municipalities Tab */}
        {activeTab === "municipalities" && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Gestão de Municípios</h2>
            <p className="text-gray-600">
              Funcionalidade de criação e gestão de municípios será implementada em breve.
            </p>
          </Card>
        )}

        {/* Admins Tab */}
        {activeTab === "admins" && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Gestão de Administradores</h2>
            <p className="text-gray-600">
              Funcionalidade de promoção de usuários para administrador será implementada em breve.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
