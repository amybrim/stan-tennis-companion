import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GuestSessionProvider } from "./contexts/GuestSessionContext";
import StanLayout from "./components/StanLayout";
import MorningBriefing from "./pages/MorningBriefing";
import CompanionChat from "./pages/CompanionChat";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import PickBattle from "./pages/PickBattle";
import MemoryKeeper from "./pages/MemoryKeeper";
import FamilyDrops from "./pages/FamilyDrops";
import TennisTriva from "./pages/TennisTriva";

function Router() {
  return (
    <StanLayout>
      <Switch>
        <Route path="/" component={MorningBriefing} />
        <Route path="/chat" component={CompanionChat} />
        <Route path="/tournaments" component={Tournaments} />
        <Route path="/tournaments/:name/:tour" component={TournamentDetail} />
        <Route path="/picks" component={PickBattle} />
        <Route path="/memories" component={MemoryKeeper} />
        <Route path="/drops" component={FamilyDrops} />
        <Route path="/trivia" component={TennisTriva} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </StanLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <GuestSessionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </GuestSessionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
