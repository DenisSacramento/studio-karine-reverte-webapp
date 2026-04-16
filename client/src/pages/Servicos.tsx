import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Scissors } from "lucide-react";
import { Link } from "wouter";
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

export default function Servicos() {
  const { data: services, isLoading } = trpc.services.list.useQuery();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      {/* Hero */}
      <section className="skr-gradient py-16 md:py-20 border-b border-border/70 mx-4 mt-4 rounded-[2rem] shadow-sm">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Scissors size={18} className="text-primary" />
            <p className="text-primary text-sm font-medium tracking-widest uppercase">Nossos Serviços</p>
          </div>
          <h1 className="section-title-pink text-4xl md:text-5xl mb-3">
            Tratamentos Especializados
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Cada serviço é realizado com dedicação, produtos de qualidade e muito carinho pela Karine.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 md:py-24">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {(services ?? []).map((service) => (
                <Card key={service.id} className="skr-card-hover border-primary/20 overflow-hidden bg-primary/[0.08] backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{SERVICE_ICONS[service.name] ?? "✂️"}</div>
                      <Badge variant="secondary" className="text-xs">
                        <Clock size={10} className="mr-1" />
                        {service.durationMinutes} min
                      </Badge>
                    </div>
                    <h3 className="service-card-title text-lg text-foreground mb-2">{service.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {service.description}
                    </p>
                    {service.price && (
                      <p className="text-primary font-semibold text-lg mb-4">
                        R$ {Number(service.price).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                    <Link href={`/agendar?serviceId=${service.id}`}>
                      <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Agendar este serviço</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-secondary/30 border-t border-border/70 mx-4 mb-4 rounded-[2rem]">
        <div className="container text-center">
          <p className="text-muted-foreground mb-4">Não encontrou o que procura? Fale diretamente com a Karine!</p>
          <a
            href="https://wa.me/5511910928534?text=Olá%20Karine!%20Tenho%20uma%20dúvida%20sobre%20os%20serviços."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
              Tirar dúvidas pelo WhatsApp
            </Button>
          </a>
        </div>
      </section>

      <WhatsAppFab />
    </div>
  );
}
