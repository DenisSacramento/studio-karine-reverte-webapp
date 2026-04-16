import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronLeft, Eye, EyeOff, Gift, Plus, Send, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Link } from "wouter";

export default function AdminOfertas() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string>("");
  const [content, setContent] = useState("");
  const [promotionalPrice, setPromotionalPrice] = useState("");
  const [type, setType] = useState<"offer" | "news">("offer");
  const [pendingWhatsappUrl, setPendingWhatsappUrl] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: services } = trpc.services.list.useQuery({ all: true });
  const { data: offers, isLoading } = trpc.offers.list.useQuery(
    { all: true },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const createMutation = trpc.offers.create.useMutation({
    onSuccess: (data) => {
      toast.success("Oferta criada com sucesso!");
      setOpen(false);
      setServiceId("");
      setContent("");
      setType("offer");
      setPromotionalPrice("");
      utils.offers.serviceList.invalidate();
      utils.offers.list.invalidate();

      if (data.whatsappUrl) {
        const popup = window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        if (!popup) {
          setPendingWhatsappUrl(data.whatsappUrl);
        } else {
          setPendingWhatsappUrl(null);
        }
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const publishMutation = trpc.offers.publish.useMutation({
    onSuccess: () => { toast.success("Oferta publicada e e-mails enviados!"); utils.offers.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const unpublishMutation = trpc.offers.unpublish.useMutation({
    onSuccess: () => { toast.success("Oferta despublicada."); utils.offers.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.offers.delete.useMutation({
    onSuccess: () => { toast.success("Oferta removida."); utils.offers.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Acesso restrito.</p>
          <Link href="/"><Button variant="outline" className="mt-4">Voltar</Button></Link>
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
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10 gap-1 -ml-2">
                <ChevronLeft size={16} /> Painel
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Gift size={20} />
            <h1 className="text-2xl font-bold">Gerenciar Ofertas & Novidades</h1>
          </div>
          <p className="text-pink-200 text-sm mt-1">
            Crie e publique ofertas — os clientes serão notificados por e-mail ao publicar.
          </p>
        </div>
      </section>

      <div className="container py-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Todas as Ofertas ({offers?.length ?? 0})</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus size={14} /> Nova Oferta</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Oferta / Novidade</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v) => setType(v as "offer" | "news")}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offer">🏷️ Oferta Especial</SelectItem>
                      <SelectItem value="news">✨ Novidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título</Label>
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {(services ?? []).map((service) => (
                        <SelectItem key={service.id} value={String(service.id)}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Ex: Botox com 20% de desconto"
                    rows={4}
                    className="mt-1"
                  />
                </div>
                {type === "offer" && (
                  <div>
                    <Label>Valor Promocional (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={promotionalPrice}
                      onChange={(e) => setPromotionalPrice(e.target.value)}
                      placeholder="Ex: 70"
                      className="mt-1"
                    />
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() =>
                      createMutation.mutate({
                        serviceId: Number(serviceId),
                        content,
                        type,
                        promotionalPrice: type === "offer" ? promotionalPrice : undefined,
                      })
                    }
                    disabled={
                      !serviceId ||
                      !content ||
                      createMutation.isPending ||
                      (type === "offer" && !promotionalPrice)
                    }
                  >
                    {createMutation.isPending ? "Criando..." : "Salvar Oferta"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  A imagem da oferta será a imagem padrão do serviço selecionado.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {pendingWhatsappUrl && (
          <Card className="mb-4 border-green-200 bg-green-50/60">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-green-800">
                Oferta criada! Clique para enviar a mensagem no WhatsApp.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  window.open(pendingWhatsappUrl, "_blank", "noopener,noreferrer");
                  setPendingWhatsappUrl(null);
                }}
              >
                Abrir WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : !offers || offers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Gift size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhuma oferta criada ainda.</p>
              <p className="text-xs mt-1">Crie sua primeira oferta para engajar os clientes!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <Card key={offer.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={offer.published ? "default" : "secondary"} className="text-xs">
                          {offer.published ? "✅ Publicado" : "📝 Rascunho"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {offer.type === "offer" ? "🏷️ Oferta" : "✨ Novidade"}
                        </Badge>
                        {offer.notificationSent && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            📧 E-mails enviados
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-sm">{offer.title}</h3>
                      <p className="text-muted-foreground text-xs line-clamp-2 mt-0.5">{offer.content}</p>
                      {offer.publishedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Publicado em: {new Date(offer.publishedAt).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {!offer.published ? (
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => publishMutation.mutate({ id: offer.id })}
                          disabled={publishMutation.isPending}
                        >
                          <Send size={12} /> Publicar & Notificar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => unpublishMutation.mutate({ id: offer.id })}
                          disabled={unpublishMutation.isPending}
                        >
                          <EyeOff size={12} /> Despublicar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-destructive gap-1"
                        onClick={() => {
                          if (confirm("Remover esta oferta?")) deleteMutation.mutate({ id: offer.id });
                        }}
                      >
                        <Trash2 size={12} /> Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-secondary/50 rounded-xl border border-border">
          <div className="flex items-start gap-3">
            <Send size={16} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Como funciona o aviso?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ao salvar a oferta, o sistema monta a mensagem e abre o WhatsApp uma vez para envio rápido.
                Se o pop-up for bloqueado, use o botão "Abrir WhatsApp" mostrado acima.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
