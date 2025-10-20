import type React from "react";
import { useEffect, useState } from "react";
import { InclineIcon, PlayIcon, SpeedIcon, StopIcon } from "./Icons";

interface ManualControlsProps {
	onSetSpeed: (speed: number) => void;
	onSetIncline: (incline: number) => void;
	onStart: () => void;
	onStop: () => void;
	disabled: boolean;
}

export const ManualControls: React.FC<ManualControlsProps> = ({
	onSetSpeed,
	onSetIncline,
	onStart,
	onStop,
	disabled,
}) => {
	const [speed, setSpeed] = useState(5.0);
	const [incline, setIncline] = useState(1.0);
	const [isStarted, setIsStarted] = useState(false);

	// When the main `disabled` prop changes (e.g., workout starts, or disconnect), reset the manual started state.
	useEffect(() => {
		if (disabled) {
			setIsStarted(false);
		}
	}, [disabled]);

	const handleStart = () => {
		if (disabled) return;
		onStart();
		// Set initial speed and incline when starting
		onSetSpeed(speed);
		onSetIncline(incline);
		setIsStarted(true);
	};

	const handleStop = () => {
		if (disabled) return;
		onStop();
		setIsStarted(false);
	};

	const handleSpeedChange = (delta: number) => {
		const newSpeed = Math.max(0, Math.round((speed + delta) * 10) / 10);
		setSpeed(newSpeed);
		onSetSpeed(newSpeed);
	};

	const handleInclineChange = (delta: number) => {
		const newIncline = Math.max(0, Math.round((incline + delta) * 10) / 10);
		setIncline(newIncline);
		onSetIncline(newIncline);
	};

	const buttonClass =
		"px-4 py-2 bg-gray-700 rounded-md font-bold text-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed";
	const controlsDisabled = disabled || !isStarted;

	return (
		<div className="space-y-4 pt-4 border-t border-gray-700">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-semibold text-gray-300">Manual Control</h3>
				{!isStarted ? (
					<button
						type="button"
						onClick={handleStart}
						disabled={disabled}
						className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
					>
						<PlayIcon className="w-5 h-5 mr-2" />
						Start
					</button>
				) : (
					<button
						type="button"
						onClick={handleStop}
						disabled={disabled}
						className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
					>
						<StopIcon className="w-5 h-5 mr-2" />
						Stop
					</button>
				)}
			</div>
			<div
				className={`p-4 rounded-lg space-y-3 ${disabled ? "opacity-50" : ""}`}
			>
				{/* Speed Controls */}
				<div className="flex items-center justify-between">
					<label htmlFor="speed" className="font-medium flex items-center">
						<SpeedIcon className="w-5 h-5 mr-2 text-cyan-400" /> Speed
					</label>
					<div className="flex items-center space-x-2">
						<button
							type="button"
							onClick={() => handleSpeedChange(-0.1)}
							disabled={controlsDisabled}
							className={buttonClass}
						>
							-
						</button>
						<span className="w-20 text-center font-mono text-xl">
							{speed.toFixed(1)}
						</span>
						<button
							type="button"
							onClick={() => handleSpeedChange(0.1)}
							disabled={controlsDisabled}
							className={buttonClass}
						>
							+
						</button>
					</div>
				</div>
				{/* Incline Controls */}
				<div className="flex items-center justify-between">
					<label htmlFor="incline" className="font-medium flex items-center">
						<InclineIcon className="w-5 h-5 mr-2 text-green-400" /> Incline
					</label>
					<div className="flex items-center space-x-2">
						<button
							type="button"
							onClick={() => handleInclineChange(-0.5)}
							disabled={controlsDisabled}
							className={buttonClass}
						>
							-
						</button>
						<span className="w-20 text-center font-mono text-xl">
							{incline.toFixed(1)}
						</span>
						<button
							type="button"
							onClick={() => handleInclineChange(0.5)}
							disabled={controlsDisabled}
							className={buttonClass}
						>
							+
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
