import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Gavel } from "lucide-react";

// Import components
import { useToast } from "@/components/ui/use-toast";
import TokenInfo from "@/components/auction/TokenInfo";
import AuctionStatus from "@/components/auction/AuctionStatus";
import PriceChart from "@/components/auction/PriceChart";
import TokenSupplyChart from "@/components/auction/TokenSupplyChart";
import BidForm from "@/components/auction/BidForm";
import BidHistory from "@/components/auction/BidHistory";
import WrongNetworkMessage from "@/components/auction/WrongNetworkMessage";

// Import hooks
import { useAuctionTimer } from "@/hooks/auction/useAuctionTimer";
import { useAuctionChartData } from "@/hooks/auction/useAuctionChartData";
import { useAuctionToken } from "@/hooks/auction/useAuctionToken";
import { useAuctionPaymentToken } from "@/hooks/auction/useAuctionPaymentToken";
import {
  useAuctionCurrentPrice,
  useAuctionDetails,
  useAuctionTokensLeft,
} from "@/hooks/auction/useAuction";
import { useEncryptedBid } from "@/hooks/auction/useEncryptedBid";
import { useBidsActivity } from "@/hooks/auction/useBidsActivity";
import { useLocation, useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";

const Auction = () => {
  const { address, switchToSepolia } = useWallet();
  const chainId = useChainId();
  const isOnSepolia = chainId === sepolia.id;
  const { toast } = useToast();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);

  const auctionAddress = queryParams.get("address");

  const { tokenName, totalTokenSupply } = useAuctionToken();
  const { paymentTokenSymbol } = useAuctionPaymentToken();
  const { refreshCurrentPrice, currentPrice } =
    useAuctionCurrentPrice(auctionAddress);
  const {
    startPrice,
    hasAuctionStarted,
    initialTokenSupply,
    seller,
    startAt,
    expiresAt,
    reservePrice,
    discountRate,
  } = useAuctionDetails(auctionAddress);

  // Dutch auction state
  const [endPrice, setEndPrice] = useState<number>(10);

  const [bidAmount, setBidAmount] = useState<string>("0");
  const { bids } = useBidsActivity();
  const isOwner = seller?.toLowerCase() === address?.toLowerCase();

  // Token data
  const { tokensLeft: currentTokenSupply, refreshTokensLeft } =
    useAuctionTokensLeft(auctionAddress);

  // Use custom hooks
  // TODO: use discountRate to calculate steps
  const { timeRemaining, formatTimeRemaining } = useAuctionTimer({
    startAt,
    expiresAt,
    discountRate,
    hasAuctionStarted,
    refreshCurrentPrice,
    refreshTokensLeft,
  });

  const { priceChartData, tokenChartData, setTokenChartData } =
    useAuctionChartData({
      startPrice,
      endPrice,
      duration: (expiresAt - startAt) / 3600, // TODO fix
      initialTokenSupply,
      reservePrice,
    });

  const {
    bid,
    isEncrypting,
    isPending,
    isConfirming,
    isConfirmed,
    transferHash,
    transferError,
  } = useEncryptedBid({
    contractAddress: auctionAddress as `0x${string}`,
    userAddress: address as `0x${string}`,
    chain: sepolia,
  });
  // Place a bid
  const placeBid = async () => {
    console.log(`Placing bid...${bidAmount}`);
    bid(bidAmount);
  };

  // Add useEffect to watch transfer states
  useEffect(() => {
    if (isEncrypting) {
      toast({
        title: "Encrypting Transaction",
        description: "Generating encrypted proof for your transaction...",
      });
    }
  }, [isEncrypting, toast]);

  useEffect(() => {
    if (isConfirming) {
      toast({
        title: "Confirming Transaction",
        description: "Waiting for confirmation...",
      });
    }
  }, [isConfirming, toast]);

  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "Transfer Complete",
        description: `Successfully bid ${bidAmount} ${paymentTokenSymbol}`,
      });
    }
  }, [isConfirmed, bidAmount, toast, paymentTokenSymbol]);

  // If not on Sepolia, show switch chain message
  if (!isOnSepolia) {
    return <WrongNetworkMessage onSwitchNetwork={switchToSepolia} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-8 mt-10">
      <div className="w-full max-w-4xl space-y-6 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                Dutch Auction
              </CardTitle>
              <CardDescription>
                Token auction with decreasing price over time
              </CardDescription>
            </div>
            <Gavel className="h-8 w-8 text-purple-500" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Initialize Auction */}
            {hasAuctionStarted && isOwner}
            {/* Token Information */}
            <TokenInfo
              tokenName={tokenName}
              initialTokenSupply={initialTokenSupply}
              totalTokenSupply={totalTokenSupply}
              currentTokenSupply={currentTokenSupply}
            />

            {/* Auction Status */}
            <AuctionStatus
              currentPrice={currentPrice}
              paymentTokenSymbol={paymentTokenSymbol}
              timeRemaining={timeRemaining}
              hasAuctionStarted={hasAuctionStarted}
              formatTimeRemaining={formatTimeRemaining}
            />

            {/* Price Chart */}
            <PriceChart data={priceChartData} />

            {/* Token Supply Chart */}
            <TokenSupplyChart
              data={tokenChartData}
              tokenName={tokenName}
              initialTokenSupply={initialTokenSupply}
            />

            {/* Bid Section */}
            <BidForm
              hasAuctionStarted={hasAuctionStarted}
              currentTokenSupply={currentTokenSupply}
              bidAmount={bidAmount}
              setBidAmount={setBidAmount}
              placeBid={placeBid}
              address={address}
              currentPrice={currentPrice}
              tokenName={tokenName}
              isBidding={isEncrypting || isPending || isConfirming}
              paymentTokenSymbol={paymentTokenSymbol}
            />

            {/* Recent Bids */}
            <BidHistory
              bids={bids}
              tokenName={tokenName}
              paymentTokenSymbol={paymentTokenSymbol}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auction;
