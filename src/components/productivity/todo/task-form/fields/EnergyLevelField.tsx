import React from 'react';
import { EnergyLevel } from '@/services/taskService';

interface EnergyLevelFieldProps {
  energyLevel: EnergyLevel | undefined;
  setEnergyLevel: (energyLevel: EnergyLevel | undefined) => void;
}

const EnergyLevelField: React.FC<EnergyLevelFieldProps> = ({
  energyLevel,
  setEnergyLevel,
}) => {
  return (
    <div>
      <label
        htmlFor="energyLevel"
        className="block mb-1 text-sm font-medium text-foreground"
      >
        Energy Level
      </label>
      <select
        id="energyLevel"
        value={energyLevel || ""}
        onChange={(e) =>
          setEnergyLevel(
            e.target.value ? (e.target.value as EnergyLevel) : undefined
          )
        }
        className="w-full px-3 py-2 border rounded-md bg-background border-border text-foreground"
      >
        <option value="">Not Specified</option>
        <option value={EnergyLevel.LOW}>Low</option>
        <option value={EnergyLevel.MEDIUM}>Medium</option>
        <option value={EnergyLevel.HIGH}>High</option>
      </select>
    </div>
  );
};

export default EnergyLevelField;
