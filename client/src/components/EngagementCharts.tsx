import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, Users, CheckCircle, Clock } from "lucide-react";

interface EngagementChartsProps {
  municipalityId?: string;
}

export function EngagementCharts({ municipalityId }: EngagementChartsProps) {
  // Dados simulados de engajamento por semana
  const weeklyEngagementData = [
    { week: "Sem 1", usuarios: 120, votos: 85, propostas: 12 },
    { week: "Sem 2", usuarios: 150, votos: 110, propostas: 15 },
    { week: "Sem 3", usuarios: 180, votos: 145, propostas: 18 },
    { week: "Sem 4", usuarios: 220, votos: 190, propostas: 22 },
    { week: "Sem 5", usuarios: 280, votos: 240, propostas: 28 },
    { week: "Sem 6", usuarios: 320, votos: 290, propostas: 32 },
  ];

  // Dados de status de propostas
  const proposalStatusData = [
    { name: "Aprovadas", value: 45, color: "#10b981" },
    { name: "Pendentes", value: 32, color: "#f59e0b" },
    { name: "Rejeitadas", value: 15, color: "#ef4444" },
    { name: "Arquivadas", value: 8, color: "#6b7280" },
  ];

  // Dados de crescimento de usuários por mês
  const monthlyGrowthData = [
    { month: "Jan", novos: 45, total: 450 },
    { month: "Fev", novos: 62, total: 512 },
    { month: "Mar", novos: 78, total: 590 },
    { month: "Abr", novos: 95, total: 685 },
    { month: "Mai", novos: 112, total: 797 },
    { month: "Jun", novos: 138, total: 935 },
  ];

  // Dados de taxa de participação
  const participationRateData = [
    { municipio: "São Paulo", taxa: 78 },
    { municipio: "Rio de Janeiro", taxa: 65 },
    { municipio: "Belo Horizonte", taxa: 72 },
    { municipio: "Brasília", taxa: 58 },
    { municipio: "Salvador", taxa: 81 },
    { municipio: "Curitiba", taxa: 69 },
  ];

  // Dados de votos por categoria
  const votesByCategoryData = [
    { categoria: "Infraestrutura", votos: 245 },
    { categoria: "Educação", votos: 198 },
    { categoria: "Saúde", votos: 176 },
    { categoria: "Segurança", votos: 152 },
    { categoria: "Ambiente", votos: 128 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total de Usuários</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">2,450</p>
              <p className="text-xs text-blue-700 mt-2">↑ 12% este mês</p>
            </div>
            <Users className="w-12 h-12 text-blue-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Propostas Aprovadas</p>
              <p className="text-3xl font-bold text-green-900 mt-2">156</p>
              <p className="text-xs text-green-700 mt-2">↑ 8% este mês</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total de Votos</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">8,924</p>
              <p className="text-xs text-purple-700 mt-2">↑ 15% este mês</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Taxa Média de Participação</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">71%</p>
              <p className="text-xs text-orange-700 mt-2">↑ 3% este mês</p>
            </div>
            <Clock className="w-12 h-12 text-orange-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engajamento Semanal */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Engajamento Semanal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyEngagementData}>
              <defs>
                <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVotos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="usuarios"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorUsuarios)"
                name="Usuários"
              />
              <Area
                type="monotone"
                dataKey="votos"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorVotos)"
                name="Votos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Status de Propostas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Status de Propostas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={proposalStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {proposalStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Crescimento de Usuários */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Crescimento de Usuários</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="novos" fill="#3b82f6" name="Novos Usuários" />
              <Bar dataKey="total" fill="#10b981" name="Total Acumulado" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Taxa de Participação por Município */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Taxa de Participação por Município</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={participationRateData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="municipio" type="category" width={140} />
              <Tooltip />
              <Bar dataKey="taxa" fill="#8b5cf6" name="Taxa (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Votos por Categoria */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Votos por Categoria de Proposta</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={votesByCategoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="votos" fill="#f59e0b" name="Votos" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 Insights Principais</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-2">Crescimento Mais Rápido</p>
            <p className="text-2xl font-bold text-blue-600">Educação</p>
            <p className="text-xs text-slate-500 mt-1">+45% em propostas este mês</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Município Mais Ativo</p>
            <p className="text-2xl font-bold text-green-600">Salvador</p>
            <p className="text-xs text-slate-500 mt-1">81% de taxa de participação</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Engajamento Médio</p>
            <p className="text-2xl font-bold text-purple-600">3.6x</p>
            <p className="text-xs text-slate-500 mt-1">Votos por proposta</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
