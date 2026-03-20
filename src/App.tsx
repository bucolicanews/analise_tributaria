import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Comparison from "./pages/Comparison";
import Audit from "./pages/Audit";
import ImpactAnalysis from "./pages/ImpactAnalysis";
import ProductList from "./pages/ProductList";
import Configuracao from "./pages/Configuracao";
import Viabilidade from "./pages/Viabilidade";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const RotaProtegida: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { autenticado } = useAuth();
  return autenticado ? <>{children}</> : <Navigate to="/" replace />;
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/precificacao" element={<Pricing />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/configuracao" element={<Configuracao />} />
      <Route path="/chat" element={<RotaProtegida><Chat /></RotaProtegida>} />
      <Route path="/comparison" element={<RotaProtegida><Comparison /></RotaProtegida>} />
      <Route path="/impact" element={<RotaProtegida><ImpactAnalysis /></RotaProtegida>} />
      <Route path="/new-business" element={<RotaProtegida><Viabilidade /></RotaProtegida>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;