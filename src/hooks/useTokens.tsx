import { useContext } from 'react';
import { useTokenStore } from '@/stores/useTokenStore';
import { useAccount, useChainId, useWriteContract } from 'wagmi';
import { mainnet, sepolia, polygon, optimism, arbitrum } from 'wagmi/chains';
import { toast } from 'sonner';
import { erc20Abi } from '@/utils/erc20Abi';
import { confidentialErc20Abi } from '@/utils/confidentialErc20Abi';
import { Chain, parseUnits } from 'viem';

export type { Token } from '@/types/tokenTypes';
export { default as TokenProvider } from '@/providers/TokenProvider';

export const useTokens = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const tokenStore = useTokenStore();
  
  const { 
    data: hash, 
    isPending,
    isError,
    error,
    isSuccess,
    writeContract 
  } = useWriteContract();

  const sendToken = async (id: string, to: string, amount: string): Promise<boolean> => {
    try {
      const token = tokenStore.tokens.find(t => t.id === id);
      
      if (!token) {
        throw new Error("Token not found");
      }
      
      // Native token transactions are handled separately in NativeTransferForm
      if (token.address === 'native') {
        return tokenStore.sendToken(id, to, amount);
      }
      
      // Get token decimals (default to 18 if not specified)
      const decimals = token.decimals || 18;
      
      // Convert the amount to the correct decimal representation
      const parsedAmount = parseUnits(amount, decimals);
      
      // Get the appropriate chain object based on chainId
      let chain: Chain;
      switch (chainId) {
        case mainnet.id:
          chain = mainnet;
          break;
        case sepolia.id:
          chain = sepolia;
          break;
        case polygon.id:
          chain = polygon;
          break;
        case optimism.id:
          chain = optimism;
          break;
        case arbitrum.id:
          chain = arbitrum;
          break;
        default:
          // Default to mainnet if chainId is not recognized
          chain = mainnet;
      }
      
      // Check if this is a confidential token
      if (token.isConfidential) {
        // For confidential tokens, we need to use a different transfer method
        // This is a simplified version - in reality, you'd need to handle the encryption properly
        
        // Ensure we're on Sepolia, as confidential tokens are only available there
        if (chainId !== sepolia.id) {
          throw new Error("Confidential tokens are only available on Sepolia testnet");
        }
        
        // Mock encrypted input and proof for the demo
        // In a real app, you'd generate these properly based on the user's private key
        const mockEncryptedAmount = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
        const mockInputProof = "0x" as `0x${string}`;
        
        // Execute the confidential token transfer transaction
        writeContract({
          address: token.address as `0x${string}`,
          abi: confidentialErc20Abi,
          functionName: 'transfer',
          args: [to as `0x${string}`, mockEncryptedAmount, mockInputProof],
          account: address,
          chain: chain
        });
        
        toast.info("Confidential Transfer Initiated", {
          description: "Processing encrypted transaction. This may take longer than regular transfers."
        });
      } else {
        // Regular ERC20 transfer
        writeContract({
          address: token.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [to as `0x${string}`, parsedAmount],
          account: address,
          chain: chain
        });
      }
      
      // We return true to indicate the transaction was initiated
      // The actual success/failure will be handled by the UI through the isPending/isSuccess/isError states
      return true;
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Transfer failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
      return false;
    }
  };
  
  return {
    tokens: tokenStore.tokens,
    isLoading: tokenStore.isLoading,
    decryptToken: tokenStore.decryptToken,
    sendToken: tokenStore.sendToken,
    transferState: {
      hash,
      isPending,
      isError,
      error,
      isSuccess
    }
  };
};
