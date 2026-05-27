'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, X, ArrowUpAZ, ArrowDownZA, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskFilters, TaskSort } from '@/lib/types';
import { getStatusName } from '@/lib/status-utils';

interface ProjectFilterProps {
  projectId: string;
}

export function ProjectFilter({ projectId }: ProjectFilterProps) {
  const {
    taskFilters, setTaskFilters,
    taskSort, setTaskSort,
    workflowStatuses, teams, tasks, showToast,
    customFilters, activeCustomFilterId, addCustomFilter, updateCustomFilter
  } = useApp();

  const [open, setOpen] = React.useState(false);
  const [customFilterName, setCustomFilterName] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [assigneeSearch, setAssigneeSearch] = React.useState('');

  // Compute active filters count
  const activeFiltersCount =
    (taskFilters.assignees?.length || 0) +
    (taskFilters.priorities?.length || 0) +
    (taskFilters.types?.length || 0) +
    (taskFilters.statuses?.length || 0) +
    (taskFilters.isMilestone !== undefined && taskFilters.isMilestone !== null ? 1 : 0) +
    (taskFilters.startDateAfter ? 1 : 0) +
    (taskFilters.endDateBefore ? 1 : 0);

  const clearFilters = () => {
    setTaskFilters({});
  };

  const resetSorting = () => {
    setTaskSort({ field: 'title', direction: 'asc' });
  };

  const toggleArrayFilter = (field: keyof TaskFilters, value: string) => {
    setTaskFilters((prev) => {
      const current = (prev[field] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleApply = () => {
    setOpen(false);
    showToast({ title: 'Filters applied', description: `${activeFiltersCount} filter(s) active`, type: 'success' });
  };

  const handleSaveCustomFilter = async () => {
    if (!customFilterName.trim()) return;
    setIsSaving(true);
    await addCustomFilter(projectId, customFilterName.trim(), taskFilters, taskSort);
    setCustomFilterName('');
    setIsSaving(false);
  };

  const handleUpdateCustomFilter = async () => {
    if (!activeCustomFilterId) return;
    setIsSaving(true);
    await updateCustomFilter(activeCustomFilterId, { filters: taskFilters, sort: taskSort });
    setIsSaving(false);
  };

  // Extract available data for this project
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === projectId), [tasks, projectId]);
  const projectTeam = useMemo(() => teams.find(t => t.projects.some(p => p.id === projectId)) || teams[0], [teams, projectId]);

  const filteredMembers = useMemo(() => {
    if (!projectTeam) return [];

    const search = assigneeSearch.trim().toLowerCase();

    if (!search) {
      const selected = taskFilters.assignees || [];
      return projectTeam.members.filter(m => selected.includes(m.id));
    }

    return projectTeam.members.filter(m =>
      m.name.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search) ||
      ((m as any).username && (m as any).username.toLowerCase().includes(search))
    );
  }, [projectTeam, assigneeSearch, taskFilters.assignees]);

  // Dynamic options based on tasks
  const availableGroups = useMemo(() => Array.from(new Set(projectTasks.map(t => t.group).filter(Boolean))) as string[], [projectTasks]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 px-3 gap-1.5 bg-transparent shrink-0 text-sm font-medium rounded-md border-border',
            activeFiltersCount > 0 && 'border-primary'
          )}
        >
          <Filter className="size-4" />
          Filter & Sort
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">{activeFiltersCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <h4 className="font-semibold text-sm">Filter & Sort</h4>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-6" onClick={resetSorting} title="Reset Sort">
              <ArrowUpAZ className="size-3.5" />
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={clearFilters} title="Clear Filters">
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-6">

            {/* Sorting Section */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort By</h5>
              <div className="flex gap-2">
                <Select value={taskSort.field} onValueChange={(val: any) => setTaskSort(prev => ({ ...prev, field: val }))}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue placeholder="Sort field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="key">Key</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="progress">% Complete</SelectItem>
                    <SelectItem value="startDate">Start Date</SelectItem>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="storyPoints">Story Points</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setTaskSort(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                >
                  {taskSort.direction === 'asc' ? <ArrowUpAZ className="size-4" /> : <ArrowDownZA className="size-4" />}
                </Button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="space-y-4">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filters</h5>

              {/* Assignee Filter */}
              {projectTeam && projectTeam.members.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Assignees</Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTaskFilters(prev => ({ ...prev, assignees: projectTeam.members.map(m => m.id) }))}
                        className="text-[10px] font-medium text-primary hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskFilters(prev => ({ ...prev, assignees: [] }))}
                        className="text-[10px] font-medium text-muted-foreground hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search assignees..."
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      className="h-7 pl-7 text-xs bg-muted/40"
                    />
                  </div>

                  <div className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredMembers.length === 0 && !assigneeSearch.trim() ? null : filteredMembers.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2 text-center">No assignees found.</div>
                    ) : (
                      filteredMembers.map((member) => (
                        <label key={member.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-muted/50 rounded-md cursor-pointer transition-colors group">
                          <div className="flex items-center gap-2 min-w-0">
                            <UserAvatar user={member} size="sm" className="size-6 shrink-0" />
                            <span className="text-sm truncate font-medium">{member.name}</span>
                          </div>
                          <Checkbox
                            checked={(taskFilters.assignees || []).includes(member.id)}
                            onCheckedChange={() => toggleArrayFilter('assignees', member.id)}
                            className="shrink-0 data-[state=unchecked]:opacity-0 data-[state=unchecked]:group-hover:opacity-100 transition-opacity"
                          />
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Status</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {workflowStatuses.filter(s => s.projectId === projectId).map((status) => (
                    <label key={status.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={(taskFilters.statuses || []).includes(status.id)}
                        onCheckedChange={() => toggleArrayFilter('statuses', status.id)}
                      />
                      <span className="text-sm capitalize truncate">{status.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Priority</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['critical', 'high', 'medium', 'low'].map((priority) => (
                    <label key={priority} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={(taskFilters.priorities || []).includes(priority)}
                        onCheckedChange={() => toggleArrayFilter('priorities', priority)}
                      />
                      <span className="text-sm capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['epic', 'story', 'task', 'subtask', 'bug'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={(taskFilters.types || []).includes(type)}
                        onCheckedChange={() => toggleArrayFilter('types', type)}
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Attributes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Attributes</Label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={taskFilters.isMilestone === true}
                    onCheckedChange={(checked) => setTaskFilters(prev => ({ ...prev, isMilestone: checked ? true : undefined }))}
                  />
                  <span className="text-sm">Milestone Only</span>
                </label>
              </div>

              {/* Date Filters */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Dates</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Start After</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={taskFilters.startDateAfter || ''}
                      onChange={e => setTaskFilters(prev => ({ ...prev, startDateAfter: e.target.value || undefined }))}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Due Before</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={taskFilters.endDateBefore || ''}
                      onChange={e => setTaskFilters(prev => ({ ...prev, endDateBefore: e.target.value || undefined }))}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-card space-y-3">
          {(activeFiltersCount > 0 || taskSort.field !== 'title' || taskSort.direction !== 'asc') && !activeCustomFilterId && (
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Filter name..."
                value={customFilterName}
                onChange={(e) => setCustomFilterName(e.target.value)}
                className="h-8 text-xs"
              />
              <Button size="sm" variant="secondary" className="h-8 shrink-0 text-xs" onClick={handleSaveCustomFilter} disabled={!customFilterName.trim() || isSaving}>
                Save as Custom Filter
              </Button>
            </div>
          )}
          {activeCustomFilterId && (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-muted/50 rounded-md border border-border/50">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active</span>
                <span className="text-xs font-medium truncate">{customFilters.find(f => f.id === activeCustomFilterId)?.name}</span>
              </div>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs hover:bg-background shrink-0" onClick={handleUpdateCustomFilter} disabled={isSaving}>
                Update
              </Button>
            </div>
          )}
          <Button className="w-full" size="sm" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
