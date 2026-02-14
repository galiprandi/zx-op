import { TimeFormatter } from "@/components/TimeFormatter";

// Example usage of TimeFormatter component
export function TimerExamples() {
	return (
		<div className="space-4 p-4">
			<h2 className="text-xl font-bold mb-4">TimeFormatter Examples</h2>
			
			{/* Countdown timer (desc) */}
			<div className="border p-4 rounded">
				<h3 className="font-semibold mb-2">Countdown (desc state):</h3>
				<TimeFormatter seconds={120} state="desc">
					{({ formatted, minutes, seconds, isExpired }) => (
						<div className="font-mono text-lg">
							{formatted} ({minutes}m {seconds}s)
							{isExpired && <span className="text-red-500 ml-2">EXPIRED!</span>}
						</div>
					)}
				</TimeFormatter>
			</div>

			{/* Count up timer (asc) */}
			<div className="border p-4 rounded">
				<h3 className="font-semibold mb-2">Count Up (asc state):</h3>
				<TimeFormatter seconds={0} state="asc">
					{({ formatted, minutes, seconds }) => (
						<div className="font-mono text-lg">
							{formatted} ({minutes}m {seconds}s)
						</div>
					)}
				</TimeFormatter>
			</div>

			{/* Static timer (stop) */}
			<div className="border p-4 rounded">
				<h3 className="font-semibold mb-2">Static (stop state):</h3>
				<TimeFormatter seconds={300} state="stop">
					{({ formatted, minutes, seconds }) => (
						<div className="font-mono text-lg">
							{formatted} ({minutes}m {seconds}s)
						</div>
					)}
				</TimeFormatter>
			</div>

			{/* Custom display example */}
			<div className="border p-4 rounded">
				<h3 className="font-semibold mb-2">Custom Display:</h3>
				<TimeFormatter seconds={90} state="desc">
					{({ formatted, isExpired }) => (
						<div className="text-center">
							<div className={`text-4xl font-bold ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
								{formatted}
							</div>
							<div className="text-sm text-gray-600">
								{isExpired ? 'Time\'s up!' : 'Time remaining'}
							</div>
						</div>
					)}
				</TimeFormatter>
			</div>
		</div>
	);
}
