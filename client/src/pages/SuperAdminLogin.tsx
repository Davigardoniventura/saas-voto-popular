import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SuperAdminLogin() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    code: "", // Para 2FA
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [attemptCount, setAttemptCount] = useState(0);

  const loginMutation = trpc.auth.superadminLogin.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Verificar limite de tentativas
    if (attemptCount >= 5) {
      setError("Muitas tentativas de login. Tente novamente em 15 minutos.");
      return;
    }

    if (step === "credentials") {
      if (!formData.email || !formData.password) {
        setError("Email e senha são obrigatórios");
        return;
      }

      setIsLoading(true);

      try {
        await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });

        setSuccess("Código de 2FA enviado para seu email!");
        setStep("2fa");
        setFormData({ ...formData, password: "" });
      } catch (error: any) {
        setAttemptCount((prev) => prev + 1);
        setError(error.message || "Email ou senha inválidos");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Validar 2FA
      if (!formData.code || formData.code.length !== 6) {
        setError("Código de 2FA deve ter 6 dígitos");
        return;
      }

      setIsLoading(true);

      try {
        // Aqui você faria a validação do código 2FA
        // await verify2FA(formData.email, formData.code);
        setSuccess("Login realizado com sucesso!");
        setTimeout(() => {
          navigate("/superadmin");
        }, 1500);
      } catch (error: any) {
        setAttemptCount((prev) => prev + 1);
        setError("Código 2FA inválido");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card Principal */}
        <Card className="shadow-2xl border-0 bg-slate-800/50 backdrop-blur-xl">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Super Admin</h1>
              <p className="text-slate-400 text-sm">
                {step === "credentials"
                  ? "Acesso exclusivo ao painel de controle"
                  : "Verifique seu email para o código 2FA"}
              </p>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-300">{success}</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {step === "credentials" ? (
                <>
                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-slate-200 mb-2 block">
                      Email Administrativo
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@votopopular.com.br"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Senha */}
                  <div>
                    <Label htmlFor="password" className="text-slate-200 mb-2 block">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tentativas restantes */}
                  {attemptCount > 0 && (
                    <p className="text-xs text-slate-400 text-center">
                      {5 - attemptCount} tentativa(s) restante(s)
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Código 2FA */}
                  <div>
                    <Label htmlFor="code" className="text-slate-200 mb-2 block">
                      Código de Verificação (6 dígitos)
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={formData.code}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="text-center text-2xl tracking-widest bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Botão Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </span>
                ) : step === "credentials" ? (
                  "Entrar"
                ) : (
                  "Verificar Código"
                )}
              </Button>
            </form>

            {/* Voltar */}
            {step === "2fa" && (
              <button
                onClick={() => {
                  setStep("credentials");
                  setFormData({ ...formData, code: "" });
                  setError("");
                }}
                className="w-full mt-4 text-slate-400 hover:text-slate-200 text-sm transition-colors"
              >
                Voltar para login
              </button>
            )}

            {/* Rodapé */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                Acesso restrito a Super Administradores. Todas as ações são registradas e monitoradas.
              </p>
            </div>
          </div>
        </Card>

        {/* Aviso de Segurança */}
        <div className="mt-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg backdrop-blur-sm">
          <p className="text-xs text-slate-400 text-center">
            🔒 Esta página utiliza criptografia SSL/TLS. Nunca compartilhe suas credenciais.
          </p>
        </div>
      </div>
    </div>
  );
}
