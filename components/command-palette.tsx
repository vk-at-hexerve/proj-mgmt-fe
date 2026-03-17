'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Calendar,
  BarChart3,
  Layers,
  Target,
  Users,
  Plus,
  Search,
  Sparkles,
  Bug,
  BookOpen,
  Zap,
  Settings,
} from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const { searchOpen, setSearchOpen, openModal, tasks, projects, setAiCopilotOpen, isMounted } = useApp();
  const [search, setSearch] = useState('');


  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [searchOpen, setSearchOpen]);

  const filteredTasks = useMemo(() => {
    if (!search) return tasks.slice(0, 5);
    return tasks
      .filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.key.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 8);
  }, [tasks, search]);

  const filteredProjects = useMemo(() => {
    if (!search) return projects.slice(0, 3);
    return projects
      .filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.key.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 5);
  }, [projects, search]);

  const runCommand = (command: () => void) => {
    setSearchOpen(false);
    command();
  };

  const typeIcons = {
    epic: <Zap className="size-4 text-primary" />,
    story: <BookOpen className="size-4 text-accent" />,
    task: <ListTodo className="size-4 text-muted-foreground" />,
    subtask: <ListTodo className="size-3 text-muted-foreground" />,
    bug: <Bug className="size-4 text-destructive" />,
  };

  if (!isMounted) return null;

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput 
        placeholder="Search tasks, projects, or type a command..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => openModal('create-task'))}>
            <Plus className="mr-2 size-4" />
            <span>Create New Task</span>
            <Badge variant="secondary" className="ml-auto text-xs">Ctrl+N</Badge>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => openModal('create-project'))}>
            <FolderKanban className="mr-2 size-4" />
            <span>Create New Project</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setAiCopilotOpen(true))}>
            <Sparkles className="mr-2 size-4" />
            <span>Open AI Copilot</span>
            <Badge variant="secondary" className="ml-auto text-xs">Ctrl+J</Badge>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
            <LayoutDashboard className="mr-2 size-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/projects'))}>
            <FolderKanban className="mr-2 size-4" />
            <span>Projects</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/tasks'))}>
            <ListTodo className="mr-2 size-4" />
            <span>My Tasks</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/calendar'))}>
            <Calendar className="mr-2 size-4" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/reports'))}>
            <BarChart3 className="mr-2 size-4" />
            <span>Reports</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/portfolios'))}>
            <Layers className="mr-2 size-4" />
            <span>Portfolios</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/programs'))}>
            <Target className="mr-2 size-4" />
            <span>Programs</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/teams'))}>
            <Users className="mr-2 size-4" />
            <span>Teams</span>
          </CommandItem>
        </CommandGroup>

        {/* Tasks */}
        {filteredTasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {filteredTasks.map((task) => (
                <CommandItem 
                  key={task.id}
                  onSelect={() => runCommand(() => openModal('task-detail', { taskId: task.id }))}
                >
                  {typeIcons[task.type]}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{task.key}</span>
                  <span className="ml-2 truncate">{task.title}</span>
                  {task.assignee && (
                    <Avatar className="ml-auto size-5">
                      <AvatarImage src={task.assignee.avatar || '/placeholder.svg'} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Projects */}
        {filteredProjects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {filteredProjects.map((project) => (
                <CommandItem 
                  key={project.id}
                  onSelect={() => runCommand(() => router.push(`/projects?project=${project.id}`))}
                >
                  <FolderKanban className="mr-2 size-4" />
                  <Badge variant="outline" className="font-mono text-xs mr-2">{project.key}</Badge>
                  <span className="truncate">{project.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{project.progress}%</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
