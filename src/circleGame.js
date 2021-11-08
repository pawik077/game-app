import React from "react";
import ProgressBar from "@ramonak/react-progress-bar"
import { Link } from "react-router-dom";
import './circleGame.css'
const backend = 'http://localhost:4000'

const CIRCLE_SCORE = 1
const CIRCLE_NUMBER = 20

const sendResults = (eMail, gameID, gameSettings, gameResults) => {
	let xhr = new XMLHttpRequest()
	const payload = {
		eMail: eMail,
		gameID: gameID,
		gameSettings: gameSettings,
		gameResults: gameResults
	}
	xhr.open('POST', `${backend}/results`)
	xhr.onload = () => {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				console.log(xhr.responseText)
			} else {
				console.error(xhr.statusText)
			}
		}
	}
	xhr.onerror = () => console.error(xhr.statusText)
	xhr.setRequestHeader('Content-Type', 'application/json')
	xhr.send(JSON.stringify(payload))
}

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

class CircleGame extends React.Component {
	authInstance = window.gapi.auth2.getAuthInstance()
	user = this.authInstance.currentUser.get()
	userProfile = this.user.getBasicProfile()
	profile = {
		id: this.userProfile.getId(),
		name: this.userProfile.getName(),
		image: this.userProfile.getImageUrl(),
		email: this.userProfile.getEmail(),
		token: this.user.getAuthResponse().id_token
	}
	// const [playing, setPlaying] = React.useState(false)
	// const [finished, setFinished] = React.useState(false)
	// const [score, setScore] = React.useState(0)
	// const [activeCircleId, setActiveCircleId] = React.useState(0)
	// const [gameTime, setGameTime] = React.useState('')
	constructor(props) {
		super(props)
		this.state = {
			playing: false,
			finished: false,
			score: 0,
			activeCircleId: 0,
			gameTime: ''
		}
	}
	startGame = () => {
		// setFinished(false)
		// setPlaying(true)
		// setScore(0)
		// setActiveCircleId(Math.floor(Math.random() * CIRCLE_NUMBER))
		this.setState({
			playing: true,
			finished: false,
			score: 0,
			activeCircleId: Math.floor(Math.random() * CIRCLE_NUMBER)
		})
	}
	endGame = () => {
		// setPlaying(false)
		// setFinished(true)
		this.setState({
			playing: false,
			finished: true
		})
		sendResults(this.profile.email, 1, { Setting1: this.state.gameTime }, { Result1: this.state.score, Result2: (parseFloat(this.state.gameTime) * 1000 / this.state.score).toFixed(2) })
	}
	backToStart = () => {
		// setPlaying(false)
		// setFinished(false)
		this.setState({
			playing: false,
			finished:false
		})
	}
	tap = (points) => {
		// setScore(score + points)
		this.setState((state) => ({ score: state.score + points }))
		let rn
		do rn = Math.floor(Math.random() * CIRCLE_NUMBER)
		while (rn === this.state.activeCircleId)
		// setActiveCircleId(rn)
		this.setState({ activeCircleId: rn })
	}
	render() {
		return <>
			<Link to='/'>Powrót</Link>
			<div className='game'>
				{!this.state.playing && !this.state.finished && (
					<div className='welcome'>
						<h1>Polowanie na przedmioty</h1>
						<h3>Zalogowany jako: {this.profile.name} ({this.profile.email})</h3>
						<h3>Najlepszy wynik: </h3>
						Czas gry: <input value={this.state.gameTime} onChange={e => this.setState({ gameTime: e.target.value })/*setGameTime(e.target.value)*/} />
						<button id='startButton' onClick={Number.isInteger(parseFloat(this.state.gameTime)) ? this.startGame : null}>Start</button>
					</div>
				)}
				{this.state.playing && (
					<>
						<button onClick={this.backToStart}>End</button>
						<Timer time={parseFloat(this.state.gameTime) * 1000} onEnd={this.endGame} />
						<Score value={this.state.score} />
						<Circles tap={this.tap} activeId={this.state.activeCircleId} />
					</>
				)}
				{this.state.finished && (
					<div className='endGame'>
						<Score value={this.state.score} />
						<p>Średni czas uderzenia: {(parseFloat(this.state.gameTime) * 1000 / this.state.score).toFixed(2)}ms</p>
						<button onClick={this.startGame}>Zagraj ponownie</button>
					</div>
				)}
			</div>
		</>
	}
}
export default CircleGame