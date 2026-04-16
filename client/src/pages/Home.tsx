import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { CalendarDays, Clock, MapPin, MessageCircle, Sparkles, Star } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import WhatsAppFab from "@/components/WhatsAppFab";

const SERVICE_ICONS: Record<string, string> = {
  "Selagem": "✨",
  "Progressiva Sem Formol": "💫",
  "Progressiva Com Formol": "⚡",
  "Botox Capilar": "💎",
  "Reconstrução": "🌿",
  "Penteado": "👑",
  "Hidronutrição": "💧",
  "Progressiva Matizadora": "🎨",
};

export default function Home() {
  const { data: services } = trpc.services.list.useQuery();
  const { data: offers } = trpc.offers.list.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="skr-hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="container py-20 md:py-28 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-pink-200" />
              <span className="text-pink-200 text-sm font-light tracking-widest uppercase">
                Seu salão de beleza de confiança
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight text-white">
              Studio<br />
              <span className="italic font-normal">Karine Reverte</span>
            </h1>
            <p className="text-pink-100 text-lg mb-8 leading-relaxed max-w-lg">
              Aqui nós não cuidamos somente da estética — cuidamos de pessoas, devolvendo autoestima,
              dignidade e alegria. Você é tratada com respeito, honestidade e amor.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/agendar">
                <Button size="lg" className="bg-white text-primary hover:bg-pink-50 font-semibold gap-2">
                  <CalendarDays size={18} /> Agendar Horário
                </Button>
              </Link>
              <Link href="/servicos">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/60 text-white hover:bg-white/10 gap-2"
                >
                  Ver Serviços
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="py-10 bg-secondary/40 border-y border-border">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Star size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Atendimento Personalizado</p>
                <p className="text-muted-foreground text-xs">Cada cliente é única e especial</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Agendamento Online</p>
                <p className="text-muted-foreground text-xs">Marque seu horário pelo app</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Itaim Paulista, SP</p>
                <p className="text-muted-foreground text-xs">Tv. Nicola de Giosa, 37</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <p className="text-primary text-sm font-medium tracking-widest uppercase mb-2">O que oferecemos</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Nossos Serviços</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Tratamentos especializados para realçar a beleza e saúde dos seus cabelos
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(services ?? []).slice(0, 8).map((service) => (
              <Card key={service.id} className="skr-card-hover border-border cursor-pointer">
                <CardContent className="p-5 text-center">
                  <div className="text-3xl mb-3">{SERVICE_ICONS[service.name] ?? "✂️"}</div>
                  <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">{service.name}</h3>
                  <p className="text-muted-foreground text-xs line-clamp-2">{service.description}</p>
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} />
                    <span>{service.durationMinutes} min</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/servicos">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                Ver todos os serviços
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Ofertas em destaque */}
      {offers && offers.length > 0 && (
        <section className="py-16 skr-gradient">
          <div className="container">
            <div className="text-center mb-10">
              <p className="text-primary text-sm font-medium tracking-widest uppercase mb-2">Não perca</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Ofertas & Novidades</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.slice(0, 3).map((offer) => (
                <Card key={offer.id} className="skr-card-hover border-border overflow-hidden">
                  <CardContent className="p-6">
                    <Badge className={offer.type === "offer" ? "bg-primary text-primary-foreground mb-3" : "bg-accent text-accent-foreground mb-3"}>
                      {offer.type === "offer" ? "🏷️ Oferta" : "✨ Novidade"}
                    </Badge>
                    <h3 className="font-bold text-lg text-foreground mb-2">{offer.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">{offer.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/ofertas">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                  Ver todas as ofertas
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA WhatsApp */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-3">Ficou com dúvidas?</h2>
          <p className="text-pink-100 mb-6 max-w-md mx-auto">
            Entre em contato diretamente com a Karine pelo WhatsApp para tirar dúvidas ou finalizar seu agendamento.
          </p>
          <a
            href="https://wa.me/5511910928534?text=Olá%20Karine!%20Gostaria%20de%20agendar%20um%20horário."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-white text-primary hover:bg-pink-50 gap-2 font-semibold">
              <MessageCircle size={20} />
              Falar no WhatsApp
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Studio Karine Reverte</p>
              <p className="text-sm opacity-70">Tv. Nicola de Giosa, 37 — Itaim Paulista, São Paulo</p>
            </div>
            <div className="text-sm opacity-70 text-center md:text-right">
              <p>WhatsApp: (11) 91092-8534</p>
              <p>Seg–Sex: 9h–19h | Sáb: 9h–17h</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs opacity-50">
            © {new Date().getFullYear()} Studio Karine Reverte. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <WhatsAppFab />
    </div>
  );
}
