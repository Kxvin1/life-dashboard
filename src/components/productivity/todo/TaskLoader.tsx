"use client";

import { useEffect } from "react";
import { useTask } from "@/contexts/TaskContext";

/**
 * Component that loads task data when mounted
 * This is used to explicitly load tasks only on pages that need them
 */
const TaskLoader = () => {
  const { fetchAllTasks } = useTask();

  // Load tasks when the component mounts
  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  // This component doesn't render anything
  return null;
};

export default TaskLoader;
