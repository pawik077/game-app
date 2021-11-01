import React from "react";
import ProgressBar from "@ramonak/react-progress-bar"
import { Link } from "react-router-dom";
import './circleGame.css'

const CIRCLE_SCORE = 1
const CIRCLE_NUMBER = 20

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
	//return <span>{`Time: ${internalTime}`}</span>
	return (
		<div id='progressBar'>
			<span id='timer'>{`Pozostały czas: ${(internalTime / 1000).toFixed(1)}s`}</span>
			<ProgressBar completed={internalTime / time * 100} isLabelVisible={false} transitionDuration='0.1s' transitionTimingFunction='linear' />
		</div>
	)
}

const Circle = ({ tap, isActive }) =>
	<button
		className={`circle ${isActive ? 'activeCircle' : 'inactiveCircle'}`}
		onClick={() => { if (isActive) tap(CIRCLE_SCORE) }}
	/>

const Circles = ({ tap, activeId }) =>
	<div id='circles'>
		{new Array(CIRCLE_NUMBER).fill().map((_, id) =>
			<Circle key={id} tap={tap} isActive={id === activeId} />)}
	</div>

const Score = ({ value }) => <div>{`Score: ${value}`}</div>

const CircleGame = () => {
	const authInstance = window.gapi.auth2.getAuthInstance()
	const user = authInstance.currentUser.get()
	const userProfile = user.getBasicProfile()
	const profile = {
		id: userProfile.getId(),
		name: userProfile.getName(),
		image: userProfile.getImageUrl(),
		email: userProfile.getEmail(),
		token: user.getAuthResponse().id_token
	}
	const [playing, setPlaying] = React.useState(false)
	const [finished, setFinished] = React.useState(false)
	const [score, setScore] = React.useState(0)
	const [activeCircleId, setActiveCircleId] = React.useState(0)
	const [gameTime, setGameTime] = React.useState('')
	const startGame = () => {
		setFinished(false)
		setPlaying(true)
		setScore(0)
		setActiveCircleId(Math.floor(Math.random() * CIRCLE_NUMBER))
	}
	const endGame = () => {
		setPlaying(false)
		setFinished(true)
	}
	const tap = (points) => {
		setScore(score + points)
		let rn
		do rn = Math.floor(Math.random() * CIRCLE_NUMBER)
		while (rn === activeCircleId)
		setActiveCircleId(rn)
	}
	return (
		<>
			<Link to='/'>Powrót</Link>
			<div className='game'>
				{!playing && !finished && (
					<div className='welcome'>
						<h1>Polowanie na przedmioty</h1>
						<h3>Zalogowany jako: {profile.name}</h3>
						<h3>Najlepszy wynik: </h3>
						Czas gry: <input value={gameTime} onChange={e => setGameTime(e.target.value)} />
						<button id='startButton' onClick={ Number.isInteger(parseFloat(gameTime)) ? startGame : null }>Start</button>
					</div>
				)}
				{playing && (
					<>
						<button onClick={endGame}>End</button>
						<Timer time={parseFloat(gameTime) * 1000} onEnd={endGame} />
						<Score value={score}/>
						<Circles tap={tap} activeId={activeCircleId}/>
					</>
				)}
				{finished && (
					<div className='endGame'>
						<Score value={score} />
						<p>Średni czas uderzenia: {(parseFloat(gameTime) * 1000 / score).toFixed(2)}ms</p>
						<button onClick={startGame}>Zagraj ponownie</button>
					</div>
				)}
			</div>
		</>
	)
}
export default CircleGame