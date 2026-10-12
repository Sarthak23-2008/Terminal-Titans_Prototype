import {
  AssetClass,
  ColumnDefinition,
  DataSourceId,
  Holding,
  ParsedRowResult,
  PipelineSummary,
  RowValidationStatus,
  StandardFieldKey,
} from '../types/investment';

export const STANDARD_COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    key: 'symbol',
    label: 'Symbol / Ticker',
    required: true,
    aliases: ['symbol', 'ticker', 'code', 'scrip', 'scrip code', 'stock', 'sec symbol', 'ticker symbol'],
    description: 'Trading symbol (e.g. MSFT, AAPL, UST-10Y)',
  },
  {
    key: 'securityName',
    label: 'Security Name',
    required: true,
    aliases: ['security name', 'security', 'company name', 'name', 'instrument', 'description', 'scrip name', 'asset name', 'company'],
    description: 'Full corporate or issuer name',
  },
  {
    key: 'quantity',
    label: 'Quantity / Units',
    required: true,
    aliases: ['quantity', 'qty', 'shares', 'units', 'volume', 'holding qty', 'balance', 'total units', 'size', 'holding quantity'],
    description: 'Number of units held (> 0)',
  },
  {
    key: 'averageCost',
    label: 'Average Cost / Buy Price',
    required: true,
    aliases: ['average cost', 'avg cost', 'avg price', 'buy price', 'cost basis', 'purchase price', 'cost/unit', 'rate', 'avg rate', 'book price', 'cost price'],
    description: 'Weighted purchase price per unit (>= 0)',
  },
  {
    key: 'currentPrice',
    label: 'Current Market Price',
    required: false,
    aliases: ['current price', 'cmp', 'ltp', 'market price', 'last price', 'close price', 'latest price', 'nav', 'price', 'fair value', 'market quote'],
    description: 'Latest closing or live market price',
  },
  {
    key: 'assetClass',
    label: 'Asset Class',
    required: false,
    aliases: ['asset class', 'asset type', 'type', 'instrument type', 'security type', 'class', 'category', 'asset'],
    description: 'Equity, Bond, REIT, InvIT, or Cash',
  },
  {
    key: 'isin',
    label: 'ISIN Code',
    required: false,
    aliases: ['isin', 'isin code', 'isin no', 'isin number', 'international id', 'isin_code'],
    description: '12-character international security identifier',
  },
  {
    key: 'sector',
    label: 'Sector / Industry',
    required: false,
    aliases: ['sector', 'industry', 'segment', 'sub-industry', 'sector name'],
    description: 'Industry classification',
  },
  {
    key: 'exchange',
    label: 'Exchange',
    required: false,
    aliases: ['exchange', 'market', 'exch', 'exchange code', 'mic'],
    description: 'Listing exchange (e.g. NASDAQ, NYSE, NSE, BSE)',
  },
  {
    key: 'annualDividendYield',
    label: 'Dividend / Coupon Yield (%)',
    required: false,
    aliases: ['yield', 'dividend yield', 'div yield', 'coupon', 'coupon rate', 'interest rate', 'annual yield'],
    description: 'Annual distribution yield percentage',
  },
];

/**
 * Clean a string by removing whitespace and punctuation for fuzzy header matching
 */
function cleanKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Auto-detect mapping between raw CSV headers and standard fields
 */
export function autoDetectColumnMapping(
  rawHeaders: string[]
): Record<StandardFieldKey, string> {
  const mapping: Record<StandardFieldKey, string> = {
    symbol: '',
    securityName: '',
    quantity: '',
    averageCost: '',
    currentPrice: '',
    assetClass: '',
    isin: '',
    sector: '',
    exchange: '',
    annualDividendYield: '',
  };

  const usedHeaders = new Set<string>();

  for (const colDef of STANDARD_COLUMN_DEFINITIONS) {
    const cleanedAliases = colDef.aliases.map(cleanKey);

    // Try exact or alias match
    for (const rawHeader of rawHeaders) {
      if (usedHeaders.has(rawHeader)) continue;

      const cleanedRaw = cleanKey(rawHeader);

      if (cleanedAliases.includes(cleanedRaw)) {
        mapping[colDef.key] = rawHeader;
        usedHeaders.add(rawHeader);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Safe numeric parser that strips currency signs, commas, percentages, and whitespace
 */
export function parseCleanNumber(val: any): { value: number; isValid: boolean; original: string } {
  if (val === undefined || val === null) {
    return { value: 0, isValid: false, original: '' };
  }

  const str = String(val).trim();
  if (str === '') {
    return { value: 0, isValid: false, original: '' };
  }

  // Handle parentheses for negative numbers like (50.25)
  let cleanStr = str;
  const isParenNegative = /^\((.*)\)$/.test(str);
  if (isParenNegative) {
    cleanStr = '-' + str.slice(1, -1);
  }

  // Strip currency symbols: $, ₹, €, £, commas, and percentage signs
  cleanStr = cleanStr.replace(/[$₹€£,%]/g, '').trim();

  const num = parseFloat(cleanStr);
  const isValid = !isNaN(num) && isFinite(num);

  return {
    value: isValid ? num : 0,
    isValid,
    original: str,
  };
}

/**
 * Normalizes varied asset class labels into standardized union types
 */
export function normalizeAssetClass(val?: string): AssetClass {
  if (!val) return 'Equity';

  const cleaned = val.trim().toLowerCase();

  // Bonds / Fixed Income
  if (
    cleaned.includes('bond') ||
    cleaned.includes('debt') ||
    cleaned.includes('treasury') ||
    cleaned.includes('g-sec') ||
    cleaned.includes('sgb') ||
    cleaned.includes('fixed income') ||
    cleaned.includes('sovereign') ||
    cleaned.includes('debenture')
  ) {
    return 'Bond';
  }

  // REITs
  if (cleaned.includes('reit') || cleaned.includes('real estate')) {
    return 'REIT';
  }

  // InvITs
  if (cleaned.includes('invit') || cleaned.includes('infrastructure trust') || cleaned.includes('infra trust')) {
    return 'InvIT';
  }

  // Cash / Liquid
  if (
    cleaned.includes('cash') ||
    cleaned.includes('liquid') ||
    cleaned.includes('money market') ||
    cleaned.includes('sweep')
  ) {
    return 'Cash';
  }

  // Default to Equity
  return 'Equity';
}

/**
 * Basic ISIN format validation: 12 alphanumeric characters, starting with 2 letters
 */
export function isValidISIN(isin?: string): boolean {
  if (!isin) return false;
  const cleaned = isin.trim().toUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(cleaned);
}

/**
 * Standard CSV line parser supporting quoted fields and commas inside quotes
 */
export function parseCSVLines(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string): string[] => {
    const entries: string[] = [];
    let insideQuote = false;
    let entry = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++; // skip escaped quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        entries.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    entries.push(entry.trim());
    return entries;
  };

  const rawHeaders = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = parseLine(lines[i]);
    const rowObj: Record<string, string> = {};

    for (let h = 0; h < rawHeaders.length; h++) {
      const headerKey = rawHeaders[h];
      rowObj[headerKey] = parts[h] !== undefined ? parts[h] : '';
    }

    rows.push(rowObj);
  }

  return { headers: rawHeaders, rows };
}

/**
 * REUSABLE PIPELINE:
 * INPUT → VALIDATE → NORMALIZE → DEDUPLICATE → CONSOLIDATE → ANALYZE
 */
export function runNormalizationPipeline(
  rawHeaders: string[],
  rawRows: Record<string, string>[],
  columnMapping: Record<StandardFieldKey, string>,
  targetSourceId: DataSourceId = 'manual',
  existingHoldings: Holding[] = []
): PipelineSummary {
  const rowResults: ParsedRowResult[] = [];
  const seenFileSymbols = new Set<string>();

  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const rawData = rawRows[i];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract values based on column mapping
    const rawSymbol = columnMapping.symbol ? rawData[columnMapping.symbol] : '';
    const rawName = columnMapping.securityName ? rawData[columnMapping.securityName] : '';
    const rawQty = columnMapping.quantity ? rawData[columnMapping.quantity] : '';
    const rawCost = columnMapping.averageCost ? rawData[columnMapping.averageCost] : '';
    const rawPrice = columnMapping.currentPrice ? rawData[columnMapping.currentPrice] : '';
    const rawAssetClass = columnMapping.assetClass ? rawData[columnMapping.assetClass] : '';
    const rawIsin = columnMapping.isin ? rawData[columnMapping.isin] : '';
    const rawSector = columnMapping.sector ? rawData[columnMapping.sector] : '';
    const rawExchange = columnMapping.exchange ? rawData[columnMapping.exchange] : '';
    const rawYield = columnMapping.annualDividendYield ? rawData[columnMapping.annualDividendYield] : '';

    // 1. Symbol validation
    const symbol = (rawSymbol || '').trim().toUpperCase();
    if (!symbol) {
      errors.push('Missing required Symbol/Ticker');
    }

    // 2. Security Name
    let securityName = (rawName || '').trim();
    if (!securityName) {
      if (symbol) {
        securityName = symbol;
        warnings.push('Security name missing; defaulted to symbol');
      } else {
        errors.push('Missing required Security Name');
      }
    }

    // 3. Quantity validation
    const parsedQty = parseCleanNumber(rawQty);
    if (!parsedQty.isValid) {
      errors.push(`Invalid Quantity numeric value: "${rawQty || 'empty'}"`);
    } else if (parsedQty.value <= 0) {
      errors.push(`Quantity must be strictly positive (> 0), got: ${parsedQty.value}`);
    }

    // 4. Cost Basis validation
    const parsedCost = parseCleanNumber(rawCost);
    if (!parsedCost.isValid) {
      errors.push(`Invalid Average Cost numeric value: "${rawCost || 'empty'}"`);
    } else if (parsedCost.value < 0) {
      errors.push(`Average cost cannot be negative, got: ${parsedCost.value}`);
    }

    // 5. Current Price validation
    let currentPrice = parsedCost.value;
    if (rawPrice && rawPrice.trim()) {
      const parsedPrice = parseCleanNumber(rawPrice);
      if (parsedPrice.isValid) {
        if (parsedPrice.value < 0) {
          warnings.push('Negative current price adjusted to 0');
          currentPrice = 0;
        } else {
          currentPrice = parsedPrice.value;
        }
      } else {
        warnings.push(`Unrecognized current price "${rawPrice}"; defaulted to average cost`);
      }
    } else {
      warnings.push('Current price not provided; defaulted to average cost');
    }

    // 6. ISIN format validation
    const isin = (rawIsin || '').trim().toUpperCase();
    if (isin) {
      if (!isValidISIN(isin)) {
        warnings.push(`ISIN "${isin}" does not conform to 12-char international standard`);
      }
    }

    // 7. Asset Class normalization
    const assetClass = normalizeAssetClass(rawAssetClass);

    // 8. Deduplication checks
    let isDuplicateInFile = false;
    let isDuplicateOfExisting = false;

    if (symbol) {
      const uniqueKey = `${symbol}:${targetSourceId}`;
      if (seenFileSymbols.has(uniqueKey)) {
        isDuplicateInFile = true;
        warnings.push(`Duplicate entry for ${symbol} detected within this file`);
        duplicateCount++;
      } else {
        seenFileSymbols.add(uniqueKey);
      }

      // Check against existing holdings in the same source
      const existingMatch = existingHoldings.find(
        (h) => h.sourceId === targetSourceId && h.symbol === symbol
      );
      if (existingMatch) {
        isDuplicateOfExisting = true;
        warnings.push(
          `Identical security ${symbol} already present in target source ${targetSourceId}. Importing will add as supplementary lot.`
        );
      }
    }

    // Yield parse
    let annualYield: number | undefined;
    if (rawYield) {
      const parsedYield = parseCleanNumber(rawYield);
      if (parsedYield.isValid && parsedYield.value >= 0) {
        annualYield = parsedYield.value;
      }
    }

    // Decide Row Status
    let status: RowValidationStatus = 'valid';
    if (errors.length > 0) {
      status = 'error';
      errorCount++;
    } else if (warnings.length > 0) {
      status = 'warning';
      warningCount++;
      validCount++; // Warning rows are still acceptable
    } else {
      status = 'valid';
      validCount++;
    }

    let normalizedHolding: Omit<Holding, 'id' | 'createdAt'> | undefined;
    if (status !== 'error') {
      normalizedHolding = {
        symbol,
        securityName,
        quantity: parsedQty.value,
        averageCost: parsedCost.value,
        currentPrice,
        assetClass,
        isin: isin || undefined,
        sector: rawSector ? rawSector.trim() : undefined,
        exchange: rawExchange ? rawExchange.trim().toUpperCase() : undefined,
        annualDividendYield: annualYield,
        sourceId: targetSourceId,
        dataQuality: {
          isStale: false,
          hasVerifiedPrice: !!rawPrice,
          priceSource: rawPrice ? 'CSV Import Quote' : 'Cost-Basis Mirror',
          notes: warnings.length > 0 ? warnings.join('; ') : undefined,
        },
      };
    }

    rowResults.push({
      rowIndex: i + 1,
      rawData,
      status,
      errors,
      warnings,
      normalizedHolding,
      isDuplicateInFile,
      isDuplicateOfExisting,
    });
  }

  return {
    totalRows: rawRows.length,
    validCount,
    warningCount,
    errorCount,
    duplicateCount,
    rows: rowResults,
    rawHeaders,
    mapping: columnMapping,
  };
}
