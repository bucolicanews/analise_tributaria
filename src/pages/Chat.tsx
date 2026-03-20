import React from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Sparkles } from 'lucide-react';

const Chat = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Chat Consultivo Inteligente</h1>
          <p className="text-sm text-muted-foreground">Converse com a IA integrada às suas ferramentas e base de conhecimento.</p>
        </div>
      </div>
      
      <ChatInterface />
    </div>
  );
};

export default Chat;