"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimeShort } from "@/lib/utils";

interface ShareButtonProps {
  leaveTime: Date;
  flightNumber: string;
  destination?: string;
  bufferMinutes: number;
}

export function ShareButton({
  leaveTime,
  flightNumber,
  destination,
  bufferMinutes,
}: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const { time, period } = formatTimeShort(leaveTime);
  const shareText = `Leave by ${time}${period} for ${flightNumber}${destination ? ` to ${destination}` : ""} (${bufferMinutes} min buffer) - via LeaveBy`;

  const handleShare = async () => {
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: "LeaveBy - Airport Departure Time",
          text: shareText,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fall back to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
      console.error("Failed to copy to clipboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.3 }}
    >
      <Button
        variant="outline"
        onClick={handleShare}
        className="w-full gap-2"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="copied"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-success" />
              <span>Copied!</span>
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
