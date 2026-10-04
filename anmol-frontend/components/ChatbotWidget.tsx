'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Bot, Send, Loader2, ShoppingBag, MessageSquare, X } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  
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
  
  // Show tooltip immediately if not dismissed before
  useEffect(() => {
    const dismissed = localStorage.getItem('anmol_chatbot_tooltip_dismissed');
    if (!dismissed) {
      setShowTooltip(true);
    }
  }, []);

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

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-100">
        {/* Tooltip Attract Mode */}
        {!isOpen && showTooltip && (
          <div className="absolute bottom-18 right-0 mr-2 mb-2 animate-bounce">
            <div className="bg-white text-gray-800 text-sm font-medium py-2 px-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 relative whitespace-nowrap">
              <span>👋 Need help? Chat with us!</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                  localStorage.setItem('anmol_chatbot_tooltip_dismissed', 'true');
                }}
                className="text-gray-400 hover:text-gray-600 ml-1 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setShowTooltip(false);
              localStorage.setItem('anmol_chatbot_tooltip_dismissed', 'true');
            }
          }}
          className="w-14 h-14 bg-[#85142b] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#6c1023] hover:scale-110 transition-all group focus:outline-none"
          aria-label="Toggle chatbot"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-87.5 sm:w-100 h-125 max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-gray-200 flex flex-col z-100 overflow-hidden transform transition-all duration-300 origin-bottom-right">
          
          {/* Header */}
          <div className="bg-[#85142b] p-4 flex items-center shadow-md">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Anmol Assistant</h3>
              <p className="text-white/80 text-xs">Always here to help</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                <Bot className="w-10 h-10 opacity-20" />
                <p className="text-center text-sm">Hi! How can I help you today?<br/>Try asking: "What is your return policy?"</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <div className="w-6 h-6 rounded-full bg-[#85142b] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                    m.role === 'user' 
                      ? 'bg-[#85142b] text-white rounded-tr-sm' 
                      : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                  }`}>
                    {/* Render message parts */}
                    {(m as any).parts?.map((part: any, index: number) => {
                      // Text part
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
                               <div key={index} className="my-2 space-y-2 bg-gray-50 border border-gray-100 p-2 rounded-xl text-gray-800 text-xs">
                                 <div className="flex items-center font-bold text-[#85142b] mb-1">
                                   <ShoppingBag className="w-3 h-3 mr-1" />
                                   Found {products.length} items
                                 </div>
                                 {products.length > 0 ? (
                                   <div className="space-y-1">
                                     {products.map((p: any) => (
                                       <Link key={p.id} href={p.link} className="flex justify-between items-center p-1.5 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors">
                                         <span className="font-medium truncate mr-2">{p.name}</span>
                                         <span className="font-bold shrink-0">₹{p.price}</span>
                                       </Link>
                                     ))}
                                   </div>
                                 ) : (
                                   <p className="text-gray-500">No items found.</p>
                                 )}
                               </div>
                             );
                          }
                        } else {
                          return (
                            <div key={index} className="flex items-center text-xs text-[#85142b] font-medium my-1 bg-[#85142b]/5 p-2 rounded">
                              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                              Searching...
                            </div>
                          );
                        }
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))
            )}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-[#85142b] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="max-w-[85%] rounded-2xl px-4 py-3.5 shadow-sm bg-white text-gray-800 rounded-tl-sm border border-gray-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                className="w-full bg-gray-100 border-none rounded-full pl-4 pr-12 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#85142b]/30"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="absolute right-1 w-8 h-8 bg-[#85142b] text-white rounded-full flex items-center justify-center hover:bg-[#6c1023] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
              </button>
            </form>
          </div>
          
        </div>
      )}
    </>
  );
}
