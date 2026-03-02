import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Radio, MessageCircle, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total Followers", value: "—", icon: Users, color: "text-blue-500" },
  { label: "LINE OAs", value: "—", icon: MessageCircle, color: "text-green-500" },
  { label: "Broadcasts Sent", value: "—", icon: Radio, color: "text-purple-500" },
  { label: "Active Segments", value: "—", icon: TrendingUp, color: "text-orange-500" },
];

export function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon size={18} className={stat.color} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              No recent activity. Connect a LINE OA to get started.
            </div>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="border-line/30 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base text-green-800">Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-green-700">
              <li>Go to <strong>LINE OA</strong> and connect your LINE Official Account</li>
              <li>Set up your <strong>Webhook URL</strong> in the LINE Developer Console</li>
              <li>Followers who follow your OA will appear in <strong>Followers</strong></li>
              <li>Create <strong>Segments</strong> to group your followers</li>
              <li>Send a <strong>Broadcast</strong> to your segments</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
