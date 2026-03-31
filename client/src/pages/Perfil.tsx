import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { CalendarDays, Clock, Edit2, Phone, Save, User } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import WhatsAppFab from "@/components/WhatsAppFab";
import { getLoginUrl } from "@/const";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
  completed: { label: "Concluído", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function Perfil() {
  const { user, isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");

  const { data: appointments, isLoading } = trpc.appointments.myList.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => { toast.success("Perfil atualizado!"); setEditing(false); },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = trpc.appointments.cancel.useMutation({
    onSuccess: () => { toast.success("Agendamento cancelado."); utils.appointments.myList.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-20 text-center">
          <User size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Faça login para ver seu perfil</h2>
          <a href={getLoginUrl()}>
            <Button size="lg">Entrar / Cadastrar</Button>
          </a>
        </div>
        <WhatsAppFab />
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const upcoming = (appointments ?? []).filter((a) => ["pending", "confirmed"].includes(a.status));
  const past = (appointments ?? []).filter((a) => ["completed", "cancelled"].includes(a.status));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <section className="skr-gradient py-10 border-b border-border">
        <div className="container">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user?.name ?? "Minha Conta"}</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8 max-w-3xl mx-auto space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User size={18} className="text-primary" /> Meus Dados
            </CardTitle>
            {!editing && (
              <Button variant="ghost" size="sm" onClick={() => { setName(user?.name ?? ""); setEditing(true); }}>
                <Edit2 size={14} className="mr-1" /> Editar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="mt-1" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateMutation.mutate({ name, phone })} disabled={updateMutation.isPending}>
                    <Save size={14} className="mr-1" /> {updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  <span>{user?.name ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{phone || "Não informado"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays size={18} className="text-primary" /> Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum agendamento futuro.</p>
                <a href="/agendar" className="mt-3 inline-block">
                  <Button size="sm" variant="outline" className="border-primary text-primary mt-2">Agendar agora</Button>
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((appt) => {
                  const st = STATUS_LABELS[appt.status] ?? STATUS_LABELS.pending!;
                  return (
                    <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                      <div>
                        <p className="font-semibold text-sm">{appt.serviceName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={10} />
                            {new Date((appt.appointmentDate as unknown as string) + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {appt.appointmentTime as string}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>{st.label}</span>
                        {appt.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive text-xs h-7"
                            onClick={() => cancelMutation.mutate({ id: appt.id })}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        {past.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock size={18} className="text-primary" /> Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {past.map((appt) => {
                  const st = STATUS_LABELS[appt.status] ?? STATUS_LABELS.completed!;
                  return (
                    <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{appt.serviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date((appt.appointmentDate as unknown as string) + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })} às {appt.appointmentTime as string}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <WhatsAppFab />
    </div>
  );
}
