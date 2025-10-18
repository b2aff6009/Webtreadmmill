
import React, { useCallback, useState } from 'react';
import type { Workout } from '../types';
import { parseZwoFile } from '../lib/zwoParser';
import { UploadIcon } from './Icons';

interface WorkoutImporterProps {
  onLoad: (workout: Workout) => void;
}

export const WorkoutImporter: React.FC<WorkoutImporterProps> = ({ onLoad }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const fileContent = await file.text();
        const workout = parseZwoFile(fileContent);
        onLoad(workout);
      } catch (err) {
        console.error("Failed to parse .zwo file:", err);
        setError(err instanceof Error ? err.message : "Invalid .zwo file format.");
      }
    }
  }, [onLoad]);

  return (
    <div className="text-center p-4 border-2 border-dashed border-gray-600 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-200 mb-2">Import Workout</h2>
      <p className="text-gray-400 mb-4">Select a `.zwo` file to begin.</p>
      <label
        htmlFor="file-upload"
        className="cursor-pointer inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition"
      >
        <UploadIcon className="w-5 h-5 mr-2" />
        <span>Choose File</span>
      </label>
      <input id="file-upload" type="file" accept=".zwo" className="hidden" onChange={handleFileChange} />
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};
   