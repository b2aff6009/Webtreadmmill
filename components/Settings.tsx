import type React from "react";
import { useId } from "react";

interface SettingsProps {
	thresholdPace: string;
	onThresholdPaceChange: (pace: string) => void;
	thresholdHr: number;
	onThresholdHrChange: (hr: number) => void;
}

// Friel LTHR Zones as a common standard
const heartRateZones = [
	{ name: "Zone 1", lower: 0, upper: 0.85, color: "bg-blue-500/20" },
	{ name: "Zone 2", lower: 0.85, upper: 0.89, color: "bg-green-500/20" },
	{ name: "Zone 3", lower: 0.9, upper: 0.94, color: "bg-yellow-500/20" },
	{ name: "Zone 4", lower: 0.95, upper: 0.99, color: "bg-orange-500/20" },
	{ name: "Zone 5", lower: 1.0, upper: 1.06, color: "bg-red-500/20" },
];

export const Settings: React.FC<SettingsProps> = ({
	thresholdPace,
	onThresholdPaceChange,
	thresholdHr,
	onThresholdHrChange,
}) => {
	return (
		<div className="space-y-6 text-gray-300">
			<div>
				<h3 className="text-lg font-semibold text-gray-100">
					Workout Settings
				</h3>
				<p className="text-sm text-gray-400 mt-1">
					These values can be used to customize workout calculations and
					displays.
				</p>
			</div>
			<div className="space-y-4">
				<div>
					<label
						htmlFor="threshold-pace"
						className="block text-sm font-medium mb-1"
					>
						Threshold Pace
					</label>
					<div className="flex items-center">
						<input
							type="text"
							id={useId()}
							value={thresholdPace}
							onChange={(e) => onThresholdPaceChange(e.target.value)}
							className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
							placeholder="e.g., 4:30"
						/>
						<span className="ml-2 text-gray-400 text-sm">min/km</span>
					</div>
				</div>
				<div>
					<label
						htmlFor="threshold-hr"
						className="block text-sm font-medium mb-1"
					>
						Threshold Heart Rate
					</label>
					<div className="flex items-center">
						<input
							type="number"
							id={useId()}
							value={thresholdHr}
							onChange={(e) =>
								onThresholdHrChange(parseInt(e.target.value, 10) || 0)
							}
							className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
						/>
						<span className="ml-2 text-gray-400 text-sm">bpm</span>
					</div>
				</div>
			</div>

			<div className="pt-4 border-t border-gray-700">
				<h3 className="text-lg font-semibold text-gray-100">
					Heart Rate Zones
				</h3>
				<p className="text-sm text-gray-400 mt-1 mb-4">
					Calculated based on your Threshold Heart Rate (LTHR).
				</p>
				<div className="space-y-2">
					{heartRateZones.map((zone) => {
						const lowerBpm = Math.round(thresholdHr * zone.lower);
						const upperBpm = Math.round(thresholdHr * zone.upper);
						return (
							<div
								key={zone.name}
								className={`flex justify-between items-center p-2 rounded-md ${zone.color}`}
							>
								<span className="font-semibold text-sm">{zone.name}</span>
								<span className="font-mono text-sm">
									{zone.name === "Zone 5"
										? `${lowerBpm}+ bpm`
										: `${lowerBpm} - ${upperBpm} bpm`}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
