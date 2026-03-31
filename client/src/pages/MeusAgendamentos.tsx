import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CalendarDays, Clock, MessageCircle, Plus } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import WhatsAppFab from "@/components/WhatsAppFab";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando confirmação", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
  completed: { label: "Concluído", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function MeusAgendamentos() {
  const { isAuthenticated } = useAuth();
  const { data: appointments, isLoading } = trpc.appointments.myList.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const cancelMutation = trpc.appointments.cancel.useMutation({
    onSuccess: () => { toast.success("Agendamento cancelado."); utils.appointments.myList.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-20 text-center">
          <CalendarDays size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Faça login para ver seus agendamentos</h2>
          <a href={getLoginUrl()}>
            <Button size="lg">Entrar / Cadastrar</Button>
          </a>
        </div>
        <WhatsAppFab />
      </div>
    );
  }

  const upcoming = (appointments ?? []).filter((a) => ["pending", "confirmed"].includes(a.status));
  const past = (appointments ?? []).filter((a) => ["completed", "cancelled"].includes(a.status));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <section className="skr-gradient py-10 border-b border-border">
        <div className="container">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={18} className="text-primary" />
            <p className="text-primary text-sm font-medium tracking-widest uppercase">Minha Agenda</p>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Meus Agendamentos</h1>
        </div>
      </section>

      <div className="container py-8 max-w-2xl mx-auto space-y-6">
        {/* Upcoming */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays size={16} className="text-primary" /> Próximos
              </CardTitle>
              <Link href="/agendar">
                <Button size="sm" variant="outline" className="gap-1 border-primary text-primary text-xs">
                  <Plus size={12} /> Novo
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum agendamento futuro.</p>
                <Link href="/agendar">
                  <Button size="sm" variant="outline" className="border-primary text-primary mt-3">
                    Agendar agora
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((appt) => {
                  const st = STATUS_LABELS[appt.status] ?? STATUS_LABELS.pending!;
                  return (
                    <div key={appt.id} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">{appt.serviceName}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarDays size={12} />
                              {new Date((appt.appointmentDate as unknown as string) + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                            <Clock size={12} />
                            <span>{appt.appointmentTime as string}</span>
                          </div>
                          {appt.clientNotes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{appt.clientNotes}"</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                            {st.label}
                          </span>
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
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past */}
        {past.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} className="text-primary" /> Histórico
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
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* WhatsApp CTA */}
        <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
          <MessageCircle size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Precisa reagendar ou tem dúvidas?</p>
            <p className="text-xs text-muted-foreground">Entre em contato diretamente com a Karine.</p>
          </div>
          <a
            href="https://wa.me/5511910928534?text=Olá%20Karine!%20Preciso%20de%20ajuda%20com%20meu%20agendamento."
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0"
          >
            <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 text-xs">
              WhatsApp
            </Button>
          </a>
        </div>
      </div>

      <WhatsAppFab />
    </div>
  );
}
