
export interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  value: number;
  change24h: number;
  isEncrypted: boolean;
  isDecrypted?: boolean;
  logo: string;
  address?: string;
  decimals?: number;
}

export interface TokenContextType {
  tokens: Token[];
  isLoading: boolean;
  decryptToken: (id: string) => void;
  sendToken: (id: string, to: string, amount: string) => Promise<boolean>;
}
