"use client";

import { useState, useEffect } from "react";
import { Task, TaskStatus } from "@/services/taskService";
import TaskItem from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  isSelected: (taskId: number) => boolean;
  onSelect: (taskId: number) => void;
}

const TaskList = ({ tasks, isSelected, onSelect }: TaskListProps) => {
  // Create a local state for tasks that we can directly manipulate
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Update local tasks when the props tasks change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Function to update a task's status optimistically
  const updateTaskStatus = (taskId: number, newStatus: TaskStatus) => {
    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  return (
    <div className="space-y-2">
      {localTasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          isSelected={isSelected(task.id)}
          onSelect={onSelect}
          updateTaskStatus={updateTaskStatus}
        />
      ))}
    </div>
  );
};

export default TaskList;
