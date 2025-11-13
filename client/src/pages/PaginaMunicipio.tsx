import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function PaginaMunicipio() {
  const params = useParams();
  const municipioId = params.id as string;

  const { data: municipio, isLoading, error } = trpc.municipio.getById.useQuery(
    { id: municipioId },
    { enabled: !!municipioId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !municipio) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Município não encontrado
          </h1>
          <p className="text-gray-600">
            O município "{municipioId}" não está cadastrado no sistema.
          </p>
        </Card>
      </div>
    );
  }

  // Aplicar cores dinâmicas
  const primaryColor = municipio.corPrimaria || "#0066cc";
  const secondaryColor = municipio.corSecundaria || "#f0f0f0";

  return (
    <div 
      className="min-h-screen" 
      style={{ backgroundColor: secondaryColor }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header do Município */}
        <Card className="mb-8 shadow-lg">
          <div 
            className="p-8 rounded-t-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-4">
              {municipio.logoUrl && (
                <img 
                  src={municipio.logoUrl} 
                  alt={municipio.nome}
                  className="h-16 w-16 object-contain bg-white rounded-lg p-2"
                />
              )}
              <h1 className="text-3xl font-bold text-white">
                {municipio.nome}
              </h1>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4">
              Bem-vindo ao Portal de Participação Popular
            </h2>
            <p className="text-gray-600 mb-6">
              Acompanhe as propostas dos vereadores, vote nas que mais importam para você
              e participe ativamente da democracia local.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 text-center hover:shadow-md transition-shadow">
                <h3 className="font-semibold mb-2">Propostas</h3>
                <p className="text-sm text-gray-600">
                  Veja todas as propostas em andamento
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-md transition-shadow">
                <h3 className="font-semibold mb-2">Vote</h3>
                <p className="text-sm text-gray-600">
                  Expresse sua opinião votando
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-md transition-shadow">
                <h3 className="font-semibold mb-2">Acompanhe</h3>
                <p className="text-sm text-gray-600">
                  Veja o andamento das propostas
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Conteúdo adicional pode ser adicionado aqui */}
        <div className="text-center text-gray-500 mt-8">
          <p>ID do Município: {municipio.id}</p>
        </div>
      </div>
    </div>
  );
}
