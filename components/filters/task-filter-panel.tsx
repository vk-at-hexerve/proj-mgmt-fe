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
import { Filter, X, ArrowUpAZ, ArrowDownZA, Search, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskFilters, TaskSort, CustomFilter } from '@/lib/types';

export interface TaskFilterPanelProps {
  filters: TaskFilters;
  setFilters: React.Dispatch<React.SetStateAction<TaskFilters>>;
  sort: TaskSort;
  setSort: React.Dispatch<React.SetStateAction<TaskSort>>;
  projectId?: string;
  customFilters?: CustomFilter[];
  activeCustomFilterId?: string | null;
  onApplyCustomFilter?: (filter: CustomFilter | null) => void;
  onApply?: () => void;
}

export function TaskFilterPanel({
  filters,
  setFilters,
  sort,
  setSort,
  projectId,
  customFilters = [],
  activeCustomFilterId = null,
  onApplyCustomFilter,
  onApply
}: TaskFilterPanelProps) {
  const { workflowStatuses, teams, tasks, users, showToast } = useApp();

  const [open, setOpen] = React.useState(false);
  const [assigneeSearch, setAssigneeSearch] = React.useState('');

  // Compute active filters count
  const activeFiltersCount =
    (filters.assignees?.length || 0) +
    (filters.priorities?.length || 0) +
    (filters.types?.length || 0) +
    (filters.statuses?.length || 0) +
    (filters.isMilestone !== undefined && filters.isMilestone !== null ? 1 : 0) +
    (filters.startDateAfter ? 1 : 0) +
    (filters.endDateBefore ? 1 : 0);

  const clearFilters = () => {
    if (onApplyCustomFilter && activeCustomFilterId) {
      onApplyCustomFilter(null);
    } else {
      setFilters({});
    }
  };

  const resetSorting = () => {
    setSort({ field: 'title', direction: 'asc' });
  };

  const toggleArrayFilter = (field: keyof TaskFilters, value: string) => {
    setFilters((prev) => {
      const current = (prev[field] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleApply = () => {
    setOpen(false);
    if (onApply) onApply();
    else showToast({ title: 'Filters applied', description: `${activeFiltersCount} filter(s) active`, type: 'success' });
  };

  // Extract available data
  const projectTasks = useMemo(() => projectId ? tasks.filter(t => t.projectId === projectId) : tasks, [tasks, projectId]);
  const relevantTeamMembers = useMemo(() => {
    if (projectId) {
      const team = teams.find(t => t.projects.some(p => p.id === projectId)) || teams[0];
      return team ? team.members : [];
    }
    return users; // all users if no project specified
  }, [teams, users, projectId]);

  const filteredMembers = useMemo(() => {
    const search = assigneeSearch.trim().toLowerCase();
    if (!search) {
      const selected = filters.assignees || [];
      return relevantTeamMembers.filter(m => selected.includes(m.id));
    }
    return relevantTeamMembers.filter(m =>
      m.name.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search) ||
      ((m as any).username && (m as any).username.toLowerCase().includes(search))
    );
  }, [relevantTeamMembers, assigneeSearch, filters.assignees]);

  const relevantStatuses = useMemo(() => {
    if (projectId) {
      return workflowStatuses.filter(s => s.projectId === projectId);
    }
    // Return all unique status names if no project specified (cross-project filtering)
    const unique = new Map();
    workflowStatuses.forEach(s => {
      if (!unique.has(s.id)) unique.set(s.id, s);
    });
    return Array.from(unique.values());
  }, [workflowStatuses, projectId]);

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

            {/* Custom Filters (My Filters) Section */}
            {customFilters.length > 0 && onApplyCustomFilter && (
              <div className="space-y-3">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Bookmark className="size-3" />
                  My Filters
                </h5>
                <Select 
                  value={activeCustomFilterId || 'none'} 
                  onValueChange={(val) => {
                    if (val === 'none') onApplyCustomFilter(null);
                    else {
                      const f = customFilters.find(x => x.id === val);
                      if (f) onApplyCustomFilter(f);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-full bg-muted/30">
                    <SelectValue placeholder="Select a saved filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Custom)</SelectItem>
                    {customFilters.map(cf => (
                      <SelectItem key={cf.id} value={cf.id}>{cf.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sorting Section */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort By</h5>
              <div className="flex gap-2">
                <Select value={sort.field} onValueChange={(val: any) => setSort(prev => ({ ...prev, field: val }))}>
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
                  onClick={() => setSort(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                >
                  {sort.direction === 'asc' ? <ArrowUpAZ className="size-4" /> : <ArrowDownZA className="size-4" />}
                </Button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="space-y-4">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filters</h5>

              {/* Assignee Filter */}
              {relevantTeamMembers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Assignees</Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, assignees: relevantTeamMembers.map(m => m.id) }))}
                        className="text-[10px] font-medium text-primary hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, assignees: [] }))}
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
                            checked={(filters.assignees || []).includes(member.id)}
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
                  {relevantStatuses.map((status) => (
                    <label key={status.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={(filters.statuses || []).includes(status.id)}
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
                        checked={(filters.priorities || []).includes(priority)}
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
                        checked={(filters.types || []).includes(type)}
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
                    checked={filters.isMilestone === true}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isMilestone: checked ? true : undefined }))}
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
                      value={filters.startDateAfter || ''}
                      onChange={e => setFilters(prev => ({ ...prev, startDateAfter: e.target.value || undefined }))}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Due Before</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={filters.endDateBefore || ''}
                      onChange={e => setFilters(prev => ({ ...prev, endDateBefore: e.target.value || undefined }))}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-card space-y-3">
          <Button className="w-full" size="sm" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
