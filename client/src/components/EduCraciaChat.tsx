import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, MessageCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface EduCraciaChatProps {
  context?: "citizen" | "vereador" | "admin" | "superadmin";
  onComplaintSubmit?: (complaint: string) => void;
}

export default function EduCraciaChat({ context = "citizen", onComplaintSubmit }: EduCraciaChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = trpc.chat.sendMessage.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mensagem inicial baseada no contexto
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialMessages: Record<string, string> = {
        citizen: "Olá! 👋 Sou o EduCracia, seu assistente de participação cívica. Posso ajudá-lo com dúvidas sobre como cadastrar, votar em propostas, entender o processo legislativo e muito mais. Como posso ajudá-lo hoje?",
        vereador: "Olá, Vereador! 👋 Sou o EduCracia, seu assistente legislativo. Posso ajudá-lo com dúvidas sobre como criar propostas, gerenciar suas proposições, gerar relatórios e acompanhar o engajamento dos cidadãos. Como posso ajudá-lo?",
        admin: "Olá, Administrador! 👋 Sou o EduCracia, seu assistente administrativo. Posso ajudá-lo com moderação de propostas, gestão de vereadores, geração de relatórios consolidados, análise de engajamento e muito mais. Como posso ajudá-lo?",
        superadmin: "Olá, Super Admin! 👋 Sou o EduCracia, seu assistente global. Posso ajudá-lo com gestão de municípios, personalização de temas, análise de estatísticas, monitoramento de logs e gerenciamento da plataforma. Como posso ajudá-lo?",
      };

      const initialMsg: Message = {
        id: "init-" + Date.now(),
        role: "assistant",
        content: initialMessages[context],
        timestamp: new Date(),
      };

      setMessages([initialMsg]);
    }
  }, [isOpen, context, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Detectar se é uma reclamação
      const isComplaint = input.toLowerCase().includes("reclamação") || 
                         input.toLowerCase().includes("reclamar") ||
                         input.toLowerCase().includes("problema") ||
                         input.toLowerCase().includes("erro");

      if (isComplaint && onComplaintSubmit) {
        onComplaintSubmit(input);
          const complaintMsg: Message = {
          id: "assist-" + Date.now(),
          role: "assistant",
          content: "Entendi sua reclamação. 📝 Vou encaminhá-la para a equipe de suporte. Você receberá uma resposta em breve no email cadastrado. Obrigado por nos ajudar a melhorar!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, complaintMsg]);
        
        // Enviar reclamação para o backend
        try {
          await chatMutation.mutateAsync({
            message: input,
            context,
          });
        } catch (err) {
          console.error("Erro ao enviar reclamação:", err);
        }
      } else {
        // Enviar para o chatbot Gemini
        const response = await chatMutation.mutateAsync({
          message: input,
          context,
          conversationHistory: messages,
        });

        const assistantMessage: Message = {
          id: "assist-" + Date.now(),
          role: "assistant",
          content: typeof response.message === "string" ? response.message : JSON.stringify(response.message),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMsg: Message = {
        id: "error-" + Date.now(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
          title="Abrir EduCracia"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm font-semibold hidden sm:inline">EduCracia</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 max-h-96 md:max-h-[600px] flex flex-col shadow-2xl border-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">
                E
              </div>
              <div>
                <h3 className="font-bold">EduCracia</h3>
                <p className="text-xs text-blue-100">Assistente de Participação Cívica</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-slate-900 border border-slate-200 rounded-bl-none"
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-1 last:mb-0">{line}</p>
                    ))}
                  </div>
                  <p className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce animation-delay-100"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce animation-delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4 bg-white space-y-2">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta..."
                disabled={loading}
                className="flex-1 border-slate-300"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Mencione "reclamação" para reportar um problema
            </p>
          </form>
        </Card>
      )}
    </>
  );
}
