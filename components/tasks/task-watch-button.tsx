import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getTaskWatchers } from "@/lib/api";
import { TaskWatcher } from "@/lib/types";

interface TaskWatchButtonProps {
  taskId: string;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
}

export function TaskWatchButton({ taskId, size = "sm", showLabel = false }: TaskWatchButtonProps) {
  const { tasks, toggleWatchTask } = useApp();
  const task = tasks.find((t) => t.id === taskId);
  
  if (!task) return null;

  const isWatching = task.isWatching;
  const count = task.watcherCount || 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleWatchTask(taskId);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md transition-all hover:bg-muted font-medium",
              isWatching
                ? "text-primary hover:text-primary/80"
                : "text-muted-foreground hover:text-foreground",
              size === "xs" && "text-xs px-1.5 py-0.5",
              size === "sm" && "text-sm px-2 py-1",
              size === "md" && "text-sm px-3 py-1.5",
            )}
          >
            {isWatching ? <Eye className={cn("shrink-0", size === "xs" ? "size-3.5" : "size-4")} /> : <EyeOff className={cn("shrink-0", size === "xs" ? "size-3.5" : "size-4")} />}
            {showLabel && <span>{isWatching ? "Watching" : "Watch"}</span>}
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {isWatching ? "Stop watching this task" : "Watch this task for updates"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function WatcherListPopover({ taskId }: { taskId: string }) {
  const { tasks } = useApp();
  const task = tasks.find((t) => t.id === taskId);
  const [watchers, setWatchers] = useState<TaskWatcher[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const count = task?.watcherCount || 0;

  useEffect(() => {
    if (open && count > 0) {
      setLoading(true);
      getTaskWatchers(taskId)
        .then((data) => setWatchers(data.watchers || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, taskId, count]);

  if (count === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
          <Users className="size-4 mr-2" />
          {count} {count === 1 ? "watcher" : "watchers"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <h4 className="font-semibold text-sm mb-3">Watchers</h4>
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-2">Loading...</div>
        ) : watchers.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-2">No active watchers</div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {watchers.map((w) => (
              <div key={w.id} className="flex items-center gap-3">
                <UserAvatar user={{ id: w.id, name: w.name }} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{w.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
