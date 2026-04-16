import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CalendarDays, CheckCircle, ChevronLeft, ChevronRight, Clock, Scissors } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import AppHeader from "@/components/AppHeader";
import WhatsAppFab from "@/components/WhatsAppFab";
import { useAuth } from "@/_core/hooks/useAuth";

const SERVICE_ICONS: Record<string, string> = {
  "Selagem": "✨", "Progressiva Sem Formol": "💫", "Progressiva Com Formol": "⚡",
  "Botox Capilar": "💎", "Reconstrução": "🌿", "Penteado": "👑",
  "Hidronutrição": "💧", "Progressiva Matizadora": "🎨",
};

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function formatDateStr(date: Date) {
  return date.toISOString().split("T")[0]!;
}

export default function Agendar() {
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const preselectedServiceId = params.get("serviceId") ? Number(params.get("serviceId")) : null;
  const promoPriceParam = params.get("promoPrice");
  const promoPrice = promoPriceParam ? Number(promoPriceParam) : null;

  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(preselectedServiceId);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [success, setSuccess] = useState(false);

  const { data: services } = trpc.services.list.useQuery();
  const { data: slots, isLoading: slotsLoading } = trpc.appointments.availableSlots.useQuery(
    { date: selectedDate, serviceId: selectedServiceId ?? 0 },
    { enabled: !!selectedDate && !!selectedServiceId }
  );

  const utils = trpc.useUtils();
  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Agendamento realizado com sucesso!");
      setSuccess(true);
      utils.appointments.myList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const clientRegisterMutation = trpc.auth.clientRegister.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (preselectedServiceId) setStep(2);
  }, [preselectedServiceId]);

  const selectedService = services?.find((s) => s.id === selectedServiceId);
  const promoApplies =
    selectedServiceId !== null &&
    preselectedServiceId !== null &&
    selectedServiceId === preselectedServiceId &&
    promoPrice !== null &&
    Number.isFinite(promoPrice) &&
    promoPrice > 0;

  // Calendar helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  function selectDay(day: number) {
    const d = new Date(year, month, day);
    if (d < today) return;
    setSelectedDate(formatDateStr(d));
    setSelectedTime("");
  }

  async function handleConfirm() {
    if (!selectedServiceId || !selectedDate || !selectedTime) return;
    try {
      if (!isAuthenticated) {
        if (!clientName.trim() || !clientPhone.trim()) {
          toast.error("Preencha nome e telefone para confirmar.");
          return;
        }

        await clientRegisterMutation.mutateAsync({
          name: clientName,
          phone: clientPhone,
        });
      }

      await createMutation.mutateAsync({
        serviceId: selectedServiceId,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        clientNotes: notes,
      });
    } catch {
      // erros já tratados nas mutations
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-20 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-foreground">Agendamento Solicitado!</h2>
          <p className="text-muted-foreground mb-2">
            Seu agendamento foi enviado com sucesso. A Karine irá confirmar em breve.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Você receberá um e-mail de confirmação assim que for aprovado.
          </p>
          <div className="bg-secondary/50 rounded-xl p-4 mb-8 text-left space-y-2">
            <p className="text-sm"><strong>Serviço:</strong> {selectedService?.name}</p>
            <p className="text-sm"><strong>Data:</strong> {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
            <p className="text-sm"><strong>Horário:</strong> {selectedTime}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/meus-agendamentos")}>Ver meus agendamentos</Button>
            <Button variant="outline" onClick={() => { setSuccess(false); setStep(1); setSelectedServiceId(null); setSelectedDate(""); setSelectedTime(""); }}>
              Novo agendamento
            </Button>
          </div>
        </div>
        <WhatsAppFab />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <section className="skr-gradient py-10 border-b border-border">
        <div className="container">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={18} className="text-primary" />
            <p className="text-primary text-sm font-medium tracking-widest uppercase">Agendamento</p>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Agende seu Horário</h1>
          {/* Steps */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {s}
                </div>
                <span className={`text-xs hidden sm:block ${step >= s ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {s === 1 ? "Serviço" : s === 2 ? "Data & Hora" : "Confirmar"}
                </span>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-8 max-w-3xl mx-auto">
        {/* Step 1: Service */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Escolha o serviço</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(services ?? []).map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all border-2 ${selectedServiceId === service.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  onClick={() => setSelectedServiceId(service.id)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="text-2xl">{SERVICE_ICONS[service.name] ?? "✂️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{service.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock size={10} /> {service.durationMinutes} min
                        {service.price && <span className="ml-2 text-primary font-medium">R$ {Number(service.price).toFixed(2).replace(".", ",")}</span>}
                      </div>
                    </div>
                    {selectedServiceId === service.id && (
                      <CheckCircle size={18} className="text-primary shrink-0" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button disabled={!selectedServiceId} onClick={() => setStep(2)}>
                Próximo <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft size={16} /> Voltar
              </Button>
              <h2 className="text-xl font-bold">Escolha a data e horário</h2>
            </div>

            {selectedService && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-secondary/50 rounded-lg">
                <span className="text-xl">{SERVICE_ICONS[selectedService.name] ?? "✂️"}</span>
                <span className="font-medium text-sm">{selectedService.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  <Clock size={10} className="mr-1" />{selectedService.durationMinutes} min
                </Badge>
                {promoApplies && (
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground line-through">
                      R$ {Number(selectedService.price ?? 0).toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-xs font-semibold text-primary">
                      R$ {Number(promoPrice).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Calendar */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setCalendarDate(new Date(year, month - 1, 1))}>
                    <ChevronLeft size={16} />
                  </Button>
                  <CardTitle className="text-base">{MONTHS_PT[month]} {year}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setCalendarDate(new Date(year, month + 1, 1))}>
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_PT.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const d = new Date(year, month, day);
                    const isPast = d < today;
                    const dateStr = formatDateStr(d);
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === formatDateStr(today);
                    return (
                      <button
                        key={i}
                        disabled={isPast}
                        onClick={() => selectDay(day)}
                        className={`h-9 w-full rounded-lg text-sm font-medium transition-colors
                          ${isPast ? "text-muted-foreground/40 cursor-not-allowed" : "hover:bg-primary/10 cursor-pointer"}
                          ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary" : ""}
                          ${isToday && !isSelected ? "border border-primary text-primary" : ""}
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <h3 className="font-semibold mb-3 text-sm">
                  Horários disponíveis — {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                {slotsLoading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : slots && slots.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors
                          ${selectedTime === slot
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary hover:bg-primary/5"
                          }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhum horário disponível nesta data.</p>
                    <p className="text-xs mt-1">Tente outra data ou entre em contato pelo WhatsApp.</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}>
                Próximo <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ChevronLeft size={16} /> Voltar
              </Button>
              <h2 className="text-xl font-bold">Confirmar agendamento</h2>
            </div>

            <Card className="mb-4">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <span className="text-2xl">{SERVICE_ICONS[selectedService?.name ?? ""] ?? "✂️"}</span>
                  <div>
                    <p className="font-bold">{selectedService?.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={10} /> {selectedService?.durationMinutes} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays size={14} className="text-primary" />
                  <span>{new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-primary" />
                  <span>{selectedTime}</span>
                </div>
                {promoApplies && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground line-through">
                      Preço original: R$ {Number(selectedService?.price ?? 0).toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      Preço promocional: R$ {Number(promoPrice).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mb-6">
              {!isAuthenticated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label htmlFor="clientName" className="text-sm font-medium mb-2 block">
                      Nome
                    </Label>
                    <Input
                      id="clientName"
                      placeholder="Seu nome"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone" className="text-sm font-medium mb-2 block">
                      Telefone
                    </Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                Observações (opcional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Ex: tenho cabelo tingido, alergia a algum produto, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={createMutation.isPending || clientRegisterMutation.isPending}
              >
                {createMutation.isPending || clientRegisterMutation.isPending
                  ? "Enviando..."
                  : "Confirmar Agendamento"}
              </Button>
              <a
                href="https://wa.me/5511910928534?text=Olá%20Karine!%20Gostaria%20de%20agendar%20um%20horário."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                  <Scissors size={14} className="mr-1" /> WhatsApp
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>

      <WhatsAppFab />
    </div>
  );
}
