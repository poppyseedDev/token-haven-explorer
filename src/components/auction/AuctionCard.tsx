import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, Tag, User } from "lucide-react";
import { AuctionSummary } from "@/hooks/use-all-auctions";
import { useAuctionDetails } from "@/hooks/use-auction";

interface AuctionCardProps {
  auction: AuctionSummary;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction }) => {
  const navigate = useNavigate();
  const shortAddress = `${auction.address.slice(
    0,
    6
  )}...${auction.address.slice(-4)}`;
  const {
    startPrice,
    hasAuctionStarted,
    initialTokenSupply,
    startAt,
    expiresAt,
    reservePrice,
    discountRate,
  } = useAuctionDetails(auction.address);

  return (
    <Card className="h-full">
      <CardContent className="pt-6 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-lg font-medium">Auction</span>
            <div className="flex items-center text-sm text-muted-foreground">
              <Tag className="h-3.5 w-3.5 mr-1" />
              {shortAddress}
            </div>
          </div>
          {auction.isUserAuction && (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
              <User className="h-3 w-3 mr-1" />
              Your Auction
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{hasAuctionStarted ? `Ongoing` : `Not active`}</span>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Starts At:</span>
              <span>{new Date(startAt * 1000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expires At:</span>
              <span>{new Date(expiresAt * 1000).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="default"
          className="w-full"
          onClick={() => navigate(`/auction?address=${auction.address}`)}
        >
          View Auction
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AuctionCard;
