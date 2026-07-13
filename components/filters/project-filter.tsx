'use client';

import React from 'react';
import { useApp } from '@/lib/app-context';
import { TaskFilterPanel } from './task-filter-panel';

interface ProjectFilterProps {
  projectId: string;
}

export function ProjectFilter({ projectId }: ProjectFilterProps) {
  const {
    taskFilters, setTaskFilters,
    taskSort, setTaskSort,
    customFilters, activeCustomFilterId, applyCustomFilter
  } = useApp();

  return (
    <TaskFilterPanel
      projectId={projectId}
      filters={taskFilters}
      setFilters={setTaskFilters}
      sort={taskSort}
      setSort={setTaskSort}
      customFilters={customFilters}
      activeCustomFilterId={activeCustomFilterId}
      onApplyCustomFilter={applyCustomFilter}
    />
  );
}
