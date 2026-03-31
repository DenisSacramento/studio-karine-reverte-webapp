import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Servicos from "./pages/Servicos";
import Agendar from "./pages/Agendar";
import Ofertas from "./pages/Ofertas";
import Perfil from "./pages/Perfil";
import MeusAgendamentos from "./pages/MeusAgendamentos";
import Admin from "./pages/Admin";
import AdminOfertas from "./pages/AdminOfertas";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/servicos" component={Servicos} />
      <Route path="/agendar" component={Agendar} />
      <Route path="/ofertas" component={Ofertas} />
      <Route path="/perfil" component={Perfil} />
      <Route path="/meus-agendamentos" component={MeusAgendamentos} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/ofertas" component={AdminOfertas} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
