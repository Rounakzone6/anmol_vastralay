'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Bot, Send, User, Loader2, Info, ShoppingBag } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

export default function ChatbotPage() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: () => {
        const token = localStorage.getItem('anmol_token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
      },
    }),
    onError: (err) => alert("AI Error: " + err.message + "\n(Did you add a valid Gemini API Key?)")
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set Welcome Message on mount
  useEffect(() => {
    // Clear any old memory
    localStorage.removeItem('anmol_chat_memory');

    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hi! Welcome to Anmol Vastralay. How may I assist you today?' }]
      } as any]);
    }
  }, [setMessages, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-[#FAFAFA] min-h-[calc(100vh-64px)] py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#85142b]/10 mb-4">
            <Bot className="w-8 h-8 text-[#85142b]" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Anmol Assistant
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            I'm your personal shopping assistant. Ask me about our products, return policies, or shipping details!
          </p>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col h-150 max-h-[70vh]">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <Bot className="w-12 h-12 opacity-20" />
                <p className="text-center">Start a conversation!<br/>Try asking: "What is your return policy?" or "Show me red sarees"</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#85142b] flex items-center justify-center shrink-0 mt-1 shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-[#85142b] text-white rounded-tr-sm' 
                      : 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100'
                  }`}>
                    {/* Render message parts */}
                    {(m as any).parts?.map((part: any, index: number) => {
                      if (part.type === 'text') {
                        return <div key={index} className="whitespace-pre-wrap leading-relaxed">{part.text}</div>;
                      }
                      
                      // Tool invocation part
                      if (part.type === 'tool-invocation' || part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                        const toolInvocation = part.toolInvocation || part;
                        const state = toolInvocation.state || part.state;
                        const toolName = toolInvocation.toolName || part.toolName;
                        
                        if (state === 'output-available' || state === 'result' || part.output) {
                          if (toolName === 'searchProducts') {
                             const products = (toolInvocation.result || part.output)?.products || [];
                             return (
                               <div key={index} className="my-4 space-y-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm text-gray-800">
                                 <div className="flex items-center text-sm font-bold text-[#85142b] mb-2">
                                   <ShoppingBag className="w-4 h-4 mr-2" />
                                   Found {products.length} matching items
                                 </div>
                                 {products.length > 0 ? (
                                   <div className="space-y-2">
                                     {products.map((p: any) => (
                                       <a key={p.id} href={p.link} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                                         <span className="font-medium truncate mr-4">{p.name}</span>
                                         <span className="font-bold shrink-0">₹{p.price}</span>
                                       </a>
                                     ))}
                                   </div>
                                 ) : (
                                   <p className="text-sm text-gray-500">We don't have exactly what you're looking for right now.</p>
                                 )}
                               </div>
                             );
                          }
                        } else {
                          return (
                            <div key={index} className="flex items-center text-sm text-[#85142b] font-medium my-2 bg-[#85142b]/5 p-3 rounded-lg">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Searching our store database...
                            </div>
                          );
                        }
                      }
                      return null;
                    })}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1 shadow-inner">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-[#85142b] flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-[80%] rounded-2xl px-5 py-4 shadow-sm bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                className="w-full bg-gray-50 border-none rounded-full pl-6 pr-14 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#85142b]/20 shadow-inner"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="absolute right-2 w-10 h-10 bg-[#85142b] text-white rounded-full flex items-center justify-center hover:bg-[#6c1023] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </form>
            <div className="mt-3 flex items-center justify-center text-xs text-gray-400">
              <Info className="w-3 h-3 mr-1" /> AI responses can occasionally be inaccurate. Please double-check policies.
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
