import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, MessageCircle, Sparkles, Scissors } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import WhatsAppFab from "@/components/WhatsAppFab";
import { Link } from "wouter";

export default function Ofertas() {
  const { data: offers, isLoading } = trpc.offers.list.useQuery();
  const { data: serviceOffers, isLoading: serviceOffersLoading } = trpc.offers.serviceList.useQuery();

  const offerItems = (offers ?? []).filter((o) => o.type === "offer" && !o.serviceId);
  const newsItems = (offers ?? []).filter((o) => o.type === "news");
  const flashOffers = serviceOffers ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      {/* Hero */}
      <section className="skr-gradient py-16 md:py-20 border-b border-border/70 mx-4 mt-4 rounded-[2rem] shadow-sm">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Gift size={18} className="text-primary" />
            <p className="text-primary text-sm font-medium tracking-widest uppercase">Promoções & Novidades</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Ofertas Especiais
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Fique por dentro das promoções exclusivas e novidades do Studio Karine Reverte.
          </p>
        </div>
      </section>

      <div className="container py-14 md:py-16">
        {isLoading || serviceOffersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (!offers || offers.length === 0) && flashOffers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Gift size={48} className="mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma oferta no momento</h3>
            <p className="text-sm mb-6">Em breve teremos promoções especiais para você!</p>
            <a
              href="https://wa.me/5511910928534?text=Olá%20Karine!%20Gostaria%20de%20saber%20sobre%20promoções."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-primary text-primary gap-2">
                <MessageCircle size={16} /> Perguntar no WhatsApp
              </Button>
            </a>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Flash Offers */}
            {flashOffers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Gift size={20} className="text-primary" />
                  <h2 className="text-2xl font-bold">Ofertas Relampago</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {flashOffers.map((offer) => (
                    <Card key={offer.id} className="skr-card-hover border-border/70 overflow-hidden bg-white/90 backdrop-blur-sm">
                      {offer.serviceImageUrl ? (
                        <div className="h-44 overflow-hidden">
                          <img
                            src={offer.serviceImageUrl}
                            alt={offer.serviceName}
                            className="w-full h-full object-cover saturate-[0.9] contrast-[0.98] brightness-[1.03]"
                          />
                        </div>
                      ) : (
                        <div className="h-44 bg-secondary/40 flex items-center justify-center">
                          <Scissors size={40} className="text-primary/70" />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <Badge className="bg-primary text-primary-foreground mb-3 text-xs">
                          ⚡ Oferta Relampago
                        </Badge>
                        <h3 className="font-bold text-xl text-foreground mb-1">{offer.serviceName}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{offer.offerDescription}</p>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground line-through">
                            R$ {Number(offer.servicePrice ?? 0).toFixed(2).replace(".", ",")}
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            R$ {Number(offer.promotionalPrice ?? 0).toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                        <Link
                          href={`/agendar?serviceId=${offer.serviceId}&promoPrice=${offer.promotionalPrice ?? ""}`}
                        >
                          <Button size="sm" className="w-full">Agendar</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Offers */}
            {offerItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Gift size={20} className="text-primary" />
                  <h2 className="text-2xl font-bold">Ofertas Especiais</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {offerItems.map((offer) => (
                    <Card key={offer.id} className="skr-card-hover border-border/70 overflow-hidden bg-white/90 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <Badge className="bg-primary text-primary-foreground mb-3 text-xs">
                          🏷️ Oferta Especial
                        </Badge>
                        <h3 className="font-bold text-xl text-foreground mb-2">{offer.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{offer.content}</p>
                        {offer.expiresAt && (
                          <p className="text-xs text-muted-foreground mb-4">
                            Válido até: {new Date(offer.expiresAt).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                        <Link href="/agendar">
                          <Button size="sm" className="w-full">Aproveitar oferta</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* News */}
            {newsItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={20} className="text-primary" />
                  <h2 className="text-2xl font-bold">Novidades do Studio</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {newsItems.map((offer) => (
                    <Card key={offer.id} className="skr-card-hover border-border/70 overflow-hidden bg-white/90 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <Badge className="bg-accent text-accent-foreground mb-3 text-xs">
                          ✨ Novidade
                        </Badge>
                        <h3 className="font-bold text-xl text-foreground mb-2">{offer.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{offer.content}</p>
                        {offer.publishedAt && (
                          <p className="text-xs text-muted-foreground">
                            Publicado em: {new Date(offer.publishedAt).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <section className="py-14 bg-secondary/30 border-t border-border/70 mx-4 mb-4 rounded-[2rem]">
        <div className="container text-center">
          <p className="text-muted-foreground mb-4">Quer garantir sua oferta? Agende agora!</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/agendar">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Agendar Horário</Button>
            </Link>
            <a
              href="https://wa.me/5511910928534?text=Olá%20Karine!%20Vi%20as%20ofertas%20no%20app%20e%20quero%20aproveitar!"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 gap-2">
                <MessageCircle size={16} /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <WhatsAppFab />
    </div>
  );
}
