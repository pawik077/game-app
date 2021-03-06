import React from "react"
import ProgressBar from "@ramonak/react-progress-bar"
import styles from './Timer.module.css'

/**
 * Timer component, reused in several games
 * 
 * @param {{time: number, interval: number, onEnd: Function}} props time - number of milliseconds to run, interval - timer tick, onEnd - function to run when timer ends
 * @returns JSX.Element representing a timer with a progress bar
 */
const Timer = ({ time, interval = 100, onEnd }) => {
	const [internalTime, setInternalTime] = React.useState(time)
	const timerRef = React.useRef(time)
	const timeRef = React.useRef(time)
	React.useEffect(() => {
		if (internalTime === 0 && onEnd) onEnd()
	}, [internalTime, onEnd])
	React.useEffect(() => {
		timerRef.current = setInterval(() => setInternalTime(timeRef.current -= interval), interval)
		return () => clearInterval(timerRef.current)
	}, [interval])
	return (
		<div id={styles.progressBar}>
			<span id={styles.timer}>{`Pozostały czas: ${(internalTime / 1000).toFixed(1)}s`}</span>
			<ProgressBar completed={internalTime / time * 100} isLabelVisible={false} transitionDuration='0.1s' transitionTimingFunction='linear' />
		</div>
	)
}

export default Timer