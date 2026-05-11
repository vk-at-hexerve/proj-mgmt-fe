'use client';

import { useParams } from 'next/navigation';
import TaskDetailClient from './task-detail-client';

export default function TaskPage() {
  const params = useParams();
  const id = params.id as string;

  return <TaskDetailClient taskId={id} />;
}
