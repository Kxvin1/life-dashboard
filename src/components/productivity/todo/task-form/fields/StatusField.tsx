import React from 'react';
import { TaskStatus } from '@/services/taskService';

interface StatusFieldProps {
  status: TaskStatus;
  setStatus: (status: TaskStatus) => void;
}

const StatusField: React.FC<StatusFieldProps> = ({
  status,
  setStatus,
}) => {
  return (
    <div>
      <label
        htmlFor="status"
        className="block mb-1 text-sm font-medium text-foreground"
      >
        Status
      </label>
      <select
        id="status"
        value={status}
        onChange={(e) => setStatus(e.target.value as TaskStatus)}
        className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
      >
        <option value={TaskStatus.NOT_STARTED}>Not Started</option>
        <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
        <option value={TaskStatus.COMPLETED}>Completed</option>
      </select>
    </div>
  );
};

export default StatusField;
