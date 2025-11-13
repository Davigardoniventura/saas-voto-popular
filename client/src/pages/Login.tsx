import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { APP_TITLE, APP_LOGO } from "@/const";

export default function Login() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const syncUserMutation = trpc.auth.syncUser.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("E-mail e senha são obrigatórios");
      return;
    }

    setIsLoading(true);

    try {
      // Login com Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Sincronizar usuário com backend
      await syncUserMutation.mutateAsync({
        uid: userCredential.user.uid,
        email: userCredential.user.email || "",
        name: userCredential.user.displayName || undefined,
      });

      // Redirecionar para dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("[Login] Erro:", error);
      
      // Mensagens de erro amigáveis
      let errorMessage = "Erro ao fazer login. Verifique suas credenciais.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado. Cadastre-se primeiro.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "E-mail inválido.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          <div className="flex items-center justify-center mb-8">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12" />}
            <h1 className="ml-3 text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{" "}
              <a href="/register" className="text-blue-600 hover:underline font-medium">
                Cadastre-se
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
