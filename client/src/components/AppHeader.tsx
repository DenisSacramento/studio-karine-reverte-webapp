import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { CalendarDays, Gift, LayoutDashboard, LogOut, Menu, Scissors, User, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { logout(); window.location.href = "/"; },
  });

  const navLinks = [
    { href: "/servicos", label: "Serviços", icon: <Scissors size={16} /> },
    { href: "/agendar", label: "Agendar", icon: <CalendarDays size={16} /> },
    { href: "/ofertas", label: "Ofertas", icon: <Gift size={16} /> },
  ];

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-light tracking-[0.3em] text-muted-foreground uppercase">Studio</span>
            <span className="text-lg font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Karine Reverte
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={location === link.href ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
              >
                {link.icon}
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hidden md:flex">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[120px] truncate text-sm">{user?.name ?? "Minha Conta"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Link href="/perfil">
                  <DropdownMenuItem className="cursor-pointer">
                    <User size={14} className="mr-2" /> Meu Perfil
                  </DropdownMenuItem>
                </Link>
                <Link href="/meus-agendamentos">
                  <DropdownMenuItem className="cursor-pointer">
                    <CalendarDays size={14} className="mr-2" /> Meus Agendamentos
                  </DropdownMenuItem>
                </Link>
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer text-primary font-medium">
                        <LayoutDashboard size={14} className="mr-2" /> Painel Admin
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut size={14} className="mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="sm" className="hidden md:flex">
                Entrar / Cadastrar
              </Button>
            </a>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
              <Button
                variant={location === link.href ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2"
              >
                {link.icon} {link.label}
              </Button>
            </Link>
          ))}
          <div className="pt-2 border-t border-border">
            {isAuthenticated ? (
              <>
                <Link href="/perfil" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <User size={16} /> Meu Perfil
                  </Button>
                </Link>
                <Link href="/meus-agendamentos" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <CalendarDays size={16} /> Meus Agendamentos
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-primary">
                      <LayoutDashboard size={16} /> Painel Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-destructive"
                  onClick={() => { logoutMutation.mutate(); setMobileOpen(false); }}
                >
                  <LogOut size={16} /> Sair
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()} onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Entrar / Cadastrar</Button>
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
