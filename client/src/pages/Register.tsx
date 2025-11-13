import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { APP_TITLE, APP_LOGO } from "@/const";

export default function Register() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const syncUserMutation = trpc.auth.syncUser.useMutation();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Mínimo 8 caracteres");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Pelo menos uma letra maiúscula");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Pelo menos uma letra minúscula");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Pelo menos um número");
    }

    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    // Validações
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors.join(", ");
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "As senhas não coincidem";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Criar usuário no Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Atualizar nome do usuário no Firebase
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      // Sincronizar com backend (salvar no banco de dados)
      await syncUserMutation.mutateAsync({
        uid: userCredential.user.uid,
        email: userCredential.user.email || "",
        name: formData.name,
      });

      setSuccessMessage("Cadastro realizado com sucesso! Redirecionando...");

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("[Register] Erro:", error);

      // Mensagens de erro amigáveis
      let errorMessage = "Erro ao criar conta. Tente novamente.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este e-mail já está em uso.";
        setErrors({ email: errorMessage });
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "E-mail inválido.";
        setErrors({ email: errorMessage });
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Senha muito fraca.";
        setErrors({ password: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
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

          <h2 className="text-xl font-bold text-gray-900 mb-6">Criar Conta</h2>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">{successMessage}</span>
            </div>
          )}

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-800">{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                placeholder="João da Silva"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

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
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
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
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="passwordConfirm">Confirmar Senha</Label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                placeholder="••••••••"
                value={formData.passwordConfirm}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              {errors.passwordConfirm && (
                <p className="text-sm text-red-600 mt-1">{errors.passwordConfirm}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <a href="/login" className="text-blue-600 hover:underline font-medium">
                Faça login
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
