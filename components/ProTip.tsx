import { Lightbulb } from "lucide-react";

export function ProTip({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-success/25 bg-success/10 p-4 text-sm text-primary">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-success/20 p-2 text-success">
          <Lightbulb className="h-4 w-4" />
        </div>
        <p>
          <span className="font-semibold text-success">Pro tip:</span> {text}
        </p>
      </div>
    </div>
  );
}
