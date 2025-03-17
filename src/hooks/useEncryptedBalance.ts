import { useState } from "react";
import { getInstance } from "@/lib/fhevm/fhevmjs";
import { reencryptEuint64 } from "@/lib/reencrypt";
import { Signer } from "ethers";

interface UseEncryptedBalanceProps {
  contractAddress: `0x${string}`;
  signer: Signer | null;
}

export const useEncryptedBalance = ({
  contractAddress,
  signer,
}: UseEncryptedBalanceProps) => {
  const [decryptedBalance, setDecryptedBalance] = useState("•••••••");
  const [lastUpdated, setLastUpdated] = useState<string>("Never");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decrypt = async (handle: bigint) => {
    setIsDecrypting(true);
    setError(null);
    try {
      if (!signer)
        throw new Error("Signer not initialized - please connect your wallet");
      if (!handle) throw new Error("Balance not found");

      const instance = getInstance();
      const clearBalance = await reencryptEuint64(
        signer,
        instance,
        BigInt(handle),
        contractAddress
      );
      setDecryptedBalance(clearBalance.toString());
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error("Decryption error:", error);
      if (error === "Handle is not initialized") {
        setDecryptedBalance("0");
      } else {
        setError(
          error instanceof Error ? error.message : "Failed to decrypt balance"
        );
        throw error;
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  return {
    decryptedBalance,
    lastUpdated,
    isDecrypting,
    decrypt,
    error,
  };
};
