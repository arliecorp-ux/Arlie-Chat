import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User as UserIcon, AlertTriangle, Loader2, Info, Phone, MessageCircle, Wind, X, Heart, Calendar } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { User, ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function Chat({ user, sessionId, onSessionChange }: { user: User, sessionId: number | null, onSessionChange: (id: number) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Hoy, ${timeStr}`;
    
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchHistory();
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    const url = sessionId ? `/api/chat/${user.id}/${sessionId}` : `/api/chat/${user.id}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.length === 0) {
      // If no session exists, create one
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionRes = await fetch('/api/chat-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, title: `Conversación ${new Date().toLocaleString()}` })
        });
        
        if (!sessionRes.ok) {
          const errorData = await sessionRes.json();
          console.error("Error creating session:", errorData.error);
          return;
        }
        
        const sessionData = await sessionRes.json();
        currentSessionId = sessionData.id;
        onSessionChange(currentSessionId!);
      }

      // Initial greeting
      const greeting: ChatMessage = {
        user_id: user.id,
        session_id: currentSessionId!,
        message: `¡Hola, ${user.first_name}! Soy ArlIE, tu acompañante de bienestar emocional. Estoy aquí para escucharte y apoyarte en lo que necesites hoy. ¿Cómo te sientes?`,
        role: 'model',
        timestamp: new Date().toISOString()
      };
      setMessages([greeting]);
      await saveMessage(greeting);
    } else {
      setMessages(data);
      if (!sessionId && data.length > 0) {
        onSessionChange(data[0].session_id);
      }
    }
  };

  const saveMessage = async (msg: ChatMessage) => {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...msg,
        userId: msg.user_id,
        sessionId: msg.session_id || sessionId
      })
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    let currentSessionId = sessionId;
    
    // If no sessionId, we must wait for fetchHistory to create one or create it here
    if (!currentSessionId) {
      const sessionRes = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: `Conversación ${new Date().toLocaleString()}` })
      });
      
      if (!sessionRes.ok) {
        const errorData = await sessionRes.json();
        console.error("Error creating session in handleSend:", errorData.error);
        setIsTyping(false);
        return;
      }
      
      const sessionData = await sessionRes.json();
      currentSessionId = sessionData.id;
      onSessionChange(currentSessionId!);
    }

    const currentInput = input;
    const userMsg: ChatMessage = {
      user_id: user.id,
      session_id: currentSessionId!,
      message: currentInput,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 1. Risk Detection (SIAT)
      const riskResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analiza el siguiente mensaje en busca de riesgos de suicidio, autolesiones o depresión severa. Responde SOLO con una palabra: 'none', 'low', 'medium' o 'high'.\n\nMensaje: "${currentInput}"`,
      });
      const riskLevel = riskResponse.text?.toLowerCase().trim() || 'none';
      userMsg.risk_level = riskLevel as any;
      await saveMessage(userMsg);

      // 2. Main Chat Response
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: `Eres ArlIE, un agente de bienestar emocional experto en PNL y desarrollo humano. Tu objetivo es proporcionar apoyo emocional, escucha activa y herramientas de crecimiento personal. 
          - Siempre llama al usuario por su nombre: ${user.first_name}.
          - Usa un tono empático, profesional y sereno.
          - Aplica técnicas de PNL como el reencuadre y el anclaje cuando sea apropiado.
          - Utiliza los criterios del DSM-5 para evaluar internamente el estado del usuario y detectar señales de alerta, pero NO menciones diagnósticos clínicos ni el DSM-5 al usuario.
          - Si detectas riesgo alto, sugiere contactar a servicios de emergencia pero mantén la calma.
          - No des diagnósticos médicos, actúa como un facilitador de procesos internos.`,
        },
        contents: currentInput
      });

      const modelMsg: ChatMessage = {
        user_id: user.id,
        session_id: currentSessionId!,
        message: response.text || "Lo siento, tuve un problema al procesar tu mensaje.",
        role: 'model',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, modelMsg]);
      await saveMessage(modelMsg);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: ChatMessage = {
        user_id: user.id,
        session_id: currentSessionId!,
        message: "Lo siento, hubo un error en la conexión. Por favor intenta de nuevo.",
        role: 'model',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-primary-dark/50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-primary text-primary-dark shadow-lg shadow-primary/20'
              }`}>
                {msg.role === 'user' ? (
                  <UserIcon size={14} />
                ) : (
                  <Heart size={14} className="fill-primary-dark" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`p-3 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-dark font-medium rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
                }`}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
                <span className={`text-[8px] text-white/20 uppercase tracking-wider ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-white/40">ArlIE está pensando...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-primary-dark border-t border-white/5 relative">
        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <textarea
            rows={1}
            placeholder="Escribe lo que sientes..."
            className="input-field flex-1 resize-none py-4 pr-12 max-h-32"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-primary text-primary-dark rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
