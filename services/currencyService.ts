
/**
 * Service to fetch real-time exchange rates.
 * Uses the free Open Exchange Rates API (open.er-api.com).
 */

const API_BASE_URL = 'https://open.er-api.com/v6/latest';

// Map app specific codes to ISO 4217 codes if they differ
const CURRENCY_MAP: Record<string, string> = {
  'RM': 'MYR',
  // Standard codes usually match (USD, SGD, etc.)
};

const getIsoCode = (code: string): string => CURRENCY_MAP[code] || code;

export const getExchangeRate = async (fromCurrency: string, toCurrency: string = 'RM'): Promise<number> => {
  if (fromCurrency === toCurrency) return 1;

  const fromIso = getIsoCode(fromCurrency);
  const toIso = getIsoCode(toCurrency);

  try {
    const response = await fetch(`${API_BASE_URL}/${fromIso}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    const data = await response.json();
    
    const rate = data.rates[toIso];
    if (typeof rate === 'number') {
      return rate;
    }
    throw new Error(`Rate not found for ${toIso}`);
  } catch (error) {
    console.error('Currency service error:', error);
    // Return 1 as fallback to prevent app crash, but log error
    return 0;
  }
};
