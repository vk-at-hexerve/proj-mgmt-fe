'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Paperclip, 
  Link2, 
  Clock, 
  Send, 
  Trash2, 
  Upload,
  History,
  FileText,
  Image,
  File as FileIcon,
  Check,
  ArrowLeft,
  Save,
  ChevronRight,
  ExternalLink,
  Loader2,
  Calendar
} from 'lucide-react';
import { tags as availableTags } from '@/lib/mock-data';
import { TaskPriority, TaskComment, TaskAttachment, TaskLink, Task, Project, User, TimeEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function TaskDetailClient({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { tasks, users, currentUser, getTask, updateTask, openModal, projects, isMounted, getTaskActivities, addTimeEntry, showToast, getProjectStatuses, workflowStatuses } = useApp();
  const task = getTask(taskId);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'task' | 'bug' | 'story' | 'epic' | 'subtask'>('task');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [statusId, setStatusId] = useState<string>('');
  const [storyPoints, setStoryPoints] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [assignee, setAssignee] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Comments state
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [showCommentHistory, setShowCommentHistory] = useState<string | null>(null);
  
  // Attachments state
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  
  // Linked tasks state
  const [linkedTasks, setLinkedTasks] = useState<TaskLink[]>([]);
  
  // Activity state
  const [activityDescription, setActivityDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [taskActivities, setTaskActivities] = useState<TimeEntry[]>([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);

  const [isChanged, setIsChanged] = useState(false);

  // Initialize state from task
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setType(task.type);
      setPriority(task.priority);
      setStatusId(task.statusId || '');
      setStoryPoints(task.storyPoints?.toString() || '');
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setAssignee(task.assignee?.id || 'unassigned');
      setSelectedTags(task.tags?.map((t: any) => t.id) || []);
      setComments(task.comments || []);
      setAttachments(task.attachments || []);
      setLinkedTasks(task.linkedTasks || []);
    }
  }, [task]);

  // Load activities for this task on mount
  useEffect(() => {
    if (task?.id && !activitiesLoaded) {
      getTaskActivities(task.id).then((entries) => {
        setTaskActivities(entries);
        setActivitiesLoaded(true);
      });
    }
  }, [task?.id, activitiesLoaded, getTaskActivities]);

  // Track changes
  useEffect(() => {
    if (task) {
      const changed = 
        title !== task.title ||
        description !== (task.description || '') ||
        type !== task.type ||
        priority !== task.priority ||
        statusId !== task.statusId ||
        storyPoints !== (task.storyPoints?.toString() || '') ||
        startDate !== (task.startDate || '') ||
        dueDate !== (task.dueDate || '') ||
        assignee !== (task.assignee?.id || 'unassigned') ||
        JSON.stringify(selectedTags) !== JSON.stringify(task.tags?.map((t: any) => t.id) || []) ||
        JSON.stringify(comments) !== JSON.stringify(task.comments || []) ||
        JSON.stringify(attachments) !== JSON.stringify(task.attachments || []) ||
        JSON.stringify(linkedTasks) !== JSON.stringify(task.linkedTasks || []);
      
      setIsChanged(changed);
    }
  }, [title, description, type, priority, statusId, storyPoints, startDate, dueDate, assignee, selectedTags, comments, attachments, linkedTasks, task]);

  if (!isMounted) return null;

  if (!task) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          {isMounted && tasks.length > 0 ? (
            <div className="text-center space-y-4">
              <p className="text-xl font-semibold text-muted-foreground">Task not found</p>
              <Button onClick={() => router.push('/')}>Go to Dashboard</Button>
            </div>
          ) : (
            <p className="text-muted-foreground animate-pulse">Loading task details...</p>
          )}
        </div>
      </div>
    );
  }

  const project = projects.find((p: Project) => p.id === task.projectId);
  const currentUserId = currentUser.id;

  const handleSave = () => {
    const selectedUser = users.find((u: User) => u.id === assignee);
    const selectedTagObjects = availableTags.filter((t: any) => selectedTags.includes(t.id));

    updateTask(taskId, {
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      statusId,
      storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      assignee: selectedUser,
      tags: selectedTagObjects,
      comments,
      attachments,
      linkedTasks,
    });
    setIsChanged(false);
  };

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
    setNewComment('');
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

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "";
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diffMs = e - s;
    if (diffMs <= 0) return "0m";

    const totalMinutes = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const calculateTotalLoggedTime = (activities: TimeEntry[]) => {
    let totalMs = 0;
    activities.forEach(entry => {
      if (entry.startAt && entry.endAt) {
        const s = new Date(entry.startAt).getTime();
        const e = new Date(entry.endAt).getTime();
        if (e > s) totalMs += (e - s);
      }
    });

    const totalMinutes = Math.floor(totalMs / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleAddActivity = async () => {
    if (!activityDescription.trim() || !startTime || !endTime || !task?.id) return;

    if (startTime >= endTime) {
      showToast({ title: "Invalid time range", description: "End time must be after start time", type: "error" });
      return;
    }

    setIsSavingActivity(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const startAt = new Date(`${today}T${startTime}:00`).toISOString();
      const endAt = new Date(`${today}T${endTime}:00`).toISOString();

      await addTimeEntry({
        taskId: task.id,
        userId: currentUserId,
        description: activityDescription.trim(),
        date: today,
        startAt: startAt,
        endAt: endAt,
        hours: 0,
      });

      setActivityDescription("");
      setStartTime("");
      setEndTime("");

      const updated = await getTaskActivities(task.id);
      setTaskActivities(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
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
      setAttachments(prev => [...prev, attachment]);
    });
    e.target.value = '';
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="size-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="size-4" />;
    return <FileIcon className="size-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader 
          title={task.key}
          subtitle={task.title}
          actions={
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.back()}
                className="gap-1"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={!isChanged || !title.trim()}
                className="gap-1"
              >
                <Save className="size-4" />
                Save Changes
              </Button>
            </div>
          }
        />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-lg py-1 px-3 font-mono">{task.key}</Badge>
              <Badge variant="secondary" className="text-lg py-1 px-3 capitalize">{task.type}</Badge>
              <Separator orientation="vertical" className="h-8 mx-2" />
              <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="activity" className="gap-2">
                      <Clock className="size-4" />
                      Activity ({taskActivities.length + comments.length})
                    </TabsTrigger>
                    <TabsTrigger value="attachments" className="gap-2">
                      <Paperclip className="size-4" />
                      Files ({attachments.length})
                    </TabsTrigger>
                    <TabsTrigger value="links" className="gap-2">
                      <Link2 className="size-4" />
                      Links ({linkedTasks.length})
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    <TabsContent value="details" className="space-y-6 m-0">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="page-title" className="text-lg font-semibold">Title</Label>
                          <Input
                            id="page-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-xl h-12"
                            placeholder="Enter task title"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="page-description" className="text-lg font-semibold">Description</Label>
                          <Textarea
                            id="page-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a detailed description..."
                            rows={8}
                            className="resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-lg font-semibold">Tags</Label>
                          <div className="flex flex-wrap gap-2 p-4 border rounded-xl bg-muted/20">
                            {availableTags.map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
                                  selectedTags.includes(tag.id)
                                    ? 'ring-2 ring-offset-2'
                                    : 'opacity-60 hover:opacity-100'
                                }`}
                                style={{ 
                                  backgroundColor: `${tag.color}15`, 
                                  color: tag.color,
                                  borderColor: tag.color,
                                  ...(selectedTags.includes(tag.id) && { ringColor: tag.color })
                                }}
                              >
                                {tag.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-6 m-0">
                      {/* Log Activity Section */}
                      <div className="rounded-2xl border bg-card p-6 space-y-6 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Clock className="size-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold">Log New Activity</h3>
                            <p className="text-xs text-muted-foreground text-pretty">Share what you've accomplished and track your time</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="page-activity-desc" className="text-sm font-semibold">What did you do today?</Label>
                            <Textarea
                              id="page-activity-desc"
                              value={activityDescription}
                              onChange={(e) => setActivityDescription(e.target.value)}
                              placeholder="Describe your progress, technical challenges overcome, or updates..."
                              rows={3}
                              className="resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="page-start-time" className="text-sm font-semibold">Start Time</Label>
                              <Input
                                id="page-start-time"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="page-end-time" className="text-sm font-semibold">End Time</Label>
                              <Input
                                id="page-end-time"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="h-11"
                              />
                            </div>
                          </div>

                          <Button
                            onClick={handleAddActivity}
                            disabled={!activityDescription.trim() || !startTime || !endTime || isSavingActivity}
                            className="w-full h-11 gap-2 mt-2 font-semibold"
                          >
                            {isSavingActivity ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Send className="size-4" />
                            )}
                            Save Activity Log
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Unified Feed: Activity + Comments */}
                      <div className="space-y-6">
                        {taskActivities.length === 0 && comments.length === 0 ? (
                          <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/20">
                            <History className="size-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                            <p className="text-muted-foreground font-medium italic">No activity logs or comments found for this task.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Activity Logs */}
                            {taskActivities.map((entry) => {
                              const user = users.find((u) => u.id === entry.userId);
                              return (
                                <div key={entry.id} className="flex items-start gap-4 p-5 rounded-2xl border bg-card hover:shadow-md transition-all duration-300">
                                  <UserAvatar user={user} size="lg" className="border shadow-sm shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                      <span className="font-bold text-foreground">{user?.name || 'Unknown'}</span>
                                      <span className="text-muted-foreground text-sm">—</span>
                                      <span className="text-foreground leading-relaxed">{entry.description}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="size-3.5" />
                                        <span>{formatTime(entry.startAt)} → {formatTime(entry.endAt)}</span>
                                      </div>
                                      <Badge variant="secondary" className="px-2 py-0 text-[10px] font-bold bg-primary/10 text-primary border-none">
                                        {calculateDuration(entry.startAt, entry.endAt)}
                                      </Badge>
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="size-3.5" />
                                        <span>{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Comments */}
                            {comments.map((comment: TaskComment) => {
                              const user = users.find((u: User) => u.id === comment.userId);
                              const isEditing = editingCommentId === comment.id;
                              const hasHistory = comment.editHistory && comment.editHistory.length > 0;

                              return (
                                <div key={comment.id} className="flex gap-4 p-5 rounded-2xl border bg-muted/20">
                                  <UserAvatar user={user} size="lg" className="shrink-0" />
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">{user?.name || "Unknown"}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                        {comment.updatedAt && (
                                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 opacity-60">edited</Badge>
                                        )}
                                      </div>
                                      {comment.userId === currentUserId && !isEditing && (
                                        <div className="flex items-center gap-1">
                                          <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-primary" onClick={() => handleEditComment(comment.id)}>
                                            <FileText className="size-4" />
                                          </Button>
                                          <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteComment(comment.id)}>
                                            <Trash2 className="size-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    {isEditing ? (
                                      <div className="space-y-3 mt-1">
                                        <Textarea
                                          value={editingCommentContent}
                                          onChange={(e) => setEditingCommentContent(e.target.value)}
                                          className="min-h-[80px]"
                                          placeholder="Edit your comment..."
                                        />
                                        <div className="flex gap-2 justify-end">
                                          <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                          <Button size="sm" onClick={() => handleSaveCommentEdit(comment.id)}>Save Changes</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-foreground leading-relaxed bg-white/50 p-4 rounded-xl border border-white/20 shadow-sm">{comment.content}</p>
                                    )}
                                    
                                    {hasHistory && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-[10px] gap-1.5 font-bold uppercase tracking-wider text-muted-foreground"
                                        onClick={() => setShowCommentHistory(showCommentHistory === comment.id ? null : comment.id)}
                                      >
                                        <History className="size-3.5" />
                                        {showCommentHistory === comment.id ? 'Hide History' : 'Show History'}
                                      </Button>
                                    )}

                                    {showCommentHistory === comment.id && hasHistory && (
                                      <div className="mt-3 p-4 rounded-xl bg-black/5 dark:bg-white/5 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Revision History</p>
                                        {comment.editHistory?.map((edit, idx) => (
                                          <div key={idx} className="text-xs border-l-2 border-primary/20 pl-3 space-y-1">
                                            <span className="text-[10px] text-muted-foreground">
                                              {new Date(edit.editedAt).toLocaleString()}:
                                            </span>
                                            <p className="text-muted-foreground line-through opacity-50 italic">{edit.content}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="attachments" className="space-y-6 m-0">
                      <div 
                        className="border-2 border-dashed rounded-2xl p-12 text-center hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => document.getElementById('page-file-upload')?.click()}
                      >
                        <input
                          type="file"
                          id="page-file-upload"
                          className="hidden"
                          multiple
                          onChange={handleFileUpload}
                        />
                        <div className="flex flex-col items-center gap-3">
                          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="size-6 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-lg">Click to upload or drag and drop</p>
                            <p className="text-sm text-muted-foreground">PDF, Images, Documents up to 10MB</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attachments.map((attachment) => (
                          <div 
                            key={attachment.id} 
                            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all group"
                          >
                            <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                              {getFileIcon(attachment.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="size-9 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="links" className="space-y-6 m-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Linked Tasks</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => openModal('link-task', { taskId: task.id })}
                        >
                          <Link2 className="size-4" />
                          Link Task
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {linkedTasks.length === 0 ? (
                          <div className="text-center py-12 border rounded-2xl bg-muted/20">
                            <Link2 className="size-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                            <p className="text-muted-foreground">No linked tasks found</p>
                          </div>
                        ) : (
                          linkedTasks.map((link: TaskLink) => {
                            const linkedTask = tasks.find((t: Task) => t.id === link.targetTaskId);
                            if (!linkedTask) return null;
                            return (
                              <div 
                                key={link.id}
                                className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                              >
                                <Badge variant="secondary" className="capitalize shrink-0">{link.linkType.replace('-', ' ')}</Badge>
                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                  <Badge variant="outline" className="font-mono shrink-0">{linkedTask.key}</Badge>
                                  <p className="font-medium truncate">{linkedTask.title}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setLinkedTasks(prev => prev.filter(l => l.id !== link.id))}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              <div className="space-y-8">
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className="px-6 py-4 border-b bg-muted/30">
                    <h3 className="font-bold">Properties</h3>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <Select value={statusId} onValueChange={setStatusId}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getProjectStatuses(project?.id || '').map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                                {s.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Priority</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                        <SelectTrigger className="h-10">
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

                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Assignee</Label>
                      <Select value={assignee} onValueChange={setAssignee}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <UserAvatar user={user} size="xs" />
                                {user.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-sm text-muted-foreground">Points</Label>
                        <Input
                          type="number"
                          value={storyPoints}
                          onChange={(e) => setStoryPoints(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm text-muted-foreground">Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as any)}>
                          <SelectTrigger className="h-10 capitalize">
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
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Reporter</span>
                        <div className="flex items-center gap-2">
                          <UserAvatar user={task.reporter} size="sm" />
                          <span className="font-medium">{task.reporter.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">{new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span className="font-medium">{task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl border bg-primary/5 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="size-5" />
                    <h3 className="font-bold">Time Tracking</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Logged Time</span>
                      <span className="font-bold">
                        {calculateTotalLoggedTime(taskActivities)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated</span>
                      <span className="font-bold">{storyPoints ? `${parseInt(storyPoints) * 4}h` : '8h'}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full h-10 gap-2"
                    onClick={() => openModal('log-time', { taskId: task.id })}
                  >
                    Log Time
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
