import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import type { Follower, LineOA } from "@/types";
import { followerApi } from "@/api/follower";
import { lineOAApi } from "@/api/lineOA";
import { LineOAFilter } from "@/components/common/LineOAFilter";

const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

const followStatusVariant = {
  following: "success" as const,
  unfollowed: "secondary" as const,
  blocked: "destructive" as const,
};

export function FollowersPage() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [selectedLineOAId, setSelectedLineOAId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load LINE OAs once on mount
  useEffect(() => {
    lineOAApi
      .list({ workspace_id: WORKSPACE_ID })
      .then((res) => {
        const oas = res.data ?? [];
        setLineOAs(oas);
        // Start with "All" — no auto-select
      })
      .catch(console.error);
  }, []);

  // Reload followers whenever the selected OA changes
  useEffect(() => {
    setLoading(true);
    followerApi
      .list({ workspace_id: WORKSPACE_ID, line_oa_id: selectedLineOAId || undefined })
      .then((res) => {
        setFollowers(res.data ?? []);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load followers");
        setFollowers([]);
      })
      .finally(() => setLoading(false));
  }, [selectedLineOAId]);

  return (
    <AppLayout title="Followers">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Manage your LINE followers. They are automatically added when they follow your LINE OA.
          </p>
        </div>

        {/* LINE OA Filter */}
        <LineOAFilter
          lineOAs={lineOAs}
          selectedId={selectedLineOAId}
          onChange={setSelectedLineOAId}
          showAll={true}
        />

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="text-center py-8">
              <p className="font-medium text-destructive">Error loading followers</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Loading...
          </div>
        )}

        {/* Empty */}
        {!loading && !error && selectedLineOAId && followers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">👥</div>
              <p className="font-medium">No followers yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Followers will appear here when they follow your LINE OA.
              </p>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {!loading && !error && followers.length > 0 && (
          <div className="grid gap-3">
            {followers.map((follower) => (
              <Card
                key={follower.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => { window.location.href = `/followers/${follower.id}`; }}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                    {follower.picture_url ? (
                      <img src={follower.picture_url} alt={follower.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                        {follower.display_name?.[0] || "?"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{follower.display_name || follower.line_user_id}</span>
                      <Badge variant={followStatusVariant[follower.follow_status]}>
                        {follower.follow_status}
                      </Badge>
                      {follower.language && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {follower.language}
                        </span>
                      )}
                    </div>
                    {follower.status_message && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {follower.status_message}
                      </p>
                    )}
                    {follower.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {follower.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {/* Identity bridge keys */}
                    {follower.custom_fields && Object.keys(follower.custom_fields).length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(follower.custom_fields).map(([k, v]) => (
                          <span key={k} className="text-xs text-muted-foreground bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="hidden sm:block text-xs text-muted-foreground flex-shrink-0">
                    {follower.followed_at
                      ? new Date(follower.followed_at).toLocaleDateString()
                      : "—"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
