"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { normalizeDocument, validators } from "@/services/validators";
import * as authService from "@/services/authService";
import { Logs } from "lucide-react";

export default function MotoristaLoginPage() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const normalizedCpf = normalizeDocument(cpf);
  const isCpfValid = normalizedCpf.length === 11 && validators.cpf(normalizedCpf);
  const isPasswordValid = password.length >= 6;
  const isFormValid = isCpfValid && isPasswordValid;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setError("Preencha os campos corretamente");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const result = await authService.signIn(supabase, {
        cpf: normalizedCpf,
        password,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setSuccessMessage("Login realizado com sucesso! Redirecionando...");

        // Redirect based on role
        const role = result.data.profile?.role;
        if (role === "motorista") {
          setTimeout(() => {
            router.push("/motorista/documentos");
          }, 1000);
        } else if (role === "operador" || role === "admin") {
          setTimeout(() => {
            router.push("/");
          }, 1000);
        } else {
          setTimeout(() => {
            router.push("/");
          }, 1000);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isCpfValid) {
      setError("Digite um CPF válido para recuperar a senha");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await authService.resetPassword(supabase, normalizedCpf);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccessMessage("Email de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao recuperar senha";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[color:var(--color-surface)] to-[color:var(--color-muted)] px-4">
      <Card className="w-full max-w-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center space-y-2">
          <div className="rounded-full bg-gradient-to-br from-primary-500 to-primary-600 p-3">
            <Logs className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[color:var(--color-foreground)]">LogFlow</h1>
          <p className="text-sm text-[color:var(--color-muted)]">Acesso de Motoristas</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* CPF Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
              CPF
            </label>
            <Input
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => {
                setCpf(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className={`border-[color:var(--color-border)] ${
                cpf && !isCpfValid ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {cpf && !isCpfValid && (
              <p className="text-xs font-medium text-red-600">CPF inválido</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
              Senha
            </label>
            <Input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className="border-[color:var(--color-border)]"
            />
            {password && !isPasswordValid && (
              <p className="text-xs font-medium text-red-600">Senha deve ter no mínimo 6 caracteres</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-medium text-emerald-700">{successMessage}</p>
            </div>
          )}

          {/* Login Button */}
          <Button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          {/* Forgot Password Button */}
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading || !isCpfValid}
            className="w-full text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            Esqueceu a senha?
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-[color:var(--color-border)] pt-6 text-center text-xs text-[color:var(--color-muted)]">
          <p className="mb-3">Não tem acesso ainda?</p>
          <p className="text-xs">
            Solicite ao seu gestor para criar uma conta durante o cadastro de motorista.
          </p>
        </div>

        {/* Dashboard Link (for testing) */}
        <div className="mt-4 border-t border-[color:var(--color-border)] pt-4 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Voltar para painel
          </Link>
        </div>
      </Card>
    </div>
  );
}
