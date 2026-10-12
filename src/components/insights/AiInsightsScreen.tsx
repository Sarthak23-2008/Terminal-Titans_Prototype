import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  Cpu,
  Sliders,
  DollarSign,
  Send,
  RefreshCw,
  MessageSquare,
  Bot,
  User,
  HelpCircle,
  Shield,
  FileCode,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { generatePortfolioInsights } from '../../utils/insightsEngine';
import { formatCurrency, formatPercentage } from '../../utils/calculations';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  model?: string;
  isError?: boolean;
}

const PRESET_QUESTIONS = [
  'Why is my portfolio equity-heavy?',
  'What percentage is allocated to bonds?',
  'Which three holdings represent the largest share of my portfolio?',
  'Explain my unrealized P/L.',
  'What are REITs and InvITs?',
  'What risks should I understand about concentrated holdings?',
];

export const AiInsightsScreen: React.FC = () => {
  const { summary, consolidatedHoldings, currency, setActiveScreen, structuredAIContext } = usePortfolio();

  const insights = generatePortfolioInsights(summary, consolidatedHoldings, currency);

  // Deterministic Stress Test Simulator State
  const [equityShock, setEquityShock] = useState<number>(-10);
  const [bondShock, setBondShock] = useState<number>(3);

  const equityHoldings = consolidatedHoldings.filter((h) => h.assetClass === 'Equity');
  const bondHoldings = consolidatedHoldings.filter((h) => h.assetClass === 'Bond');

  const currentEquityValue = equityHoldings.reduce((sum, h) => sum + h.totalMarketValue, 0);
  const currentBondValue = bondHoldings.reduce((sum, h) => sum + h.totalMarketValue, 0);

  const simulatedEquityDelta = (currentEquityValue * equityShock) / 100;
  const simulatedBondDelta = (currentBondValue * bondShock) / 100;
  const totalSimulatedDelta = simulatedEquityDelta + simulatedBondDelta;
  const simulatedTotalPortfolio = summary.totalMarketValue + totalSimulatedDelta;

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **Invest360 Investment Intelligence Assistant** powered by **Gemini 3.8 Flash**.\n\nAll financial figures (Net worth: **${formatCurrency(summary.totalMarketValue, currency)}**, Top 3 weight: **${summary.topThreeConcentration}%**, Unrealized P/L: **${formatPercentage(summary.totalUnrealizedPLPercent)}**) are pre-computed deterministically by the platform. I explain these metrics and provide educational asset class guidance.\n\nClick any of the suggested questions below or ask your own question!`,
      timestamp: 'Just now',
      model: 'gemini-3.8-flash',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      {
        id: userMsgId,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setChatMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);
    setLastFailedPrompt(null);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          structuredContext: structuredAIContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.answer || 'No answer returned.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: data.model || 'gemini-3.8-flash',
        },
      ]);
    } catch (err: any) {
      console.error('Failed to query AI assistant:', err);
      setLastFailedPrompt(text);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Unable to connect to AI Assistant**: ${err.message || 'Network error'}. Please check server connectivity or try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'positive':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'warning':
        return <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'positive':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-teal-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                Gemini 3.8 Flash Integrated
              </span>
              <span className="text-xs text-slate-400 font-mono">Server-Side Proxy Active</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-teal-400" />
              Unified Portfolio Intelligence & AI Assistant
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ask questions directly against your application-calculated metrics. The AI assistant explains real allocations, concentration risks, and cash flow structures without fabricating numbers.
            </p>
          </div>

          <div className="shrink-0 bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 text-right">
            <span className="text-[11px] text-slate-300 uppercase block font-semibold">Active Signals</span>
            <span className="text-2xl font-bold font-mono text-teal-300">{insights.length} Detected</span>
          </div>
        </div>
      </div>

      {/* Interactive Gemini AI Assistant Chat Panel */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Chat Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">Invest360 Gemini Assistant</h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Grounded in application-computed portfolio metrics • Educational context only
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setChatMessages([
                {
                  id: 'welcome-reset',
                  sender: 'assistant',
                  text: 'Chat history cleared. What questions can I answer about your portfolio allocation, top holdings, or asset classes?',
                  timestamp: 'Just now',
                },
              ]);
            }}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
          >
            Clear Chat
          </button>
        </div>

        {/* Suggested Quick Question Pills */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/70 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 px-1">
            Suggested Portfolio Queries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 font-medium transition-all shadow-2xs whitespace-nowrap disabled:opacity-50 text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Log */}
        <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto bg-slate-50/30">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed space-y-2">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4 key={pIdx} className="font-bold text-sm text-slate-900 pt-1">
                            {paragraph.replace('### ', '')}
                          </h4>
                        );
                      }
                      return <p key={pIdx}>{paragraph}</p>;
                    })}
                  </div>

                  <div className="mt-2 pt-1 border-t border-slate-100/30 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.model && <span className="font-mono text-[9px]">{msg.model}</span>}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 items-center text-slate-500 text-xs pl-1">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl text-xs flex items-center gap-2 text-slate-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Invest360 Gemini model is reasoning over portfolio metrics...</span>
              </div>
            </div>
          )}

          {/* Retry prompt if last failed */}
          {lastFailedPrompt && !isLoading && (
            <div className="flex justify-center">
              <button
                onClick={() => handleSendMessage(lastFailedPrompt)}
                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-300"
              >
                <RefreshCw className="w-3 h-3" /> Retry Last Question
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask a question about your portfolio metrics, allocation, or risk..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-2.5 bg-slate-900 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-teal-400" />
            Ask AI
          </button>
        </div>

        {/* Compliance Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            Pre-computed non-hallucinatory metrics passed via secure server endpoint
          </span>
          <span className="font-medium text-slate-700">Educational Insights • Not Financial Advice</span>
        </div>
      </div>

      {/* Insight Signal Cards */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-slate-900">Deterministic Portfolio Diagnostics</h3>

        <div className="grid grid-cols-1 gap-3.5">
          {insights.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {getSeverityIcon(item.severity)}
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{item.title}</h4>
                    <span className="text-[11px] text-slate-600 uppercase font-mono tracking-wider">
                      Category: {item.category}
                    </span>
                  </div>
                </div>

                {item.impactMetric && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border self-start sm:self-auto ${getSeverityBadge(
                      item.severity
                    )}`}
                  >
                    {item.impactMetric}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                {item.description}
              </p>

              {item.actionableStep && (
                <div className="ml-8 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="font-medium">{item.actionableStep}</span>
                  </div>
                  <button
                    onClick={() => setActiveScreen('investments')}
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 shrink-0"
                  >
                    Rebalance
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Deterministic Portfolio Stress Test Scenario */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Deterministic Stress Test Simulator
              </h3>
              <p className="text-xs text-slate-600">
                Model market volatility impacts directly on your consolidated holdings
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            Real Holdings Simulation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Equity Shock Scenario ({formatCurrency(currentEquityValue, currency)})</span>
                <span className="font-mono text-slate-900">{equityShock}%</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="5"
                value={equityShock}
                onChange={(e) => setEquityShock(parseInt(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>-30% (Severe Crash)</span>
                <span>0% (Neutral)</span>
                <span>+30% (Bull Rally)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Fixed Income / Bond Shift ({formatCurrency(currentBondValue, currency)})</span>
                <span className="font-mono text-slate-900">{bondShock}%</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={bondShock}
                onChange={(e) => setBondShock(parseInt(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>-15% (Rate Hike)</span>
                <span>0% (Stable)</span>
                <span>+15% (Rate Cut Rally)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Projected Unified Impact
            </span>

            <div className="my-2">
              <div className="text-2xl font-bold font-mono tracking-tight text-white">
                {formatCurrency(simulatedTotalPortfolio, currency)}
              </div>
              <div
                className={`text-xs font-mono font-semibold flex items-center gap-1 mt-0.5 ${
                  totalSimulatedDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span>{totalSimulatedDelta >= 0 ? '+' : ''}{formatCurrency(totalSimulatedDelta, currency)}</span>
                <span>
                  ({summary.totalMarketValue > 0 ? ((totalSimulatedDelta / summary.totalMarketValue) * 100).toFixed(2) : 0}%)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-2">
              Your defensive bond & real asset buffers ({formatPercentage(summary.topThreeConcentration)} top 3 weight) moderate broad-market downside exposure.
            </p>
          </div>
        </div>
      </div>

      {/* Structured AI Context Payload Inspector */}
      <StructuredAIContextCard />
    </div>
  );
};

const StructuredAIContextCard: React.FC = () => {
  const { structuredAIContext } = usePortfolio();
  const [isPayloadOpen, setIsPayloadOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(structuredAIContext, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invest360_Structured_AI_Context_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Structured AI Context Grounding Payload
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic metrics supplied to Gemini server-side endpoint
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPayloadOpen(!isPayloadOpen)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            {isPayloadOpen ? 'Collapse JSON' : 'Inspect JSON Payload'}
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Payload'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">
            AI Base Currency
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {structuredAIContext.baseCurrency}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Calculated Locale</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">
            Top Holdings Tracked
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {structuredAIContext.topHoldings.length} Key Assets
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Ranked by Market Value</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">
            Multi-Source Items
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {structuredAIContext.multiSourceConsolidations.length} Consolidated
          </span>
          <span className="text-[10px] text-teal-600 block mt-0.5 font-medium">Reconciled Positions</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">
            Data Quality Flags
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {structuredAIContext.dataQualityReport.priceConflictsCount} Conflicts,{' '}
            {structuredAIContext.dataQualityReport.missingIsinCount} Gaps
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Non-Hallucinatory Audit</span>
        </div>
      </div>

      {isPayloadOpen && (
        <div className="mt-3">
          <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2 rounded-t-xl text-xs font-mono">
            <span>application-structured-context.json</span>
            <span>{jsonString.length} bytes</span>
          </div>
          <pre className="p-4 bg-slate-950 text-teal-300 rounded-b-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800 leading-relaxed select-all">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
};
