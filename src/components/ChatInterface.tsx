import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, Wrench, Trash2, Sparkles, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, sendChatMessage } from '@/lib/geminiService';
import { loadDynamicSkills, DynamicSkill } from '@/lib/skills/taxSkills';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { ChatSidebar, ChatSession } from './ChatSidebar';

const STORAGE_KEY = 'jota-chat-sessions';

export const ChatInterface = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [availableSkills, setAvailableSkills] = useState<DynamicSkill[]>([]);
  const [isManuallyResized, setIsManuallyResized] = useState(false);
  
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastHeightRef = useRef<number>(0);

  const apiKey = localStorage.getItem('jota-gemini-key') || '';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) {
        loadSession(parsed[0].id);
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }
    
    const skills = loadDynamicSkills().filter(s => s.isActive);
    setAvailableSkills(skills);
  }, []);

  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      localStorage.setItem(`jota-chat-msg-${activeSessionId}`, JSON.stringify(messages));
      
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId && s.title === 'Nova Conversa' && messages.length > 0) {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            const text = firstUserMsg.parts[0].text;
            return { ...s, title: text.substring(0, 40) + (text.length > 40 ? '...' : '') };
          }
        }
        return s;
      }));
    }
  }, [messages, activeSessionId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Nova Conversa',
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([]);
  };

  const loadSession = (id: string) => {
    setActiveSessionId(id);
    const savedMsgs = localStorage.getItem(`jota-chat-msg-${id}`);
    setMessages(savedMsgs ? JSON.parse(savedMsgs) : []);
  };

  const deleteSession = (id: string) => {
    if (!confirm("Excluir esta conversa permanentemente?")) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    localStorage.removeItem(`jota-chat-msg-${id}`);
    if (activeSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      if (remaining.length > 0) {
        loadSession(remaining[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const updateSessionTitle = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, title: newTitle } : s
    ));
  };

  useLayoutEffect(() => {
    if (inputRef.current && !isManuallyResized) {
      inputRef.current.style.height = 'inherit';
      const scrollHeight = inputRef.current.scrollHeight;
      const newHeight = Math.max(44, Math.min(scrollHeight, 600));
      inputRef.current.style.height = `${newHeight}px`;
      lastHeightRef.current = newHeight;
    }
  }, [input, isManuallyResized]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    const observer = new ResizeObserver(() => {
      if (textarea.offsetHeight !== lastHeightRef.current && lastHeightRef.current !== 0) {
        setIsManuallyResized(true);
      }
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (input === '' && inputRef.current) {
      setIsManuallyResized(false);
      inputRef.current.style.height = '44px';
      lastHeightRef.current = 44;
    }
  }, [input]);

  // Lógica de rolagem manual no container para evitar scroll na página inteira
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    // Pequeno delay para garantir que o conteúdo do Markdown foi renderizado
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading, activeTool]);

  const filteredSkills = availableSkills.filter(s => 
    s.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    setInput(value);

    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const charBeforeAt = textBeforeCursor[lastAtSymbol - 1];
      if (lastAtSymbol === 0 || charBeforeAt === ' ' || charBeforeAt === '\n') {
        const query = textBeforeCursor.substring(lastAtSymbol + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionFilter(query);
          setShowMentionMenu(true);
          setSelectedIndex(0);
          return;
        }
      }
    }
    setShowMentionMenu(false);
  };

  const insertSkill = (skillName: string) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = input.substring(0, cursorPosition);
    const textAfterCursor = input.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const newValue = input.substring(0, lastAtSymbol) + `@${skillName} ` + textAfterCursor;
    setInput(newValue);
    setShowMentionMenu(false);
    setTimeout(() => {
      inputRef.current?.focus();
      const newPos = lastAtSymbol + skillName.length + 2;
      inputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionMenu && filteredSkills.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredSkills.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredSkills.length) % filteredSkills.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredSkills[selectedIndex]) insertSkill(filteredSkills[selectedIndex].name);
      } else if (e.key === 'Escape') {
        setShowMentionMenu(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  return (
    <Card className="flex h-[calc(100vh-200px)] shadow-elegant border-primary/20 relative overflow-hidden">
      <ChatSidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={loadSession}
        onNewChat={createNewChat}
        onDeleteSession={deleteSession}
        onUpdateTitle={updateSessionTitle}
      />

      <div className="flex-1 flex flex-col bg-background min-w-0">
        <CardHeader className="border-b border-border/50 bg-muted/20 py-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 bg-primary/10 rounded-full shrink-0">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-bold truncate">
                {sessions.find(s => s.id === activeSessionId)?.title || 'Consultor JOTA AI'}
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Conectado às suas Skills e Ferramentas</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {availableSkills.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Skills Ativas:</span>
                <div className="flex gap-1">
                  {availableSkills.slice(0, 3).map(s => (
                    <Badge key={s.id} variant="outline" className="text-[8px] py-0 h-4 bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                      {s.name}
                    </Badge>
                  ))}
                  {availableSkills.length > 3 && <span className="text-[8px] text-muted-foreground">+{availableSkills.length - 3}</span>}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col relative">
          <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
            <div className="space-y-6 max-w-4xl mx-auto pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
                  <Sparkles className="h-12 w-12 text-primary" />
                  <div>
                    <p className="font-bold">Como posso ajudar hoje?</p>
                    <p className="text-xs">Inicie uma nova conversa técnica ou selecione uma anterior.</p>
                    <p className="text-[10px] mt-2 text-primary font-medium">
                      Dica: Digite <span className="font-bold">@</span> para listar suas ferramentas.
                    </p>
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
                    <div className="prose prose-sm prose-invert max-w-none break-words">
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

          <div className="p-4 border-t border-border/50 bg-muted/10 relative overflow-visible">
            {showMentionMenu && filteredSkills.length > 0 && (
              <div className="absolute bottom-full left-4 mb-2 w-72 bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-bottom-2">
                <div className="bg-muted/80 px-3 py-2 border-b border-border flex items-center gap-2">
                  <Terminal className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Minhas Ferramentas</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredSkills.map((skill, idx) => (
                    <div
                      key={skill.id}
                      className={cn(
                        "px-3 py-2 cursor-pointer flex flex-col gap-0.5 transition-colors",
                        idx === selectedIndex ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/30 border-l-4 border-transparent"
                      )}
                      onClick={() => insertSkill(skill.name)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{skill.name}</span>
                        <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase opacity-50">Skill</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{skill.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto flex items-end gap-2">
              <Textarea
                ref={inputRef}
                placeholder="Digite sua dúvida técnica ou use @ para chamar uma Skill..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-background min-h-[44px] max-h-[600px] resize-y py-3 px-4 text-base overflow-y-auto transition-[height] duration-100"
                disabled={isLoading}
                autoComplete="off"
                rows={1}
              />
              <Button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()} 
                className="bg-primary hover:bg-primary/90 h-11 w-11 p-0 shrink-0 mb-0.5"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};