import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CalendarDays, CheckCircle, Clock, Gift, LayoutDashboard,
  Plus, Scissors, Users, XCircle, Eye, EyeOff, Trash2, Send
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
  completed: { label: "Concluído", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]!);
  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("60");
  const [newServicePrice, setNewServicePrice] = useState("");

  const utils = trpc.useUtils();

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: appointments, isLoading: apptLoading } = trpc.appointments.adminList.useQuery(
    { date: dateFilter },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: allAppointments } = trpc.appointments.adminList.useQuery(
    {},
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: services } = trpc.services.list.useQuery({ all: true });
  const { data: clients } = trpc.admin.clients.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: offers } = trpc.offers.list.useQuery({ all: true }, { enabled: isAuthenticated && user?.role === "admin" });

  const updateStatusMutation = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); utils.appointments.adminList.invalidate(); utils.admin.stats.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const createServiceMutation = trpc.services.create.useMutation({
    onSuccess: () => { toast.success("Serviço criado!"); setNewServiceOpen(false); utils.services.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const toggleServiceMutation = trpc.services.update.useMutation({
    onSuccess: () => { toast.success("Serviço atualizado!"); utils.services.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const sendRemindersMutation = trpc.appointments.sendReminders.useMutation({
    onSuccess: (data) => toast.success(`${data.sent} lembrete(s) enviado(s)!`),
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-20 text-center">
          <LayoutDashboard size={48} className="text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Esta área é exclusiva para a administradora do studio.</p>
          <Link href="/"><Button variant="outline">Voltar ao início</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <section className="bg-primary text-primary-foreground py-8">
        <div className="container">
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={20} />
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          </div>
          <p className="text-pink-200 text-sm">Bem-vinda, Karine! Gerencie seu studio aqui.</p>
        </div>
      </section>

      <div className="container py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Hoje", value: stats?.todayCount ?? 0, icon: <CalendarDays size={18} />, color: "text-blue-600" },
            { label: "Pendentes", value: stats?.pendingCount ?? 0, icon: <Clock size={18} />, color: "text-yellow-600" },
            { label: "Clientes", value: stats?.totalClients ?? 0, icon: <Users size={18} />, color: "text-green-600" },
            { label: "Este mês", value: stats?.monthCount ?? 0, icon: <Scissors size={18} />, color: "text-primary" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="agenda">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="agenda" className="gap-1.5"><CalendarDays size={14} /> Agenda</TabsTrigger>
            <TabsTrigger value="todos" className="gap-1.5"><Clock size={14} /> Todos</TabsTrigger>
            <TabsTrigger value="servicos" className="gap-1.5"><Scissors size={14} /> Serviços</TabsTrigger>
            <TabsTrigger value="clientes" className="gap-1.5"><Users size={14} /> Clientes</TabsTrigger>
            <TabsTrigger value="ofertas" className="gap-1.5"><Gift size={14} /> Ofertas</TabsTrigger>
          </TabsList>

          {/* Agenda do dia */}
          <TabsContent value="agenda">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">Agenda do Dia</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-40 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendRemindersMutation.mutate()}
                      disabled={sendRemindersMutation.isPending}
                      className="text-xs gap-1"
                    >
                      <Send size={12} /> Lembretes
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {apptLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
                  </div>
                ) : !appointments || appointments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhum agendamento para esta data.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((appt) => {
                      const st = STATUS_LABELS[appt.status] ?? STATUS_LABELS.pending!;
                      return (
                        <div key={appt.id} className="p-4 rounded-xl border border-border bg-card">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm">{appt.appointmentTime as string}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>{st.label}</span>
                              </div>
                              <p className="font-semibold">{appt.clientName}</p>
                              <p className="text-sm text-muted-foreground">{appt.serviceName} · {appt.serviceDuration} min</p>
                              {appt.clientPhone && <p className="text-xs text-muted-foreground mt-0.5">📱 {appt.clientPhone}</p>}
                              {appt.clientNotes && <p className="text-xs text-muted-foreground mt-1 italic">"{appt.clientNotes}"</p>}
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              {appt.status === "pending" && (
                                <Button
                                  size="sm"
                                  className="text-xs h-7 gap-1"
                                  onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "confirmed" })}
                                >
                                  <CheckCircle size={12} /> Confirmar
                                </Button>
                              )}
                              {["pending", "confirmed"].includes(appt.status) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 gap-1 text-destructive border-destructive/30"
                                  onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "cancelled" })}
                                >
                                  <XCircle size={12} /> Cancelar
                                </Button>
                              )}
                              {appt.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 gap-1"
                                  onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "completed" })}
                                >
                                  <CheckCircle size={12} /> Concluir
                                </Button>
                              )}
                              {appt.clientPhone && (
                                <a
                                  href={`https://wa.me/55${appt.clientPhone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(appt.clientName ?? "")}!%20Confirmando%20seu%20agendamento%20no%20Studio%20Karine%20Reverte.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-300">
                                    WhatsApp
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Todos os agendamentos */}
          <TabsContent value="todos">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Todos os Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {(allAppointments ?? []).map((appt) => {
                    const st = STATUS_LABELS[appt.status] ?? STATUS_LABELS.pending!;
                    return (
                      <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg border border-border text-sm">
                        <div>
                          <p className="font-semibold">{appt.clientName}</p>
                          <p className="text-muted-foreground text-xs">
                            {new Date((appt.appointmentDate as unknown as string) + "T12:00:00").toLocaleDateString("pt-BR")} às {appt.appointmentTime as string} · {appt.serviceName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>{st.label}</span>
                          {appt.status === "pending" && (
                            <Button size="sm" className="h-7 text-xs" onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "confirmed" })}>
                              Confirmar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Serviços */}
          <TabsContent value="servicos">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Gerenciar Serviços</CardTitle>
                  <Dialog open={newServiceOpen} onOpenChange={setNewServiceOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1"><Plus size={14} /> Novo</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Serviço</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 mt-2">
                        <div>
                          <Label>Nome</Label>
                          <Input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} className="mt-1" />
                        </div>
                        <div>
                          <Label>Descrição</Label>
                          <Textarea value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} rows={3} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Duração (min)</Label>
                            <Input type="number" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} className="mt-1" />
                          </div>
                          <div>
                            <Label>Preço (R$)</Label>
                            <Input type="number" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} placeholder="Opcional" className="mt-1" />
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => createServiceMutation.mutate({
                            name: newServiceName,
                            description: newServiceDesc,
                            durationMinutes: Number(newServiceDuration),
                            price: newServicePrice || undefined,
                          })}
                          disabled={!newServiceName || createServiceMutation.isPending}
                        >
                          {createServiceMutation.isPending ? "Criando..." : "Criar Serviço"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(services ?? []).map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-semibold text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock size={10} /> {service.durationMinutes} min
                          {service.price && <span>· R$ {Number(service.price).toFixed(2).replace(".", ",")}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={service.active ? "default" : "secondary"} className="text-xs">
                          {service.active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => toggleServiceMutation.mutate({ id: service.id, active: !service.active })}
                        >
                          {service.active ? <EyeOff size={12} /> : <Eye size={12} />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clientes */}
          <TabsContent value="clientes">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Clientes Cadastrados ({clients?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(clients ?? []).map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-semibold text-sm">{client.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                        {client.phone && <p className="text-xs text-muted-foreground">📱 {client.phone}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <p>Desde {new Date(client.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  ))}
                  {(!clients || clients.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ofertas — link para a página dedicada */}
          <TabsContent value="ofertas">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Ofertas & Novidades</CardTitle>
                  <Link href="/admin/ofertas">
                    <Button size="sm" className="gap-1"><Plus size={14} /> Gerenciar</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(offers ?? []).slice(0, 5).map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-semibold text-sm">{offer.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {offer.type === "offer" ? "🏷️ Oferta" : "✨ Novidade"} · {offer.published ? "Publicado" : "Rascunho"}
                        </p>
                      </div>
                      <Badge variant={offer.published ? "default" : "secondary"} className="text-xs">
                        {offer.published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                  ))}
                  {(!offers || offers.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Nenhuma oferta criada ainda.</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <Link href="/admin/ofertas">
                    <Button variant="outline" size="sm" className="border-primary text-primary">
                      Ver todas as ofertas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
