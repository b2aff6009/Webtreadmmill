import type React from "react";
import { useState } from "react";
import { parseIcuFile } from "../lib/icuParser";
import type { Workout } from "../types";

interface WorkoutLibraryProps {
	onLoad: (workout: Workout) => void;
	settings: {
		thresholdPace: string;
		thresholdHr: number;
	};
}

const availableWorkouts = [
	{ file: "easy_recovery.txt", name: "Easy Recovery Run" },
	{ file: "pyramid_intervals.txt", name: "Pyramid Intervals" },
	{ file: "tempo_run.txt", name: "Tempo Run" },
];

export const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({
	onLoad,
	settings,
}) => {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<string | null>(null);

	const handleSelectWorkout = async (fileName: string) => {
		setLoading(fileName);
		setError(null);
		try {
			const response = await fetch(`/workouts/${fileName}`);
			if (!response.ok) {
				throw new Error(`Could not load workout file: ${response.statusText}`);
			}
			const fileContent = await response.text();
			const workout = parseIcuFile(fileContent, settings);
			onLoad(workout);
		} catch (err) {
			console.error("Failed to load library workout:", err);
			setError(err instanceof Error ? err.message : "Could not load workout.");
		} finally {
			setLoading(null);
		}
	};

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold text-gray-100">Workout Library</h3>
			<p className="text-sm text-gray-400">
				Select a predefined workout to get started.
			</p>
			<div className="space-y-3">
				{availableWorkouts.map((workout) => (
					<button
						type="button"
						key={workout.file}
						onClick={() => handleSelectWorkout(workout.file)}
						disabled={loading === workout.file}
						className="w-full text-left p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-wait"
					>
						<p className="font-semibold text-cyan-400">{workout.name}</p>
						<p className="text-xs text-gray-400">{workout.file}</p>
					</button>
				))}
			</div>
			{error && <p className="text-red-400 mt-2">{error}</p>}
		</div>
	);
};
