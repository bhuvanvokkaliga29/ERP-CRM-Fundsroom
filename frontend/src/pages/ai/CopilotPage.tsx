import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bot, Send, User, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'What are the biggest business risks right now?',
  'Which customers have the highest churn risk?',
  'What is the revenue trend over the last 30 days?',
  'Which products need restocking urgently?',
  'List the top 5 customers by revenue this month',
  'Summarize all overdue follow-ups',
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'I am the Ledger AI Copilot. I have read-only access to your business data — customers, inventory, sales, and follow-ups. I can help you understand trends, identify risks, and surface actionable insights. What would you like to know?',
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: briefData } = useQuery({
    queryKey: ['business-brief'],
    queryFn: () => api.get('/intelligence/business-brief').then(r => r.data.data).catch(() => null),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const q = text || input;
    if (!q.trim() || loading) return;

    setMessages(m => [...m, { role: 'user', content: q, timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const resp = await api.post('/ai/copilot', { message: q });
      const answer = resp.data.data?.response || resp.data.data?.answer || 'I could not process that request.';
      setMessages(m => [...m, { role: 'assistant', content: answer, timestamp: new Date() }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error?.message;
      if (err?.response?.status === 503 || errMsg?.includes('unavailable') || errMsg?.includes('configured')) {
        setMessages(m => [...m, {
          role: 'assistant',
          content: 'The AI service is not configured. Please set up your AI provider API key in the environment variables. The system will continue to function without AI features.',
          timestamp: new Date(),
        }]);
      } else {
        setError('Request failed. Please try again.');
        setMessages(m => [...m, { role: 'assistant', content: 'I encountered an error processing your request. Please try again.', timestamp: new Date() }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-6">
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">AI Copilot</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">Read-only business intelligence assistant</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Business Brief + Quick Prompts */}
        <div className="space-y-6">
          {briefData && (
            <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
              <h3 className="font-medium text-sm uppercase tracking-wide mb-4 text-white">Business Snapshot</h3>
              <div className="space-y-3">
                {briefData.kpis?.map((kpi: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#a1a1aa]">{kpi.label}</span>
                    <span className="font-medium text-white">{kpi.value}</span>
                  </div>
                ))}
              </div>

              {briefData.urgentAlerts?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#27272a] space-y-3">
                  <p className="text-xs text-[#a1a1aa] uppercase tracking-wide font-medium">Alerts</p>
                  {briefData.urgentAlerts.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle size={12} className="text-[#ffda6e] shrink-0 mt-0.5" />
                      <p className="text-xs text-white">{a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
            <p className="text-xs text-[#a1a1aa] uppercase tracking-wide font-medium mb-4">Quick Prompts</p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  disabled={loading}
                  className="w-full text-left text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a] p-2 rounded-sm flex items-start gap-2 transition-colors"
                >
                  <ChevronRight size={12} className="shrink-0 mt-0.5" />
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
            <p className="text-xs text-[#a1a1aa] uppercase tracking-wide font-medium mb-2">Data Policy</p>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              This copilot has read-only access. It cannot modify your data. All queries are grounded in your actual business data — no hallucinations.
            </p>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-3 border border-[#27272a] rounded-md bg-[#09090b] flex flex-col" style={{ height: '70vh' }}>
          <div className="px-6 py-4 border-b border-[#27272a] flex items-center gap-2">
            <Bot size={18} className="text-[#ffda6e]" />
            <span className="font-medium text-sm text-white">Ledger Copilot</span>
            <span className="ml-auto text-xs text-[#a1a1aa]">Read-only · Data grounded</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={clsx('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 border border-[#27272a] bg-black rounded-sm flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-[#ffda6e]" />
                  </div>
                )}
                <div className={clsx('max-w-[80%] rounded-md px-4 py-3 text-sm', msg.role === 'user' ? 'bg-[#27272a] text-white' : 'bg-black border border-[#27272a] text-[#a1a1aa]')}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={clsx('text-xs mt-2', msg.role === 'user' ? 'text-[#a1a1aa] text-right' : 'text-[#a1a1aa]')}>
                    {format(msg.timestamp, 'HH:mm')}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 border border-[#27272a] bg-black rounded-sm flex items-center justify-center shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 border border-[#27272a] bg-black rounded-sm flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-[#ffda6e]" />
                </div>
                <div className="bg-black border border-[#27272a] rounded-md px-4 py-4 flex items-center">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-[#a1a1aa] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#a1a1aa] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#a1a1aa] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#27272a] p-4 bg-[#09090b] rounded-b-md">
            <div className="flex gap-3">
              <input
                className="input-field flex-1"
                placeholder="Ask about your business data..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={loading}
              />
              <button
                className="btn-primary px-3 py-2 disabled:opacity-50"
                onClick={() => send()}
                disabled={loading || !input.trim()}
              >
                {loading ? <RefreshCw size={16} className="animate-spin text-black" /> : <Send size={16} className="text-black" />}
              </button>
            </div>
            <p className="text-xs text-[#a1a1aa] mt-3">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
}
