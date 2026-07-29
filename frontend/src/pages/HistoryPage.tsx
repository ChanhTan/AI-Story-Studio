import { motion } from "framer-motion";
import { History, Play, Copy, Trash2, Download, ExternalLink, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHistory } from "@/hooks/useApi";

export function HistoryPage() {
  const { data, isLoading } = useHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items = (data?.history || []) as Array<{
    id: string;
    title: string;
    created_at: string;
    scenes: unknown[];
    video_path?: string;
  }>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Previously generated projects
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <History size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No projects yet. Generate your first video!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {item.scenes?.length || 0} scenes
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.video_path && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Play size={14} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
