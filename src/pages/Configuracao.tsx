import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from 'lucide-react';

const Configuracao = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página será usada para configurar parâmetros globais da aplicação.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracao;