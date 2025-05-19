import React from 'react';
import { TaskFormState } from './TaskFormUtils';
import {
  TitleField,
  DescriptionField,
  DateField,
  StatusField,
  PriorityField,
  EnergyLevelField,
  CategoryField,
  TimeEstimateField,
  RecurringTaskField,
  FormActions,
} from './fields';

interface TaskCategory {
  id: number;
  name: string;
}

interface DetailedTaskFormProps {
  isLongTerm: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  formState: TaskFormState;
  setFormState: (state: Partial<TaskFormState>) => void;
  taskCategories: TaskCategory[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxTimeMinutes: number;
  maxTimeDays: number;
}

const DetailedTaskForm: React.FC<DetailedTaskFormProps> = ({
  isLongTerm,
  isEditing,
  isSubmitting,
  formState,
  setFormState,
  taskCategories,
  onSubmit,
  onCancel,
  maxTitleLength,
  maxDescriptionLength,
  maxTimeMinutes,
  maxTimeDays,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Title */}
      <TitleField
        title={formState.title}
        setTitle={(title) => setFormState({ title })}
        maxLength={maxTitleLength}
      />

      {/* Description */}
      <DescriptionField
        description={formState.description}
        setDescription={(description) => setFormState({ description })}
        maxLength={maxDescriptionLength}
      />

      {/* Two columns for smaller fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Due Date */}
        <DateField
          dueDate={formState.dueDate}
          setDueDate={(dueDate) => setFormState({ dueDate })}
        />

        {/* Status */}
        <StatusField
          status={formState.status}
          setStatus={(status) => setFormState({ status })}
        />

        {/* Priority */}
        <PriorityField
          priority={formState.priority}
          setPriority={(priority) => setFormState({ priority })}
        />

        {/* Energy Level */}
        <EnergyLevelField
          energyLevel={formState.energyLevel}
          setEnergyLevel={(energyLevel) => setFormState({ energyLevel })}
        />

        {/* Category */}
        <CategoryField
          categoryId={formState.categoryId}
          setCategoryId={(categoryId) => setFormState({ categoryId })}
          taskCategories={taskCategories}
        />

        {/* Estimated Time */}
        <TimeEstimateField
          isLongTerm={isLongTerm}
          estimatedTimeMinutes={formState.estimatedTimeMinutes}
          setEstimatedTimeMinutes={(estimatedTimeMinutes) =>
            setFormState({ estimatedTimeMinutes })
          }
          estimatedTimeDays={formState.estimatedTimeDays}
          setEstimatedTimeDays={(estimatedTimeDays) =>
            setFormState({ estimatedTimeDays })
          }
          maxTimeMinutes={maxTimeMinutes}
          maxTimeDays={maxTimeDays}
        />
      </div>

      {/* Recurring Task */}
      <RecurringTaskField
        isRecurring={formState.isRecurring}
        setIsRecurring={(isRecurring) => setFormState({ isRecurring })}
        recurringFrequency={formState.recurringFrequency}
        setRecurringFrequency={(recurringFrequency) =>
          setFormState({ recurringFrequency })
        }
      />

      {/* Form actions */}
      <FormActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        isEditing={isEditing}
      />
    </form>
  );
};

export default DetailedTaskForm;
