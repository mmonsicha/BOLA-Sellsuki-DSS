import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Follower } from "@/types";
import { followerApi } from "@/api/follower";

const followStatusVariant = {
  following: "success" as const,
  unfollowed: "secondary" as const,
  blocked: "destructive" as const,
};

export function FollowersPage() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

  useEffect(() => {
    const loadFollowers = async () => {
      try {
        setLoading(true);
        const response = await followerApi.list({ workspace_id: WORKSPACE_ID });
        setFollowers(response.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load followers");
        setFollowers([]);
      } finally {
        setLoading(false);
      }
    };

    loadFollowers();
  }, []);

  return (
    <AppLayout title="Followers">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage your LINE followers. They are automatically added when they follow your LINE OA.
          </p>
          <div className="flex items-center gap-2">
            {/* Filter by LINE OA */}
            <select className="border rounded-md px-3 py-1.5 text-sm bg-background">
              <option value="">All LINE OAs</option>
            </select>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="font-medium text-destructive">Error loading followers</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">⏳</div>
              <p className="font-medium">Loading followers...</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && followers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-3">👥</div>
              <p className="font-medium">No followers yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Followers will appear here when they follow your LINE OA.
              </p>
            </CardContent>
          </Card>
        ) : !loading && !error && (
          <div className="grid gap-3">
            {followers.map((follower) => (
              <Card key={follower.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                    {follower.picture_url ? (
                      <img src={follower.picture_url} alt={follower.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                        {follower.display_name?.[0] || "?"}
                      </div>
                    )}
                  </div>
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
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
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
