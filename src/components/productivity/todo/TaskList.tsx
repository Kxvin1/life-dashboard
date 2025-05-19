"use client";

import { useState, useEffect } from "react";
import { Task, reorderTask as apiReorderTask } from "@/services/taskService";
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

  // Handle moving a task up in the list
  const handleMoveTaskUp = async (taskId: number, currentIndex: number) => {
    if (currentIndex <= 0) return; // Already at the top

    try {
      // Update the local state immediately for responsive UI
      const newTasks = [...localTasks];
      const task = newTasks[currentIndex];
      newTasks.splice(currentIndex, 1);
      newTasks.splice(currentIndex - 1, 0, task);
      setLocalTasks(newTasks);

      // Call the API to persist the change
      await apiReorderTask(taskId, currentIndex - 1);
    } catch (error) {
      console.error("Error moving task up:", error);
      // Revert the local state if the API call fails
      setLocalTasks(tasks);
    }
  };

  // Handle moving a task down in the list
  const handleMoveTaskDown = async (taskId: number, currentIndex: number) => {
    if (currentIndex >= localTasks.length - 1) return; // Already at the bottom

    try {
      // Update the local state immediately for responsive UI
      const newTasks = [...localTasks];
      const task = newTasks[currentIndex];
      newTasks.splice(currentIndex, 1);
      newTasks.splice(currentIndex + 1, 0, task);
      setLocalTasks(newTasks);

      // Call the API to persist the change
      await apiReorderTask(taskId, currentIndex + 1);
    } catch (error) {
      console.error("Error moving task down:", error);
      // Revert the local state if the API call fails
      setLocalTasks(tasks);
    }
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
          onMoveUp={handleMoveTaskUp}
          onMoveDown={handleMoveTaskDown}
        />
      ))}
    </div>
  );
};

export default TaskList;
