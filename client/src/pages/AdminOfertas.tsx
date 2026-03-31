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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"offer" | "news">("offer");
  const [imageUrl, setImageUrl] = useState("");

  const utils = trpc.useUtils();
  const { data: offers, isLoading } = trpc.offers.list.useQuery(
    { all: true },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const createMutation = trpc.offers.create.useMutation({
    onSuccess: () => {
      toast.success("Oferta criada com sucesso!");
      setOpen(false);
      setTitle(""); setContent(""); setType("offer"); setImageUrl("");
      utils.offers.list.invalidate();
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
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: 20% off em Botox Capilar" className="mt-1" />
                </div>
                <div>
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Descreva a oferta ou novidade em detalhes..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>URL da Imagem (opcional)</Label>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="mt-1" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => createMutation.mutate({ title, content, type, imageUrl: imageUrl || undefined })}
                    disabled={!title || !content || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Criando..." : "Criar como Rascunho"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Após criar, publique para notificar os clientes por e-mail.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
              <p className="font-semibold text-sm">Como funciona a notificação?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ao clicar em "Publicar & Notificar", todos os clientes cadastrados receberão um e-mail com a oferta.
                Isso acontece apenas uma vez por oferta. Você pode despublicar sem reenviar e-mails.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
