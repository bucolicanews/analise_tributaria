import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, Wrench, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, sendChatMessage } from '@/lib/geminiService';
import { loadDynamicSkills } from '@/lib/skills/taxSkills';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

export const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiKey = localStorage.getItem('jota-gemini-key') || '';

  useEffect(() => {
    const skills = loadDynamicSkills().filter(s => s.isActive).map(s => s.name);
    setAvailableSkills(skills);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, activeTool]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!apiKey) {
      toast.error("Configure sua Gemini API Key nas Configurações primeiro.");
      return;
    }

    const userMsg: ChatMessage = { role: 'user', parts: [{ text: input }] };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);
    setActiveTool(null);

    try {
      const responseText = await sendChatMessage(newHistory, apiKey, (toolName) => {
        setActiveTool(toolName);
      });

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
    } catch (error: any) {
      toast.error("Erro no chat: " + error.message);
    } finally {
      setIsLoading(false);
      setActiveTool(null);
    }
  };

  const clearChat = () => {
    if (confirm("Deseja limpar o histórico do chat?")) {
      setMessages([]);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] shadow-elegant border-primary/20">
      <CardHeader className="border-b border-border/50 bg-muted/20 py-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Consultor JOTA AI</CardTitle>
            <p className="text-[10px] text-muted-foreground">Conectado às suas Skills e Ferramentas</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {availableSkills.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Skills Ativas:</span>
              <div className="flex gap-1">
                {availableSkills.map(s => (
                  <Badge key={s} variant="outline" className="text-[8px] py-0 h-4 bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={clearChat} title="Limpar Chat">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
                <Sparkles className="h-12 w-12 text-primary" />
                <div>
                  <p className="font-bold">Como posso ajudar hoje?</p>
                  <p className="text-xs">Você pode me perguntar sobre cálculos, endereços ou análises tributárias.</p>
                  {availableSkills.length > 0 && (
                    <p className="text-[10px] mt-2 text-emerald-600 font-medium">
                      Tenho acesso a: {availableSkills.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {messages.filter(m => m.role !== 'function').map((msg, idx) => (
              <div key={idx} className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
                )}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-card border border-border rounded-tl-none"
                )}>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.parts[0].text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {activeTool && (
              <div className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Wrench className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-4 py-2 text-[10px] font-mono text-emerald-600">
                  Usando ferramenta: <span className="font-bold">{activeTool}</span>...
                </div>
              </div>
            )}

            {isLoading && !activeTool && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
                  <Bot className="h-4 w-4 text-primary animate-bounce" />
                </div>
                <div className="bg-muted/30 rounded-2xl px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Processando...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 bg-muted/10">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              placeholder="Digite sua dúvida técnica ou peça um cálculo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-background"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/90">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[9px] text-center text-muted-foreground mt-2">
            O Consultor JOTA AI utiliza suas Skills configuradas para fornecer respostas precisas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};