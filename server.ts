import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Security: parse incoming JSON bodies with strict size limits
app.use(express.json({ limit: '10mb' }));

// Health and service configuration status
app.get('/api/status', (req: Request, res: Response) => {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    !process.env.GEMINI_API_KEY.includes('MY_GEMINI_API_KEY')
  );

  const supabaseConfigured = Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_ANON_KEY &&
    process.env.SUPABASE_URL.trim() !== '' &&
    !process.env.SUPABASE_URL.includes('YOUR_SUPABASE')
  );

  res.json({
    ok: true,
    geminiConfigured,
    supabaseConfigured,
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// Secure server-side Gemini AI assistant proxy
app.post('/api/ai/ask', async (req: Request, res: Response) => {
  try {
    const { prompt, structuredContext } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'A text prompt is required.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isKeyValid = Boolean(
      apiKey &&
      apiKey.trim() !== '' &&
      !apiKey.includes('MY_GEMINI_API_KEY')
    );

    // Context summary stringification
    const contextJson = structuredContext
      ? JSON.stringify(structuredContext, null, 2)
      : 'No context provided';

    // System instructions strictly enforcing prompt guidelines
    const systemInstruction = `You are Invest360 AI, an educational investment intelligence assistant for a FinTech platform.
You are given the user's actual application-calculated portfolio summary in structured JSON format.

CRITICAL RULES:
1. GROUNDING IN APPLICATION NUMBERS: The application computes all financial metrics (net worth, cost basis, P/L, concentration, allocations, and yields). You must explain and interpret these pre-calculated metrics. NEVER calculate, fabricate, or hallucinate alternate numbers.
2. CITATION OF ACTUAL METRICS: When discussing portfolio figures, cite the exact numbers from the provided context (e.g. Total Market Value, Asset Allocation %, Top 3 Holdings).
3. EDUCATIONAL NOT ADVICE: Provide factual educational explanations (e.g., explaining why a portfolio is equity-heavy, how bonds reduce drawdowns, what REITs and InvITs are, what concentration risk implies). Always maintain a clear educational tone and disclaim that your answers are educational insights, not personal financial advice.
4. UNCERTAINTY & DATA QUALITY: If the data quality report shows missing ISINs, price discrepancies across broker feeds, or unverified quotes, explicitly call them out. Distinguish sample illustrative portfolio data from verified user entries.
5. FORMATTING: Use clean markdown with concise bullet points, bold key terms, and readable paragraphs.`;

    if (!isKeyValid) {
      // Deterministic educational fallback when API key is not yet configured in environment secrets
      const fallbackResponse = generateDeterministicExplanation(prompt, structuredContext);
      res.json({
        answer: fallbackResponse,
        model: 'deterministic-fallback',
        isDemoFallback: true,
        notice: 'Gemini API key is not configured in user secrets. Response generated via deterministic rule engine.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Initialize modern @google/genai SDK server-side
    const ai = new GoogleGenAI({ apiKey });

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `CURRENT PORTFOLIO STRUCTURED CONTEXT:\n\`\`\`json\n${contextJson}\n\`\`\`\n\nUSER QUESTION:\n${prompt}`,
          },
        ],
      },
    ];

    let answer: string;
    let usedModel = 'gemini-3.8-flash';
    let isDemoFallback = false;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout contacting Gemini API')), 4500)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.2, // Low temperature for high factual precision
          },
        }),
        timeoutPromise,
      ]);

      answer = response.text || 'Unable to generate response from portfolio model.';
    } catch (networkErr: any) {
      console.warn('Gemini call fell back to deterministic engine:', networkErr?.message);
      answer = generateDeterministicExplanation(prompt, structuredContext);
      usedModel = 'grounded-deterministic-engine';
      isDemoFallback = true;
    }

    res.json({
      answer,
      model: usedModel,
      isDemoFallback,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/ai/ask:', error);
    res.status(500).json({
      error: error?.message || 'Failed to process AI query.',
      details: 'Check server logs or verify GEMINI_API_KEY secret.',
    });
  }
});

// Deterministic rule-based response generator when API key is in demo mode
function generateDeterministicExplanation(prompt: string, context: any): string {
  const p = prompt.toLowerCase();
  const metrics = context?.portfolioMetrics;
  const allocations = context?.assetAllocation || [];
  const topHoldings = context?.topHoldings || [];
  const curr = context?.baseCurrency || 'USD';

  if (p.includes('equity') || p.includes('heavy') || p.includes('stock')) {
    const eq = allocations.find((a: any) => a.assetClass === 'Equity');
    const pct = eq ? eq.percentage : 0;
    return `### Equity Allocation Analysis\n\nYour portfolio is currently **${pct}% allocated to Equities** (${curr} ${eq?.marketValue?.toLocaleString() || 0} across ${eq?.count || 0} holdings).\n\n- **Why it is equity-heavy**: Equities represent the dominant capital appreciation engine in your portfolio. While advantageous during broad market rallies, this weight exposes your net worth to higher short-term beta volatility.\n- **Risk considerations**: A standard risk-balanced benchmark typically maintains a 60/40 or 70/30 split between equities and fixed-income/defensive assets. Current fixed income and real asset exposure provides a partial cushion.\n\n*(Note: This is an educational explanation based on your pre-calculated metrics, not personalized financial advice.)*`;
  }

  if (p.includes('bond') || p.includes('debt') || p.includes('percentage is allocated')) {
    const b = allocations.find((a: any) => a.assetClass === 'Bond');
    const pct = b ? b.percentage : 0;
    return `### Bond & Fixed Income Exposure\n\nYour portfolio has **${pct}% allocated to Bonds** (${curr} ${b?.marketValue?.toLocaleString() || 0} across ${b?.count || 0} holdings).\n\n- **Role of Bonds**: Bonds act as a contractual income generator and volatility dampener. They pay periodic coupon interest and return principal at maturity date.\n- **Portfolio effect**: While equities fluctuate with market sentiment, bonds provide predictable yields that help preserve capital during equity drawdowns.\n\n*(Note: Educational analysis based on application-computed allocations.)*`;
  }

  if (p.includes('three') || p.includes('largest') || p.includes('concentration')) {
    const top3 = topHoldings.slice(0, 3);
    const top3Symbols = top3.map((h: any) => `${h.symbol} (${h.portfolioWeightPercent}%)`).join(', ');
    const top3Weight = metrics?.topThreeConcentrationPercent || 0;
    return `### Top 3 Holdings Concentration\n\nYour top 3 holdings account for **${top3Weight}% of your total portfolio**:\n\n${top3.map((h: any, i: number) => `${i + 1}. **${h.symbol}** (${h.securityName}): ${h.portfolioWeightPercent}% of portfolio (${curr} ${h.marketValue?.toLocaleString()})`).join('\n')}\n\n- **Concentration Risk**: Holding more than 35-40% of net worth in just three securities means single-company earnings misses or sector headwinds will disproportionately impact your total net worth.\n- **Rebalancing consideration**: Institutional portfolios often cap individual positions at 10-15% to maintain risk dispersion.\n\n*(Note: Educational explanation based on your pre-calculated concentration data.)*`;
  }

  if (p.includes('reit') || p.includes('invit')) {
    return `### Understanding REITs & InvITs\n\nBoth **REITs** and **InvITs** are pooled pass-through vehicles designed to distribute steady contractual cash flows:\n\n1. **REITs (Real Estate Investment Trusts)**:\n   - Own commercial properties like warehouses, office parks, and residential complexes.\n   - Required by law in most jurisdictions to distribute **90% of net taxable rental income** to unitholders as dividends.\n\n2. **InvITs (Infrastructure Investment Trusts)**:\n   - Own concession assets like highway toll roads, power transmission grids, and renewable energy plants.\n   - Distribute **85% to 90%+ of net cash flows** from toll collections and energy tariffs, typically yielding 7.5% - 9.5%+.\n\n- **Benefits in your portfolio**: They provide inflation-hedged yields and steady cash distributions that reduce dependency on equity price gains.\n\n*(Note: Educational explanation of financial instruments.)*`;
  }

  if (p.includes('p/l') || p.includes('unrealized') || p.includes('gain') || p.includes('loss')) {
    const pl = metrics?.totalUnrealizedPL || 0;
    const plPct = metrics?.totalUnrealizedPLPercent || 0;
    const isPos = pl >= 0;
    return `### Unrealized Profit / Loss Breakdown\n\nYour unified portfolio holds an **unrealized P/L of ${isPos ? '+' : ''}${curr} ${pl.toLocaleString()} (${isPos ? '+' : ''}${plPct}%)**.\n\n- **What this means**: \"Unrealized\" indicates paper gains or losses based on the difference between your volume-weighted purchase cost basis (${curr} ${metrics?.totalInvestedValue?.toLocaleString()}) and current market quotes (${curr} ${metrics?.totalMarketValue?.toLocaleString()}).\n- **Tax implications**: Unrealized P/L is not a taxable event until lots are formally sold or redeemed on an exchange.\n\n*(Note: Educational breakdown of application-calculated P/L.)*`;
  }

  return `### Portfolio Intelligence Overview\n\nBased on your application-calculated metrics:\n- **Total Net Worth**: ${curr} ${metrics?.totalMarketValue?.toLocaleString()}\n- **Cost Basis**: ${curr} ${metrics?.totalInvestedValue?.toLocaleString()}\n- **Unrealized Return**: ${metrics?.totalUnrealizedPLPercent}%\n- **Top 3 Concentration**: ${metrics?.topThreeConcentrationPercent}%\n- **Distinct Securities**: ${metrics?.distinctSecuritiesCount} assets across ${metrics?.connectedSourcesCount} connected accounts.\n\nAsk a specific question about your equity allocation, bond exposure, top holdings, or asset classes to explore in depth!`;
}

// Dev & Production serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Invest360 server running on http://0.0.0.0:${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
