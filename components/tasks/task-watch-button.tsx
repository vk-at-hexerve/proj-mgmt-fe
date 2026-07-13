'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, UserPlus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getTaskWatchers, assignTaskWatcher, removeTaskWatcher } from "@/lib/api";
import { TaskWatcher } from "@/lib/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const MAX_VISIBLE = 4;

interface TaskWatchButtonProps {
  taskId: string;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
}

// ─── Stacked Avatars ────────────────────────────────────────────────────────

interface StackedWatcherAvatarsProps {
  /** All watchers (from task.watchers – populated by backend) */
  watchers: TaskWatcher[];
  /** ID of the currently logged-in user */
  currentUserId: string;
  /** Pixel size of each avatar circle */
  avatarPx?: number;
}

function StackedWatcherAvatars({
  watchers,
  currentUserId,
  avatarPx = 20,
}: StackedWatcherAvatarsProps) {
  const visible = watchers.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, watchers.length - MAX_VISIBLE);
  const totalWidth =
    visible.length * avatarPx -
    Math.max(0, visible.length - 1) * Math.floor(avatarPx * 0.35) +
    (overflow > 0 ? avatarPx - Math.floor(avatarPx * 0.35) : 0);

  return (
    <span
      className="relative inline-flex items-center flex-shrink-0"
      style={{ width: totalWidth, height: avatarPx }}
    >
      {visible.map((w, idx) => {
        const isMe = w.id === currentUserId;
        return (
          <span
            key={w.id}
            className={cn(
              "absolute inline-flex items-center justify-center rounded-full ring-[1.5px] ring-background transition-transform duration-150 hover:z-10 hover:scale-110",
              isMe && "ring-primary ring-[2px]",
            )}
            style={{
              width: avatarPx,
              height: avatarPx,
              left: idx * (avatarPx - Math.floor(avatarPx * 0.35)),
              zIndex: idx + 1,
            }}
          >
            <UserAvatar
              user={{ id: w.id, name: w.name }}
              size="xs"
              className={cn(
                "size-full",
                isMe && "ring-[2px] ring-primary ring-offset-background ring-offset-[1px]",
              )}
            />
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className="absolute inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-[1.5px] ring-background text-[9px] font-bold tabular-nums"
          style={{
            width: avatarPx,
            height: avatarPx,
            left: visible.length * (avatarPx - Math.floor(avatarPx * 0.35)),
            zIndex: visible.length + 1,
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}

// ─── Tooltip label ────────────────────────────────────────────────────────────

function watcherTooltipLabel(watchers: TaskWatcher[], currentUserId: string): string {
  if (watchers.length === 0) return "Manage watchers";
  const names = watchers.map((w) =>
    w.id === currentUserId ? "You" : w.name
  );
  if (names.length <= 3) return names.join(", ") + " watching";
  const shown = names.slice(0, 3).join(", ");
  return `${shown} and ${names.length - 3} more watching`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TaskWatchButton({
  taskId,
  size = "sm",
  showLabel = false,
}: TaskWatchButtonProps) {
  const { tasks, toggleWatchTask, users, showToast, currentUser } = useApp();
  const task = tasks.find((t) => t.id === taskId);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "assign">("menu");
  // Local watcher list used by the popover UI (fetched on open, kept in sync)
  const [localWatchers, setLocalWatchers] = useState<TaskWatcher[]>([]);
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  const isWatching = task.isWatching ?? false;
  // Prefer task.watchers (populated by backend) for the avatar stack
  const watchersFromTask: TaskWatcher[] = task.watchers ?? [];

  const avatarPx = size === "xs" ? 18 : size === "sm" ? 20 : 22;

  // Sync local watcher list with task.watchers whenever popover opens or task updates
  useEffect(() => {
    if (open) {
      setMode("menu");
      setLocalWatchers(watchersFromTask);
      // If we don't have detailed watcher data yet (e.g. freshly created task), fetch from API
      if (watchersFromTask.length === 0 && (task.watcherCount ?? 0) > 0) {
        setLoading(true);
        getTaskWatchers(taskId)
          .then((data) => setLocalWatchers(data.watchers || []))
          .catch(console.error)
          .finally(() => setLoading(false));
      }
    }
  }, [open, taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep popover list in sync when task.watchers changes from the outside
  useEffect(() => {
    if (open) setLocalWatchers(watchersFromTask);
  }, [task.watchers]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAssign = useCallback(
    async (userId: string) => {
      try {
        setLocalWatchers((prev) => {
          if (prev.find((w) => w.id === userId)) return prev;
          const user = users.find((u) => u.id === userId);
          if (!user) return prev;
          return [...prev, { id: user.id, name: user.name, email: user.email }];
        });
        await assignTaskWatcher(taskId, userId);
        showToast({ title: "Watcher assigned", type: "success" });
      } catch {
        setLocalWatchers((prev) => prev.filter((w) => w.id !== userId));
        showToast({ title: "Failed to assign watcher", type: "error" });
      }
    },
    [taskId, users, showToast],
  );

  const handleRemove = useCallback(
    async (userId: string) => {
      try {
        setLocalWatchers((prev) => prev.filter((w) => w.id !== userId));
        await removeTaskWatcher(taskId, userId);
        showToast({ title: "Watcher removed", type: "success" });
      } catch {
        showToast({ title: "Failed to remove watcher", type: "error" });
      }
    },
    [taskId, showToast],
  );

  // ── Trigger: stacked avatars (or eye icon when no watchers) ─────────────────
  const triggerContent =
    watchersFromTask.length > 0 ? (
      <StackedWatcherAvatars
        watchers={watchersFromTask}
        currentUserId={currentUser.id}
        avatarPx={avatarPx}
      />
    ) : (
      <>
        {isWatching ? (
          <Eye
            className={cn("shrink-0", size === "xs" ? "size-3.5" : "size-4")}
          />
        ) : (
          <EyeOff
            className={cn(
              "shrink-0 opacity-40",
              size === "xs" ? "size-3.5" : "size-4",
            )}
          />
        )}
        {showLabel && (
          <span>{isWatching ? "Watching" : "Watch"}</span>
        )}
      </>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md transition-all hover:bg-muted/60",
                  isWatching
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                  size === "xs" && "px-1 py-0.5",
                  size === "sm" && "px-1.5 py-0.5",
                  size === "md" && "px-2 py-1",
                )}
                aria-label="Manage watchers"
              >
                {triggerContent}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {watcherTooltipLabel(watchersFromTask, currentUser.id)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        className="w-64 p-0"
        align="end"
        sideOffset={8}
        onClick={(e) => e.stopPropagation()}
      >
        {mode === "menu" ? (
          <div className="flex flex-col">
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-9 px-2"
                onClick={() => {
                  toggleWatchTask(taskId);
                  setOpen(false);
                }}
              >
                {isWatching ? (
                  <EyeOff className="size-4 mr-2" />
                ) : (
                  <Eye className="size-4 mr-2" />
                )}
                {isWatching ? "Stop watching task" : "Watch this task"}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-9 px-2"
                onClick={() => setMode("assign")}
              >
                <UserPlus className="size-4 mr-2" />
                Assign watchers...
              </Button>
            </div>

            {localWatchers.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="p-3">
                  <h4 className="font-medium text-xs text-muted-foreground mb-3">
                    Current Watchers ({localWatchers.length})
                  </h4>
                  {loading ? (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      Loading...
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {localWatchers.map((w) => (
                        <div key={w.id} className="flex items-center gap-2 group">
                          <UserAvatar user={{ id: w.id, name: w.name }} size="xs" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {w.id === currentUser.id ? `${w.name} (You)` : w.name}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 opacity-0 group-hover:opacity-100 h-5 w-5 shrink-0 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(w.id);
                            }}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <Command>
            <div className="flex items-center border-b px-2">
              <CommandInput
                placeholder="Search users..."
                className="h-9 border-none focus:ring-0 w-full"
              />
            </div>
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => {
                  const isUserWatching = localWatchers.some((w) => w.id === user.id);
                  return (
                    <CommandItem
                      key={user.id}
                      value={user.name + " " + user.email}
                      onSelect={() => {
                        if (isUserWatching) {
                          handleRemove(user.id);
                        } else {
                          handleAssign(user.id);
                        }
                      }}
                    >
                      <UserAvatar user={user} size="xs" className="mr-2" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm truncate">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                      {isUserWatching && <Check className="ml-auto size-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            <div className="p-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => setMode("menu")}
              >
                Back to menu
              </Button>
            </div>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── WatcherListPopover (used in task detail panels) ───────────────────────────
export function WatcherListPopover({ taskId }: { taskId: string }) {
  const { tasks, currentUser } = useApp();
  const task = tasks.find((t) => t.id === taskId);
  const [watchers, setWatchers] = useState<TaskWatcher[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const count = task?.watcherCount || 0;
  const watchersFromTask: TaskWatcher[] = task?.watchers ?? [];

  useEffect(() => {
    if (open) {
      if (watchersFromTask.length > 0) {
        setWatchers(watchersFromTask);
      } else if (count > 0) {
        setLoading(true);
        getTaskWatchers(taskId)
          .then((data) => setWatchers(data.watchers || []))
          .catch(console.error)
          .finally(() => setLoading(false));
      }
    }
  }, [open, taskId, count]); // eslint-disable-line react-hooks/exhaustive-deps

  if (count === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="View watchers"
          onClick={(e) => e.stopPropagation()}
        >
          <StackedWatcherAvatars
            watchers={watchersFromTask.length > 0 ? watchersFromTask : []}
            currentUserId={currentUser.id}
            avatarPx={22}
          />
          {watchersFromTask.length === 0 && (
            <span className="text-sm tabular-nums">{count} watching</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <h4 className="font-semibold text-sm mb-3">Watchers</h4>
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-2">
            Loading...
          </div>
        ) : watchers.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-2">
            No active watchers
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {watchers.map((w) => (
              <div key={w.id} className="flex items-center gap-3">
                <UserAvatar user={{ id: w.id, name: w.name }} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {w.id === currentUser.id ? `${w.name} (You)` : w.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {w.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
