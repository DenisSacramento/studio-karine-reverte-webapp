import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login administrativo realizado com sucesso.");
      setLocation("/admin");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Falha no login administrativo.");
    },
  });

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Administrativo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              onClick={() => setLocation(getLoginUrl())}
            >
              Voltar para login de cliente
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
