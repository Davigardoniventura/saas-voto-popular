import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProposalDetail from "./pages/ProposalDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VereadorDashboard from "./pages/VereadorDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminPanel from "./pages/SuperAdminPanel";
import PaginaMunicipio from "./pages/PaginaMunicipio";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/proposal/:id"} component={ProposalDetail} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/dashboard"} component={CitizenDashboard} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/vereador"} component={VereadorDashboard} />
      <Route path={"/superadmin/login"} component={SuperAdminLogin} />
      <Route path={"/superadmin"} component={SuperAdminPanel} />
      <Route path={"/cidade/:id"} component={PaginaMunicipio} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
