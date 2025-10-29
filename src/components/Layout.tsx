import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', label: 'Análise de Precificação', icon: Upload },
  { to: '/comparison', label: 'Comparativo de Regimes', icon: BarChart3 },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-gradient-primary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
            <div className="flex items-center text-center sm:text-left gap-3">
              <div className="rounded-lg bg-black/30 p-2 backdrop-blur">
                <img src="/jota-contabilidade-logo.png" alt="Jota Contabilidade Logo" className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">JOTA - Análise Reforma Tributária</h1>
                <p className="text-xs text-black/70">
                  Sistema Inteligente de Precificação
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 flex space-x-4">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <Button
                variant="ghost"
                className={cn(
                  "py-6 px-4 rounded-none border-b-2 transition-colors",
                  location.pathname === item.to
                    ? "border-primary text-primary font-semibold bg-primary/10 hover:bg-primary/20"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          Desenvolvido por Jota Empresas - app_Dyad - ai Gemini
        </div>
      </footer>
    </div>
  );
};