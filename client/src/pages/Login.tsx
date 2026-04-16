import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getAdminLoginUrl } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  const [loginPhone, setLoginPhone] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  const utils = trpc.useUtils();

  const clientLoginMutation = trpc.auth.clientLogin.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso.");
      utils.auth.me.invalidate();
      setLocation("/");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Falha no login.");
    },
  });

  const clientRegisterMutation = trpc.auth.clientRegister.useMutation({
    onSuccess: () => {
      toast.success("Conta criada com sucesso.");
      utils.auth.me.invalidate();
      setLocation("/");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "Falha ao criar conta.");
    },
  });

  const submitLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clientLoginMutation.mutate({ phone: loginPhone });
  };

  const submitRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clientRegisterMutation.mutate({
      name: registerName,
      phone: registerPhone,
      email: registerEmail.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar ou Cadastrar</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entrar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="cadastrar">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar" className="mt-4">
              <form onSubmit={submitLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginPhone">Telefone</Label>
                  <Input
                    id="loginPhone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={clientLoginMutation.isPending}>
                  {clientLoginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="cadastrar" className="mt-4">
              <form onSubmit={submitRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registerName">Nome</Label>
                  <Input
                    id="registerName"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPhone">Telefone</Label>
                  <Input
                    id="registerPhone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerEmail">Email (opcional)</Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={clientRegisterMutation.isPending}>
                  {clientRegisterMutation.isPending ? "Criando conta..." : "Cadastrar-se"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              onClick={() => setLocation(getAdminLoginUrl())}
            >
              Acesso Administrativo
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
