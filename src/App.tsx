import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Comparison from "./pages/Comparison";
import Audit from "./pages/Audit";
import ImpactAnalysis from "./pages/ImpactAnalysis";
import ProductList from "./pages/ProductList";
import Configuracao from "./pages/Configuracao";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/impact" element={<ImpactAnalysis />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/configuracao" element={<Configuracao />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;