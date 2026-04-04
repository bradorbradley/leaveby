"use client";

import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareButton({ text }: { text: string }) {
  const onShare = async () => {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
  };

  return (
    <Button variant="outline" className="w-full sm:w-auto" onClick={onShare}>
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
}
