'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from 'lucide-react';
import { tags as availableTags } from '@/lib/mock-data';
import { TaskPriority, TaskStatus, TaskComment, TaskAttachment, TaskLink, Task, Project, User } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function TaskDetailClient({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { tasks, users, currentUser, getTask, updateTask, openModal, projects, isMounted } = useApp();
  const task = getTask(taskId);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'task' | 'bug' | 'story' | 'epic' | 'subtask'>('task');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('open');
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
  
  const [isChanged, setIsChanged] = useState(false);

  // Initialize state from task
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setType(task.type);
      setPriority(task.priority);
      setStatus(task.status);
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

  // Track changes
  useEffect(() => {
    if (task) {
      const changed = 
        title !== task.title ||
        description !== (task.description || '') ||
        type !== task.type ||
        priority !== task.priority ||
        status !== task.status ||
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
  }, [title, description, type, priority, status, storyPoints, startDate, dueDate, assignee, selectedTags, comments, attachments, linkedTasks, task]);

  if (!isMounted) return null;

  if (!task) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-muted-foreground">Loading task details...</p>
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
                    <TabsTrigger value="comments" className="gap-2">
                      <MessageSquare className="size-4" />
                      Comments ({comments.length})
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

                    <TabsContent value="comments" className="space-y-6 m-0">
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <Avatar className="size-10">
                            <AvatarImage src={currentUser.avatar || '/placeholder.svg'} />
                            <AvatarFallback>{currentUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <Textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              rows={3}
                            />
                            <div className="flex justify-end">
                              <Button onClick={handleAddComment} disabled={!newComment.trim()} className="gap-2">
                                <Send className="size-4" />
                                Post Comment
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-6 pt-4">
                          {comments.map((comment: TaskComment) => {
                            const user = users.find((u: User) => u.id === comment.userId);
                            return (
                              <div key={comment.id} className="flex gap-4 group">
                                <Avatar className="size-10">
                                  <AvatarImage src={user?.avatar || '/placeholder.svg'} />
                                  <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('') || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">{user?.name || 'Unknown'}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(comment.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                    <p className="text-sm leading-relaxed">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                      <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="pending-approval">Pending Approval</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
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
                                <Avatar className="size-5">
                                  <AvatarImage src={user.avatar || '/placeholder.svg'} />
                                  <AvatarFallback className="text-xs">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
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
                          <Avatar className="size-6">
                            <AvatarImage src={task.reporter.avatar || '/placeholder.svg'} />
                            <AvatarFallback>{task.reporter.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
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
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Logged</span>
                      <span className="font-bold">0h</span>
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
