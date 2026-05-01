"use client";

import React from "react";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  users as contextUsers,
  projects as contextProjects,
  portfolios as contextPortfolios,
  tags as availableTags,
  projectTemplates,
} from "@/lib/mock-data";
// const availableTags: any[] = []; // Placeholder for tags logic
// const projectTemplates: any[] = [];
// const clients: any[] = [];
import type {
  TaskPriority,
  TaskStatus,
  TaskComment,
  TaskAttachment,
  TaskLink,
  Task,
  Sprint,
  ProjectTemplate,
  ProjectType,
  RiskLevel,
  ClientType,
  Client,
  Team,
} from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Paperclip,
  Link2,
  Clock,
  Send,
  Trash2,
  Upload,
  X,
  History,
  FileText,
  Image,
  File as FileIcon,
  Code2,
  Smartphone,
  Share2,
  Rocket,
  Video,
  Megaphone,
  TrendingUp,
  Settings,
  FolderPlus,
  Check,
  UserCircle,
  Building,
  ExternalLink,
  Users,
  PlusCircle,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  Calendar,
} from "lucide-react";

const getTodayDateInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  return value;
};

const isPastDate = (value: string) => {
  if (!value) return false;
  const normalizedValue = toDateInputValue(value);
  const selected = new Date(`${normalizedValue}T00:00:00`);
  if (Number.isNaN(selected.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today;
};

export function AppModals() {
  const {
    modal,
    closeModal,
    addTask,
    updateTask,
    deleteTask,
    assignTask,
    updateTaskStatus,
    bulkAssignTasks,
    bulkUpdateTaskStatus,
    bulkDeleteTasks,
    getTask,
    tasks,
    addTeam,
    updateTeam,
    addProgram,
    addPortfolio,
    addTimeEntry,
    addProject,
    users,
    projects,
    portfolios,
    programs,
    teams,
    currentUser,
    isMounted,
    addSprint,
  } = useApp();

  if (!isMounted) return null;

  // Create Task Modal
  if (modal.type === "create-task") {
    return (
      <CreateTaskModal
        onClose={closeModal}
        onSubmit={addTask}
        projectId={modal.data?.projectId as string}
      />
    );
  }

  // Edit Task Modal
  if (modal.type === "edit-task") {
    const task = getTask(modal.data?.taskId as string);
    if (!task) return null;
    return (
      <EditTaskModal
        task={task}
        onClose={closeModal}
        onSubmit={(updates) => updateTask(task.id, updates)}
      />
    );
  }

  // Task Detail Modal
  if (modal.type === "task-detail") {
    const task = getTask(modal.data?.taskId as string);
    if (!task) return null;
    return <TaskDetailModal task={task} onClose={closeModal} />;
  }

  // Assign Task Modal
  if (modal.type === "assign-task") {
    const taskIds = (modal.data?.taskIds as string[]) || [
      modal.data?.taskId as string,
    ];
    return (
      <AssignTaskModal
        taskIds={taskIds}
        onClose={closeModal}
        onAssign={(userId) => {
          if (taskIds.length === 1) {
            assignTask(taskIds[0], userId);
          } else {
            bulkAssignTasks(taskIds, userId);
          }
          closeModal();
        }}
      />
    );
  }

  // Change Status Modal
  if (modal.type === "change-status") {
    const taskIds = (modal.data?.taskIds as string[]) || [
      modal.data?.taskId as string,
    ];
    return (
      <ChangeStatusModal
        taskIds={taskIds}
        onClose={closeModal}
        onChangeStatus={(status) => {
          if (taskIds.length === 1) {
            updateTaskStatus(taskIds[0], status);
          } else {
            bulkUpdateTaskStatus(taskIds, status);
          }
          closeModal();
        }}
      />
    );
  }

  // Confirm Delete Modal
  if (modal.type === "confirm-delete") {
    const taskIds = (modal.data?.taskIds as string[]) || [
      modal.data?.taskId as string,
    ];
    const taskNames = taskIds
      .map((id) => tasks.find((t) => t.id === id)?.key)
      .filter(Boolean);
    return (
      <AlertDialog open onOpenChange={(open) => !open && closeModal()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {taskIds.length > 1 ? `${taskIds.length} tasks` : "task"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              {taskIds.length > 1 ? "these tasks" : taskNames[0]}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (taskIds.length === 1) {
                  deleteTask(taskIds[0]);
                } else {
                  bulkDeleteTasks(taskIds);
                }
                closeModal();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Create Project Modal
  if (modal.type === "create-project") {
    return <CreateProjectModal onClose={closeModal} onSubmit={addProject} />;
  }

  // Create Team Modal
  if (modal.type === "create-team") {
    return <CreateTeamModal onClose={closeModal} onSubmit={addTeam} />;
  }

  // Edit Team Modal
  if (modal.type === "edit-team") {
    const teamId = modal.data?.teamId as string;
    return (
      <EditTeamModal
        teamId={teamId}
        onClose={closeModal}
        onSubmit={updateTeam}
      />
    );
  }

  // Create Program Modal
  if (modal.type === "create-program") {
    return <CreateProgramModal onClose={closeModal} onSubmit={addProgram} />;
  }

  // Create Portfolio Modal
  if (modal.type === "create-portfolio") {
    return (
      <CreatePortfolioModal onClose={closeModal} onSubmit={addPortfolio} />
    );
  }

  // Log Time Modal
  if (modal.type === "log-time") {
    const taskId = modal.data?.taskId as string;
    return (
      <LogTimeModal
        taskId={taskId}
        onClose={closeModal}
        onSubmit={addTimeEntry}
      />
    );
  }

  // Add Member Modal
  if (modal.type === "add-member") {
    const teamId = modal.data?.teamId as string;
    return <AddMemberModal teamId={teamId} onClose={closeModal} />;
  }

  // Client Detail Modal
  if (modal.type === "client-detail") {
    const clientId = modal.data?.clientId as string;
    return <ClientDetailModal clientId={clientId} onClose={closeModal} />;
  }

  // Create Sprint Modal
  if (modal.type === "create-sprint") {
    return <CreateSprintModal onClose={closeModal} onSubmit={addSprint} />;
  }

  return null;
}

// Create Task Modal Component
function CreateTaskModal({
  onClose,
  onSubmit,
  projectId,
}: {
  onClose: () => void;
  onSubmit: (task: Parameters<ReturnType<typeof useApp>["addTask"]>[0]) => void;
  projectId?: string;
}) {
  const { projects, users } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"task" | "bug" | "story" | "epic">("task");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [project, setProject] = useState(projectId || projects[0]?.id || "");
  const [assignee, setAssignee] = useState<string>("");
  const [storyPoints, setStoryPoints] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(getTodayDateInputValue());
  const [dueDate, setDueDate] = useState<string>("");
  const [startDateError, setStartDateError] = useState<string>("");
  const [dueDateError, setDueDateError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isPastDate(startDate)) {
      setStartDateError("Please select today's date or a future start date.");
      return;
    }

    if (isPastDate(dueDate)) {
      setDueDateError("Please select today's date or a future due date.");
      return;
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      setDueDateError("Due date cannot be before the start date.");
      return;
    }

    const selectedUser = users.find((u) => u.id === assignee);

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      status: assignee ? "assigned" : "open",
      projectId: project,
      assignee: selectedUser,
      reporter: users[0],
      storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      tags: [],
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Add a new task to your project</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as typeof type)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {p.key}
                        </Badge>
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Story Points</Label>
              <Input
                type="number"
                min="1"
                max="21"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="Points"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <span className="flex items-center gap-2">
                        <Avatar className="size-5">
                          <AvatarImage
                            src={user.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {user.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                min={getTodayDateInputValue()}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setStartDate(nextValue);
                  setStartDateError(
                    isPastDate(nextValue)
                      ? "Please select today's date or a future start date."
                      : "",
                  );
                  if (dueDate && new Date(nextValue) > new Date(dueDate)) {
                    setDueDateError(
                      "Due date cannot be before the start date.",
                    );
                  } else if (
                    dueDateError === "Due date cannot be before the start date."
                  ) {
                    setDueDateError("");
                  }
                }}
                aria-invalid={!!startDateError}
              />
              {startDateError && (
                <p className="text-sm text-destructive">{startDateError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                min={startDate || getTodayDateInputValue()}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setDueDate(nextValue);
                  if (isPastDate(nextValue)) {
                    setDueDateError(
                      "Please select today's date or a future due date.",
                    );
                  } else if (
                    startDate &&
                    new Date(nextValue) < new Date(startDate)
                  ) {
                    setDueDateError(
                      "Due date cannot be before the start date.",
                    );
                  } else {
                    setDueDateError("");
                  }
                }}
                aria-invalid={!!dueDateError}
              />
              {dueDateError && (
                <p className="text-sm text-destructive">{dueDateError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !!dueDateError || !!startDateError}
            >
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Task Modal Component - Enhanced with Comments, Attachments, and Task Linking
function EditTaskModal({
  task,
  onClose,
  onSubmit,
}: {
  task: ReturnType<ReturnType<typeof useApp>["getTask"]>;
  onClose: () => void;
  onSubmit: (updates: Partial<NonNullable<typeof task>>) => void;
}) {
  const { tasks, users, currentUser } = useApp();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [type, setType] = useState<
    "task" | "bug" | "story" | "epic" | "subtask"
  >(task?.type || "task");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority || "medium",
  );
  const [status, setStatus] = useState<TaskStatus>(task?.status || "open");
  const [storyPoints, setStoryPoints] = useState<string>(
    task?.storyPoints?.toString() || "",
  );
  const [startDate, setStartDate] = useState<string>(
    toDateInputValue(task?.startDate),
  );
  const [dueDate, setDueDate] = useState<string>(
    toDateInputValue(task?.dueDate),
  );
  const [dueDateError, setDueDateError] = useState<string>(
    task?.dueDate && isPastDate(task.dueDate)
      ? "Please select today's date or a future due date."
      : "",
  );
  const [assignee, setAssignee] = useState<string>(task?.assignee?.id || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    task?.tags?.map((t: any) => t.id) || [],
  );

  // Comments state
  const [comments, setComments] = useState<TaskComment[]>(task?.comments || []);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [showCommentHistory, setShowCommentHistory] = useState<string | null>(
    null,
  );

  // Attachments state
  const [attachments, setAttachments] = useState<TaskAttachment[]>(
    task?.attachments || [],
  );

  // Linked tasks state
  const [linkedTasks, setLinkedTasks] = useState<TaskLink[]>(
    task?.linkedTasks || [],
  );
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkType, setLinkType] = useState<TaskLink["linkType"]>("relates-to");
  const [selectedLinkTask, setSelectedLinkTask] = useState<string>("");

  if (!task) return null;

  const isSubtask = !!task.parentId;
  const currentUserId = currentUser.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isPastDate(dueDate)) {
      setDueDateError("Please select today's date or a future due date.");
      return;
    }

    const selectedUser = users.find((u) => u.id === assignee);
    const selectedTagObjects = availableTags.filter((t) =>
      selectedTags.includes(t.id),
    );

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      status,
      storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      assignee: selectedUser,
      tags: selectedTagObjects,
      comments,
      attachments,
      linkedTasks,
    });
    onClose();
  };

  // Comment handlers
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: TaskComment = {
      id: `comment-${Date.now()}`,
      taskId: task.id,
      userId: currentUserId,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      editHistory: [],
    };
    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleEditComment = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      setEditingCommentId(commentId);
      setEditingCommentContent(comment.content);
    }
  };

  const handleSaveCommentEdit = (commentId: string) => {
    if (!editingCommentContent.trim()) return;
    setComments(
      comments.map((c) => {
        if (c.id === commentId) {
          const history = c.editHistory || [];
          return {
            ...c,
            content: editingCommentContent.trim(),
            updatedAt: new Date().toISOString(),
            editHistory: [
              ...history,
              { content: c.content, editedAt: new Date().toISOString() },
            ],
          };
        }
        return c;
      }),
    );
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
  };

  // Attachment handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const attachment: TaskAttachment = {
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskId: task.id,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
        uploadedBy: currentUserId,
        uploadedAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, attachment]);
    });
    e.target.value = "";
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter((a) => a.id !== attachmentId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="size-4" />;
    if (type.includes("pdf") || type.includes("document"))
      return <FileText className="size-4" />;
    return <FileIcon className="size-4" />;
  };

  // Link handlers
  const handleAddLink = () => {
    if (!selectedLinkTask) return;
    const link: TaskLink = {
      id: `link-${Date.now()}`,
      sourceTaskId: task.id,
      targetTaskId: selectedLinkTask,
      linkType: linkType,
    };
    setLinkedTasks([...linkedTasks, link]);
    setShowLinkModal(false);
    setSelectedLinkTask("");
    setLinkType("relates-to");
  };

  const handleRemoveLink = (linkId: string) => {
    setLinkedTasks(linkedTasks.filter((l) => l.id !== linkId));
  };

  const getLinkTypeLabel = (type: TaskLink["linkType"]) => {
    const labels: Record<TaskLink["linkType"], string> = {
      blocks: "Blocks",
      "blocked-by": "Blocked by",
      "relates-to": "Relates to",
      duplicates: "Duplicates",
      "is-duplicated-by": "Is duplicated by",
      "parent-of": "Parent of",
      "child-of": "Child of",
    };
    return labels[type];
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || "Unknown";
  };

  const getLinkedTask = (taskId: string) => {
    return tasks.find((t) => t.id === taskId);
  };

  const availableTasksForLinking = tasks.filter(
    (t) =>
      t.id !== task.id && !linkedTasks.some((l) => l.targetTaskId === t.id),
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {task.key}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {task.type}
            </Badge>
          </div>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="details"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments" className="gap-1">
              <MessageSquare className="size-4" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-1">
              <Paperclip className="size-4" />
              Files ({attachments.length})
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-1">
              <Link2 className="size-4" />
              Links ({linkedTasks.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 pr-4 m-0">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as typeof type)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isSubtask ? (
                        <SelectItem value="subtask">Subtask</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="bug">Bug</SelectItem>
                          <SelectItem value="story">Story</SelectItem>
                          <SelectItem value="epic">Epic</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as TaskStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="pending-approval">
                        Pending Approval
                      </SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as TaskPriority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <span className="flex items-center gap-2">
                            <Avatar className="size-5">
                              <AvatarImage
                                src={user.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback className="text-xs">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {user.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Story Points</Label>
                  <Input
                    type="number"
                    min="1"
                    max="21"
                    value={storyPoints}
                    onChange={(e) => setStoryPoints(e.target.value)}
                    placeholder="Points"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    min={getTodayDateInputValue()}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setDueDate(nextValue);
                      setDueDateError(
                        isPastDate(nextValue)
                          ? "Please select today's date or a future due date."
                          : "",
                      );
                    }}
                    aria-invalid={!!dueDateError}
                  />
                  {dueDateError && (
                    <p className="text-sm text-destructive">{dueDateError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${selectedTags.includes(tag.id)
                        ? "ring-2 ring-offset-1"
                        : "opacity-60 hover:opacity-100"
                        }`}
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                        ...(selectedTags.includes(tag.id) && {
                          ringColor: tag.color,
                        }),
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4 pr-4 m-0">
              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  size="icon"
                  className="self-end"
                >
                  <Send className="size-4" />
                </Button>
              </div>

              <Separator />

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet
                  </p>
                ) : (
                  comments.map((comment) => {
                    const user = users.find((u) => u.id === comment.userId);
                    const isEditing = editingCommentId === comment.id;
                    const hasHistory =
                      comment.editHistory && comment.editHistory.length > 0;

                    return (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="size-8">
                          <AvatarImage
                            src={user?.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {user?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {user?.name || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            {comment.updatedAt && (
                              <span className="text-xs text-muted-foreground">
                                (edited)
                              </span>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingCommentContent}
                                onChange={(e) =>
                                  setEditingCommentContent(e.target.value)
                                }
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleSaveCommentEdit(comment.id)
                                  }
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingCommentId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{comment.content}</p>
                          )}
                          <div className="flex gap-2">
                            {comment.userId === currentUserId && !isEditing && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleEditComment(comment.id)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-destructive"
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                            {hasHistory && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs gap-1"
                                onClick={() =>
                                  setShowCommentHistory(
                                    showCommentHistory === comment.id
                                      ? null
                                      : comment.id,
                                  )
                                }
                              >
                                <History className="size-3" />
                                History
                              </Button>
                            )}
                          </div>
                          {/* Comment History */}
                          {showCommentHistory === comment.id && hasHistory && (
                            <div className="mt-2 p-3 rounded-lg bg-muted/50 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Edit History
                              </p>
                              {comment.editHistory?.map((edit, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(edit.editedAt).toLocaleString()}:
                                  </span>
                                  <p className="text-muted-foreground line-through">
                                    {edit.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="space-y-4 pr-4 m-0">
              {/* Upload Area */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="size-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, Images, Documents up to 10MB
                  </span>
                </label>
              </div>

              {/* Attachments List */}
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No attachments
                  </p>
                ) : (
                  attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                        {getFileIcon(attachment.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)} - Uploaded by{" "}
                          {getUserName(attachment.uploadedBy)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Links Tab */}
            <TabsContent value="links" className="space-y-4 pr-4 m-0">
              <Button onClick={() => setShowLinkModal(true)} className="gap-2">
                <Link2 className="size-4" />
                Link Task
              </Button>

              {/* Linked Tasks List */}
              <div className="space-y-2">
                {linkedTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No linked tasks
                  </p>
                ) : (
                  linkedTasks.map((link) => {
                    const linkedTask = getLinkedTask(link.targetTaskId);
                    if (!linkedTask) return null;

                    return (
                      <div
                        key={link.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <Badge variant="outline" className="shrink-0">
                          {getLinkTypeLabel(link.linkType)}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              {linkedTask.key}
                            </Badge>
                            <span className="text-sm truncate">
                              {linkedTask.title}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => handleRemoveLink(link.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Link Task Modal */}
              {showLinkModal && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                  <div className="bg-card border rounded-lg p-6 w-full max-w-md space-y-4">
                    <h3 className="font-semibold">Link Task</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Link Type</Label>
                        <Select
                          value={linkType}
                          onValueChange={(v) =>
                            setLinkType(v as TaskLink["linkType"])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relates-to">
                              Relates to
                            </SelectItem>
                            <SelectItem value="blocks">Blocks</SelectItem>
                            <SelectItem value="blocked-by">
                              Blocked by
                            </SelectItem>
                            <SelectItem value="duplicates">
                              Duplicates
                            </SelectItem>
                            <SelectItem value="is-duplicated-by">
                              Is duplicated by
                            </SelectItem>
                            <SelectItem value="parent-of">Parent of</SelectItem>
                            <SelectItem value="child-of">Child of</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Task</Label>
                        <Select
                          value={selectedLinkTask}
                          onValueChange={setSelectedLinkTask}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTasksForLinking.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                <span className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-xs"
                                  >
                                    {t.key}
                                  </Badge>
                                  <span className="truncate">{t.title}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowLinkModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddLink}
                        disabled={!selectedLinkTask}
                      >
                        Link
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !!dueDateError}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Task Detail Modal Component
function TaskDetailModal({
  task,
  onClose,
}: {
  task: NonNullable<ReturnType<ReturnType<typeof useApp>["getTask"]>>;
  onClose: () => void;
}) {
  const { openModal, projects } = useApp();
  const project = projects.find((p) => p.id === task.projectId);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {task.key}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {task.type}
            </Badge>
          </div>
          <DialogTitle className="text-xl mt-2">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {task.description && (
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="mt-1">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge className="mt-1 capitalize">
                {task.status.replace("-", " ")}
              </Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Priority</Label>
              <Badge className="mt-1 capitalize">{task.priority}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Project</Label>
              <p className="mt-1">{project?.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Story Points</Label>
              <p className="mt-1">{task.storyPoints || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Assignee</Label>
              {task.assignee ? (
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="size-6">
                    <AvatarImage
                      src={task.assignee.avatar || "/placeholder.svg"}
                    />
                    <AvatarFallback>
                      {task.assignee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.assignee.name}</span>
                </div>
              ) : (
                <p className="mt-1 text-muted-foreground">Unassigned</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Reporter</Label>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="size-6">
                  <AvatarImage
                    src={task.reporter.avatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    {task.reporter.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span>{task.reporter.name}</span>
              </div>
            </div>
            {task.dueDate && (
              <div>
                <Label className="text-muted-foreground">Due Date</Label>
                <p className="mt-1">
                  {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {task.tags.length > 0 && (
            <div>
              <Label className="text-muted-foreground">Tags</Label>
              <div className="flex gap-1 mt-1">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              openModal("log-time", { taskId: task.id });
            }}
          >
            Log Time
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onClose();
              openModal("edit-task", { taskId: task.id });
            }}
          >
            Edit Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Assign Task Modal Component
function AssignTaskModal({
  taskIds,
  onClose,
  onAssign,
}: {
  taskIds: string[];
  onClose: () => void;
  onAssign: (userId: string) => void;
}) {
  const { users } = useApp();
  const [selectedUser, setSelectedUser] = useState<string>("");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Assign {taskIds.length > 1 ? `${taskIds.length} Tasks` : "Task"}
          </DialogTitle>
          <DialogDescription>Select a team member to assign</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedUser(user.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${selectedUser === user.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted"
                }`}
            >
              <Avatar className="size-8">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role?.replace("-", " ") || "Contributor"}
                </p>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onAssign(selectedUser)}
            disabled={!selectedUser}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Change Status Modal Component
function ChangeStatusModal({
  taskIds,
  onClose,
  onChangeStatus,
}: {
  taskIds: string[];
  onClose: () => void;
  onChangeStatus: (status: TaskStatus) => void;
}) {
  const statuses: { value: TaskStatus; label: string; color: string }[] = [
    { value: "open", label: "Open", color: "bg-muted-foreground" },
    { value: "assigned", label: "Assigned", color: "bg-accent" },
    { value: "in-progress", label: "In Progress", color: "bg-primary" },
    {
      value: "pending-approval",
      label: "Pending Approval",
      color: "bg-warning",
    },
    { value: "on-hold", label: "On Hold", color: "bg-muted-foreground" },
    { value: "closed", label: "Closed", color: "bg-success" },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[200px] p-2">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
            {taskIds.length > 1
              ? `Update ${taskIds.length} tasks`
              : "Set status"}
          </p>
          {statuses.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => onChangeStatus(status.value)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-left"
            >
              <div className={`size-2 rounded-full ${status.color}`} />
              <span className="text-sm">{status.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Template icon mapper
const templateIconMap: Record<string, React.ReactNode> = {
  Code2: <Code2 className="size-5" />,
  Smartphone: <Smartphone className="size-5" />,
  Share2: <Share2 className="size-5" />,
  Rocket: <Rocket className="size-5" />,
  Video: <Video className="size-5" />,
  Megaphone: <Megaphone className="size-5" />,
  TrendingUp: <TrendingUp className="size-5" />,
  Settings: <Settings className="size-5" />,
  FolderPlus: <FolderPlus className="size-5" />,
};

// Create Project Modal Component with Template Selection and Client Tagging
function CreateProjectModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (
    project: Parameters<ReturnType<typeof useApp>["addProject"]>[0],
  ) => void;
}) {
  const { users, clients, teams, addClient, addTeam } = useApp();
  const [step, setStep] = useState<"template" | "details">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [isKeyManual, setIsKeyManual] = useState(false);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<
    "agile-scrum" | "agile-kanban" | "waterfall" | "hybrid"
  >("agile-scrum");
  const [startDate, setStartDate] = useState(getTodayDateInputValue());
  const [dueDate, setDueDate] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [dueDateError, setDueDateError] = useState("");
  const [budget, setBudget] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [stakeholderType, setStakeholderType] = useState<"client" | "team">(
    "client",
  );
  const [showFullCreateClient, setShowFullCreateClient] = useState(false);
  const [showFullCreateTeam, setShowFullCreateTeam] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedTeamData = teams.find((t) => t.id === teamId);

  const blankProjectTemplate: ProjectTemplate = {
    id: "blank",
    name: "Blank Project",
    description: "Start from scratch with a custom setup",
    category: "custom",
    icon: "FolderPlus",
    color: "#64748b",
    projectType: "agile-scrum",
    defaultTasks: [],
    suggestedTags: [],
  };

  const allTemplates = [blankProjectTemplate, ...projectTemplates];
  const template = allTemplates.find((t) => t.id === selectedTemplate);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = allTemplates.find((t) => t.id === templateId);
    if (tpl) {
      setType(tpl.projectType as any);
      setDescription(tpl.description);
    }
    setStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    if (isPastDate(startDate)) {
      setStartDateError("Please select today's date or a future start date.");
      return;
    }

    if (isPastDate(dueDate)) {
      setDueDateError("Please select today's date or a future due date.");
      return;
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      setDueDateError("End date cannot be before the start date.");
      return;
    }

    onSubmit({
      name: name.trim(),
      key: key.trim().toUpperCase(),
      description: description.trim(),
      type,
      status: "active",
      startDate: startDate || getTodayDateInputValue(),
      endDate: dueDate || undefined,
      owner: users[0],
      members: [users[0]],
      aiConfidence: 80,
      riskLevel: "low",
      progress: 0,
      budget: budget ? parseInt(budget) : 100000,
      spent: 0,
      clientId:
        stakeholderType === "client"
          ? clientId === "none"
            ? undefined
            : clientId
          : undefined,
      teamId:
        stakeholderType === "team"
          ? teamId === "none"
            ? undefined
            : teamId
          : undefined,
      templateId: selectedTemplate || undefined,
    });
    onClose();
  };

  if (step === "template") {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Start with a template or create a blank project
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-4">
              {allTemplates.map((tpl: any) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className="flex flex-col items-start p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-all text-left group"
                >
                  <div
                    className="size-10 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: `${tpl.color}20`,
                      color: tpl.color,
                    }}
                  >
                    {templateIconMap[tpl.icon] || (
                      <FolderPlus className="size-5" />
                    )}
                  </div>
                  <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {tpl.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {tpl.projectType.replace("-", " ")}
                    </Badge>
                    {tpl.defaultTasks && tpl.defaultTasks.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {tpl.defaultTasks.length} tasks
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[95vh]">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            {template && (
              <Badge
                variant="outline"
                style={{ borderColor: template.color, color: template.color }}
                className="text-xs"
              >
                {template.name}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setStep("template")}
            >
              Change template
            </Button>
          </div>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Set up your project details</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setName(newName);
                    if (newName.trim() === "") {
                      setIsKeyManual(false);
                      setKey("");
                    } else if (!isKeyManual) {
                      const generatedKey = newName
                        .trim()
                        .substring(0, 3)
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "");
                      setKey(generatedKey);
                    }
                  }}
                  placeholder="My Project"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-key">Project Key *</Label>
                <Input
                  id="project-key"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value.toUpperCase());
                    setIsKeyManual(true);
                  }}
                  placeholder="PRJ"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project description..."
                rows={3}
              />
            </div>

            {/* Stakeholder Selection */}
            <div className="space-y-2">
              <Label>Project Stakeholder (Optional)</Label>
              <Tabs
                value={stakeholderType}
                onValueChange={(v) =>
                  setStakeholderType(v as "client" | "team")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="client" className="text-xs">
                    External Client
                  </TabsTrigger>
                  <TabsTrigger value="team" className="text-xs">
                    Internal Team
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="client" className="mt-2 space-y-2">
                  <div className="w-full">
                    <Select
                      value={clientId}
                      onValueChange={(v) => {
                        if (v === "create-new") {
                          setShowFullCreateClient(true);
                        } else {
                          setClientId(v);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">
                            No client
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="create-new"
                          className="text-primary font-semibold border-b rounded-none mb-1"
                        >
                          <div className="flex items-center gap-2">
                            <PlusCircle className="size-3.5" />
                            Create New Client
                          </div>
                        </SelectItem>
                        {clients.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No clients available
                          </div>
                        ) : (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex items-center gap-2">
                                {client.type === "external" ? (
                                  <ExternalLink className="size-3.5 text-blue-500" />
                                ) : (
                                  <Building className="size-3.5 text-green-500" />
                                )}
                                <span>{client.name}</span>
                                {client.company && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({client.company})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>



                    {selectedClient && clientId !== "none" && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                                Client Email
                              </p>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Mail className="size-3.5 text-primary/70" />
                                <span className="truncate font-medium">
                                  {selectedClient.email}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                                Phone Number
                              </p>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Smartphone className="size-3.5 text-primary/70" />
                                <span className="font-medium">
                                  {selectedClient.phone || "Not provided"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="team" className="mt-2 space-y-2">
                  <div className="w-full">
                    <Select
                      value={teamId}
                      onValueChange={(v) => {
                        if (v === "create-new") {
                          setShowFullCreateTeam(true);
                        } else {
                          setTeamId(v);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">No team</span>
                        </SelectItem>
                        <SelectItem
                          value="create-new"
                          className="text-primary font-semibold border-b rounded-none mb-1"
                        >
                          <div className="flex items-center gap-2">
                            <PlusCircle className="size-3.5" />
                            Create New Team
                          </div>
                        </SelectItem>
                        {teams.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No teams available
                          </div>
                        ) : (
                          teams.map((team: any) => (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center gap-2">
                                <Users className="size-3.5 text-primary" />
                                <span>{team.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>



                    {selectedTeamData && teamId !== "none" && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                          Team Leadership
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground">
                              Project Manager
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Avatar className="size-5 border border-border">
                                <AvatarImage
                                  src={
                                    selectedTeamData.projectManager.avatar ||
                                    "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback className="text-[8px]">
                                  {selectedTeamData.projectManager.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium truncate">
                                {selectedTeamData.projectManager.name}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground">
                              Team Lead
                            </p>
                            {selectedTeamData.lead ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar className="size-5 border border-border">
                                  <AvatarImage
                                    src={
                                      selectedTeamData.lead.avatar ||
                                      "/placeholder.svg"
                                    }
                                  />
                                  <AvatarFallback className="text-[8px]">
                                    {selectedTeamData.lead.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium truncate">
                                  {selectedTeamData.lead.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Unassigned
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground">
                              Product Manager
                            </p>
                            {selectedTeamData.productManager ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar className="size-5 border border-border">
                                  <AvatarImage
                                    src={
                                      selectedTeamData.productManager.avatar ||
                                      "/placeholder.svg"
                                    }
                                  />
                                  <AvatarFallback className="text-[8px]">
                                    {selectedTeamData.productManager.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium truncate">
                                  {selectedTeamData.productManager.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Methodology</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as typeof type)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agile-scrum">Agile - Scrum</SelectItem>
                  <SelectItem value="agile-kanban">Agile - Kanban</SelectItem>
                  <SelectItem value="waterfall">Waterfall</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  min={getTodayDateInputValue()}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setStartDate(nextValue);
                    setStartDateError(
                      isPastDate(nextValue)
                        ? "Please select today's date or a future start date."
                        : "",
                    );
                    if (dueDate && new Date(nextValue) > new Date(dueDate)) {
                      setDueDateError(
                        "End date cannot be before the start date.",
                      );
                    } else if (
                      dueDateError ===
                      "End date cannot be before the start date."
                    ) {
                      setDueDateError("");
                    }
                  }}
                  aria-invalid={!!startDateError}
                />
                {startDateError && (
                  <p className="text-sm text-destructive">{startDateError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  min={startDate || getTodayDateInputValue()}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setDueDate(nextValue);
                    if (isPastDate(nextValue)) {
                      setDueDateError(
                        "Please select today's date or a future due date.",
                      );
                    } else if (
                      startDate &&
                      new Date(nextValue) < new Date(startDate)
                    ) {
                      setDueDateError(
                        "End date cannot be before the start date.",
                      );
                    } else {
                      setDueDateError("");
                    }
                  }}
                  aria-invalid={!!dueDateError}
                />
                {dueDateError && (
                  <p className="text-sm text-destructive">{dueDateError}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Budget ($)</Label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="100000"
              />
            </div>

            {template &&
              (template as any).defaultTasks &&
              (template as any).defaultTasks.length > 0 && (
                <div className="rounded-lg border border-border p-3 bg-muted/30">
                  <p className="text-xs font-medium mb-2">
                    This template includes:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {(template as any).defaultTasks.length} starter tasks
                    </Badge>
                    {(template as any).defaultSprints && (
                      <Badge variant="secondary" className="text-[10px]">
                        {(template as any).defaultSprints.length} sprints
                      </Badge>
                    )}
                    {(template as any).suggestedTags &&
                      (template as any).suggestedTags.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {(template as any).suggestedTags.length} tags
                        </Badge>
                      )}
                  </div>
                </div>
              )}
          </div>

          <DialogFooter className="p-6 border-t bg-slate-50/50 shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                !key.trim() ||
                !!dueDateError ||
                !!startDateError
              }
              className="bg-[#6366F1] hover:bg-[#5558E3]"
            >
              Create Project
            </Button>
          </DialogFooter>
        </form>

        {showFullCreateClient && (
          <CreateClientModal
            onClose={() => setShowFullCreateClient(false)}
            onSubmit={async (clientData) => {
              try {
                const newC = await addClient(clientData);
                setClientId(newC.id);
              } catch (error) {
                console.error("Failed to create client", error);
              }
            }}
          />
        )}

        {showFullCreateTeam && (
          <CreateTeamModal
            onClose={() => setShowFullCreateTeam(false)}
            onSubmit={async (teamData) => {
              try {
                const newT = await addTeam(teamData);
                setTeamId(newT.id);
              } catch (error) {
                console.error("Failed to create team", error);
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Create Client Modal Component
function CreateClientModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState<ClientType>("external");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim() || !email.trim()) return;

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      type,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Add a new external client or internal stakeholder
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="client-name">Full Name *</Label>
              <Input
                id="client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email *</Label>
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-company">Company</Label>
              <Input
                id="client-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label>Client Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ClientType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">Address</Label>
            <Textarea
              id="client-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Street, City, Country"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-notes">Notes</Label>
            <Textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !email.trim()}>
              Create Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Team Modal Component
function CreateTeamModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (team: Parameters<ReturnType<typeof useApp>["addTeam"]>[0]) => void;
}) {
  const { users, projects } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectManagerId, setProjectManagerId] = useState(users[0]?.id || "");
  const [leadId, setLeadId] = useState<string>("");
  const [productManagerId, setProductManagerId] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    users[0] ? [users[0].id] : [],
  );
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [capacity, setCapacity] = useState("40");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim() || !projectManagerId) return;

    const projectManager = users.find((u) => u.id === projectManagerId)!;
    const lead = users.find((u) => u.id === leadId);
    const productManager = users.find((u) => u.id === productManagerId);
    const members = users.filter((u) => selectedMembers.includes(u.id));

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      projectManager,
      lead,
      productManager,
      members,
      projects: projects.filter((p) => selectedProjects.includes(p.id)),
      projectIds: selectedProjects,
      velocity: 0,
      capacity: Number(capacity) || 40,
    });

    onClose();
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Set up a new team with roles, members, and projects
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering Team"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Sprint Capacity</Label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Team description..."
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Project Manager <span className="text-destructive">*</span>
              </Label>
              <Select value={projectManagerId} onValueChange={setProjectManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select PM" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <span className="flex items-center gap-2">
                        <Avatar className="size-4">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-[10px]">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{user.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team Lead (Optional)</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center gap-2">
                          <Avatar className="size-4">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-[10px]">
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{user.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product Manager (Optional)</Label>
                <Select value={productManagerId} onValueChange={setProductManagerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center gap-2">
                          <Avatar className="size-4">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-[10px]">
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{user.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Team Members</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-border rounded-lg">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedMembers.includes(user.id)}
                    onCheckedChange={() => toggleMember(user.id)}
                  />
                  <span className="text-sm">{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assigned Projects</Label>
            <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto p-2 border border-border rounded-lg">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={() => toggleProject(project.id)}
                  />
                  <span className="text-sm">{project.name}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Team Modal Component
function EditTeamModal({
  teamId,
  onClose,
  onSubmit,
}: {
  teamId: string;
  onClose: () => void;
  onSubmit: (id: string, updates: Partial<Team>) => void;
}) {
  const { users, projects, teams } = useApp();
  const team = teams.find((t) => t.id === teamId);

  const [name, setName] = useState(team?.name || "");
  const [description, setDescription] = useState(team?.description || "");
  const [projectManagerId, setProjectManagerId] = useState(team?.projectManager?.id || "");
  const [leadId, setLeadId] = useState(team?.lead?.id || "none");
  const [productManagerId, setProductManagerId] = useState(team?.productManager?.id || "none");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    team?.members.map((m) => m.id) || []
  );
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    team?.projectIds || []
  );
  const [capacity, setCapacity] = useState(String(team?.capacity || "40"));

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || "");
      setProjectManagerId(team.projectManager?.id || "");
      setLeadId(team.lead?.id || "none");
      setProductManagerId(team.productManager?.id || "none");
      setSelectedMembers(team.members.map((m) => m.id));
      setSelectedProjects(team.projectIds || []);
      setCapacity(String(team.capacity || "40"));
    }
  }, [team]);

  if (!team) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectManagerId) return;

    const projectManager = users.find((u) => u.id === projectManagerId)!;
    const lead = users.find((u) => u.id === leadId);
    const productManager = users.find((u) => u.id === productManagerId);
    const members = users.filter((u) => selectedMembers.includes(u.id));

    onSubmit(teamId, {
      name: name.trim(),
      description: description.trim(),
      projectManager,
      lead: leadId === "none" ? undefined : lead,
      productManager: productManagerId === "none" ? undefined : productManager,
      members,
      projectIds: selectedProjects,
      capacity: Number(capacity) || 40,
    });

    onClose();
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team roles, members, and project assignments
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team Name *</Label>
              <Input
                id="edit-team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering Team"
              />
            </div>
            <div className="space-y-2">
              <Label>Sprint Capacity</Label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-team-description">Description</Label>
            <Textarea
              id="edit-team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Team description..."
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Project Manager <span className="text-destructive">*</span>
              </Label>
              <Select value={projectManagerId} onValueChange={setProjectManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select PM" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <span className="flex items-center gap-2">
                        <Avatar className="size-4">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-[10px]">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{user.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team Lead (Optional)</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center gap-2">
                          <Avatar className="size-4">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-[10px]">
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{user.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product Manager (Optional)</Label>
                <Select value={productManagerId} onValueChange={setProductManagerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center gap-2">
                          <Avatar className="size-4">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-[10px]">
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{user.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Team Members</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-border rounded-lg">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedMembers.includes(user.id)}
                    onCheckedChange={() => toggleMember(user.id)}
                  />
                  <span className="text-sm">{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assigned Projects</Label>
            <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto p-2 border border-border rounded-lg">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={() => toggleProject(project.id)}
                  />
                  <span className="text-sm">{project.name}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !projectManagerId}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Program Modal Component
function CreateProgramModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (
    program: Parameters<ReturnType<typeof useApp>["addProgram"]>[0],
  ) => void;
}) {
  const { portfolios, users, projects } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id || "");
  const [ownerId, setOwnerId] = useState(users[0]?.id || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const owner = users.find((u) => u.id === ownerId) || users[0];

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      portfolioId,
      projects: projects.filter((p) => selectedProjects.includes(p.id)),
      owner,
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || undefined,
      aiConfidence: 80,
      riskLevel: "low" as RiskLevel,
      progress: 0,
      status: "planning",
      budget: Number(budget) || 0,
      spent: 0,
      projectIds: selectedProjects,
    });

    onClose();
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Program</DialogTitle>
          <DialogDescription>
            Set up a new program to group related projects
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program-name">Program Name *</Label>
            <Input
              id="program-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digital Transformation"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-description">Description</Label>
            <Textarea
              id="program-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Program description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Portfolio</Label>
              <Select value={portfolioId} onValueChange={setPortfolioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Program Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Budget ($)</Label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="200000"
            />
          </div>

          <div className="space-y-2">
            <Label>Projects</Label>
            <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto p-2 border border-border rounded-lg">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={() => toggleProject(project.id)}
                  />
                  <span className="text-sm">{project.name}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Program
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Portfolio Modal Component
function CreatePortfolioModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (
    portfolio: Parameters<ReturnType<typeof useApp>["addPortfolio"]>[0],
  ) => void;
}) {
  const { users } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState(users[0]?.id || "");
  const [budget, setBudget] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const owner = users.find((u) => u.id === ownerId) || users[0];

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      programs: [],
      owner,
      budget: budget ? parseInt(budget) : 500000,
      spent: 0,
      aiConfidence: 85,
      riskLevel: "low" as RiskLevel,
      progress: 0,
      status: "planning",
      programIds: [],
    });

    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Portfolio</DialogTitle>
          <DialogDescription>
            Set up a new portfolio to organize programs
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="portfolio-name">Portfolio Name *</Label>
            <Input
              id="portfolio-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Technology Initiatives"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio-description">Description</Label>
            <Textarea
              id="portfolio-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Portfolio description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Portfolio Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget ($)</Label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Portfolio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Log Time Modal Component
function LogTimeModal({
  taskId,
  onClose,
  onSubmit,
}: {
  taskId: string;
  onClose: () => void;
  onSubmit: (
    entry: Parameters<ReturnType<typeof useApp>["addTimeEntry"]>[0],
  ) => void;
}) {
  const { getTask, currentUser } = useApp();
  const task = getTask(taskId);
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) return;

    onSubmit({
      taskId,
      userId: currentUser.id,
      hours: parseFloat(hours),
      date,
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
          <DialogDescription>
            {task
              ? `Log time for ${task.key}: ${task.title}`
              : "Log time entry"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hours">Hours *</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="2.5"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="log-date">Date</Label>
            <Input
              id="log-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="log-description">Description</Label>
            <Textarea
              id="log-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!hours || parseFloat(hours) <= 0}>
              Log Time
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Member Modal Component
function AddMemberModal({
  teamId,
  onClose,
}: {
  teamId: string;
  onClose: () => void;
}) {
  const { getTeam, addTeamMember, teams, users } = useApp();
  const team = getTeam(teamId);
  const [selectedUser, setSelectedUser] = useState<string>("");

  if (!team) return null;

  const availableUsers = users.filter(
    (u) => !team.members.some((m) => m.id === u.id),
  );

  const handleAdd = () => {
    if (selectedUser) {
      addTeamMember(teamId, selectedUser);
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Add a member to {team.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {availableUsers.length > 0 ? (
            availableUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUser(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${selectedUser === user.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
                  }`}
              >
                <Avatar className="size-8">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role?.replace("-", " ") || "Contributor"}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              All users are already team members
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedUser}>
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Create Sprint Modal Component
function CreateSprintModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (sprint: Omit<Sprint, "id">, taskIds?: string[]) => void;
}) {
  const { projects, tasks } = useApp();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(getTodayDateInputValue());
  const [endDate, setEndDate] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [dateError, setDateError] = useState("");

  const backlogTasks = tasks.filter(
    (t) => t.projectId === projectId && !t.sprintId,
  );
  const [selectedBacklogTasks, setSelectedBacklogTasks] = useState<string[]>(
    [],
  );

  useEffect(() => {
    setSelectedBacklogTasks([]);
  }, [projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isPastDate(startDate)) {
      setDateError("Start date cannot be in the past.");
      return;
    }

    if (endDate && new Date(startDate) > new Date(endDate)) {
      setDateError("End date cannot be before start date.");
      return;
    }

    onSubmit(
      {
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate,
        endDate: endDate || startDate,
        status: "active",
        projectId,
      },
      selectedBacklogTasks,
    );
    onClose();
  };

  const toggleBacklogTaskSelection = (taskId: string) => {
    setSelectedBacklogTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Sprint</DialogTitle>
          <DialogDescription>
            Define the sprint details and select tasks from the backlog.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sprint-name">Sprint Name *</Label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sprint 1, Q2 Iteration"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprint-project">Associated Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="sprint-project">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {p.key}
                      </Badge>
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-start-date">Start Date *</Label>
              <Input
                id="sprint-start-date"
                type="date"
                value={startDate}
                min={getTodayDateInputValue()}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateError("");
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint-end-date">End Date *</Label>
              <Input
                id="sprint-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateError("");
                }}
                required
              />
            </div>
          </div>

          {dateError && <p className="text-sm text-destructive">{dateError}</p>}

          <div className="space-y-2">
            <Label htmlFor="sprint-goal">Sprint Goal</Label>
            <Textarea
              id="sprint-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What does the team aim to achieve?"
              rows={2}
            />
          </div>

          {/* Backlog Task Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Backlog Tasks</Label>
              {selectedBacklogTasks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedBacklogTasks.length} selected (
                  {backlogTasks
                    .filter((t) => selectedBacklogTasks.includes(t.id))
                    .reduce((sum, t) => sum + (t.storyPoints || 0), 0)}{" "}
                  pts)
                </Badge>
              )}
            </div>
            <ScrollArea className="h-48 border rounded-lg">
              {backlogTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No tasks in backlog
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {backlogTasks.map((task) => (
                    <label
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedBacklogTasks.includes(task.id) &&
                        "bg-primary/5",
                      )}
                    >
                      <Checkbox
                        checked={selectedBacklogTasks.includes(task.id)}
                        onCheckedChange={() =>
                          toggleBacklogTaskSelection(task.id)
                        }
                      />
                      <span
                        className={cn(
                          "text-[10px] font-mono px-1 py-0.5 rounded border shrink-0",
                          {
                            "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400":
                              task.type === "bug",
                            "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400":
                              task.type === "epic",
                            "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400":
                              task.type === "story",
                            "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400":
                              task.type === "task" || task.type === "subtask",
                          },
                        )}
                      >
                        {task.key}
                      </span>
                      <span className="flex-1 text-sm truncate">
                        {task.title}
                      </span>
                      {task.storyPoints && (
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0"
                        >
                          {task.storyPoints} pts
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !projectId || !!dateError}
            >
              Create Sprint{" "}
              {selectedBacklogTasks.length > 0 &&
                `(${selectedBacklogTasks.length} tasks)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Client Detail Modal Component
function ClientDetailModal({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const { clients, projects } = useApp();
  const client = clients.find((c) => c.id === clientId);

  if (!client) return null;

  const clientProjects = projects.filter((p) => p.clientId === clientId);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-2 border-background shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold truncate">
                {client.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detailed information for client {client.name}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-medium h-5",
                    client.type === "external"
                      ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  )}
                >
                  {client.type === "external" ? (
                    <Globe className="size-2.5 mr-1" />
                  ) : (
                    <Building2 className="size-2.5 mr-1" />
                  )}
                  {client.type.charAt(0).toUpperCase() + client.type.slice(1)}{" "}
                  Client
                </Badge>
                {client.company && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building className="size-3" />
                    {client.company}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Contact Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Mail className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Email
                    </p>
                    <p className="text-sm font-medium break-all">
                      {client.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Phone className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Phone
                    </p>
                    <p className="text-sm font-medium">
                      {client.phone || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">
                      Address
                    </p>
                    <p className="text-sm font-medium leading-relaxed">
                      {client.address || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Projects ({clientProjects.length})
              </h3>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {clientProjects.length > 0 ? (
                  clientProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 rounded-xl border bg-card hover:bg-accent/5 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-muted border flex items-center justify-center font-mono text-[10px] font-bold">
                          {project.key}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate max-w-[120px]">
                            {project.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground capitalize">
                            {project.status.replace("-", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold">
                          {project.progress}%
                        </p>
                        <div className="w-12 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-muted/20">
                    <FolderPlus className="size-6 text-muted-foreground/30 mb-2" />
                    <p className="text-[10px] text-muted-foreground font-medium">
                      No projects assigned
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {client.notes && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Internal Notes
              </h3>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-sm text-foreground/80 leading-relaxed">
                {client.notes}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
