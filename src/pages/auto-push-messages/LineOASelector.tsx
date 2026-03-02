import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { lineOAApi } from "@/api/lineOA";
import type { LineOA } from "@/types";

interface LineOASelectorProps {
  workspaceId: string;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function LineOASelector({
  workspaceId,
  selectedId,
  onSelect,
}: LineOASelectorProps) {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLineOAs();
  }, []);

  const loadLineOAs = async () => {
    setLoading(true);
    try {
      const res = await lineOAApi.list({ workspace_id: workspaceId });
      setLineOAs(res.data ?? []);
      // Auto-select first if available
      if (!selectedId && res.data && res.data.length > 0) {
        onSelect(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load LINE OAs:", err);
    } finally {
      setLoading(false);
    }
  };

  const selected = lineOAs.find((oa) => oa.id === selectedId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading LINE OAs...
        </CardContent>
      </Card>
    );
  }

  if (lineOAs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-medium">No LINE OAs Found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please create a LINE Official Account first.
          </p>
          <Button className="mt-4" onClick={() => window.location.href = "/line-oa"}>
            Go to LINE OA
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (selectedId && selected) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {selected.picture_url && (
              <img
                src={selected.picture_url}
                alt={selected.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold">{selected.name}</p>
              {selected.description && (
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {selected.basic_id && (
                  <>
                    <span className="bg-line text-white px-2 py-1 rounded text-xs">
                      {selected.basic_id}
                    </span>
                    <span className="ml-2">Status: {selected.status}</span>
                  </>
                )}
              </p>
            </div>
            {lineOAs.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Show selector
                  const selector = document.getElementById("lineoa-selector-modal");
                  if (selector) {
                    selector.style.display =
                      selector.style.display === "none" ? "block" : "none";
                  }
                }}
              >
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Selector list
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Select LINE OA</p>
      {lineOAs.map((oa) => (
        <Card
          key={oa.id}
          className={`cursor-pointer transition-colors ${
            selectedId === oa.id
              ? "bg-line/10 border-line"
              : "hover:bg-muted"
          }`}
          onClick={() => onSelect(oa.id)}
        >
          <CardContent className="flex items-center gap-4 p-3">
            {oa.picture_url && (
              <img
                src={oa.picture_url}
                alt={oa.name}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{oa.name}</p>
              {oa.basic_id && (
                <p className="text-xs text-muted-foreground">{oa.basic_id}</p>
              )}
            </div>
            {selectedId === oa.id && (
              <Check size={20} className="text-line flex-shrink-0" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
