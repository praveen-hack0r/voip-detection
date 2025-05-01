import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import PacketAnalysis from "@/pages/PacketAnalysis";
import VoipMetadata from "@/pages/VoipMetadata";
import Geolocation from "@/pages/Geolocation";
import WhoisLookup from "@/pages/WhoisLookup";
import History from "@/pages/History";
import Layout from "@/components/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/packet-analysis" component={PacketAnalysis} />
        <Route path="/voip-metadata" component={VoipMetadata} />
        <Route path="/geolocation" component={Geolocation} />
        <Route path="/whois-lookup" component={WhoisLookup} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
