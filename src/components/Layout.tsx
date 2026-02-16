import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3, Settings, Tags, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', label: 'Precificação', icon: Upload },
  { to: '/new-business', label: 'Análise de Viabilidade', icon: Sparkles },
  { to: '/comparison', label: 'Comparativo de Regimes', icon: BarChart3 },
  { to: '/audit', label: 'Auditoria Fiscal', icon: ShieldCheck },
  { to: '/impact', label: 'Análise de Impacto', icon: TrendingUp },
  { to: '/products', label: 'Lista de Produtos', icon: Tags },
  { to: '/configuracao', label: 'Configurações', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-gradient-primary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
            <div className="flex items-center text-center sm:text-left gap-3">
              <div className="rounded-lg bg-black/30 p-2 backdrop-blur">
                <img src="/jota-contabilidade-logo.png" alt="Logo" className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">JOTA - Análise Tributária Lei 214/2025</h1>
                <p className="text-xs text-black/70">Sistema Inteligente de Análise Tributária</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <nav className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 flex space-x-2 overflow-x-auto no-scrollbar py-2">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button
                variant="ghost"
                className={cn(
                  "py-2 px-3 rounded-md transition-colors whitespace-nowrap text-sm",
                  location.pathname === item.to
                    ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </nav>
      <main className="flex-grow">
        {children}
      </main>
      <footer className="border-t border-border bg-card py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">Desenvolvido por Jota Empresas</div>
      </footer>
    </div>
  );
};