import React from "react";
import ProgressBar from "@ramonak/react-progress-bar"
import { Link } from "react-router-dom";
import styles from './circleGame.module.css'
import axios from "axios";
const backend = 'http://localhost:4000'

const CIRCLE_SCORE = 1
const CIRCLE_NUMBER = 20

const sendResults = (eMail, gameID, gameSettings, gameResults) => {
	const payload = {
		eMail: eMail,
		gameID: gameID,
		gameSettings: gameSettings,
		gameResults: gameResults
	}
	try {
		axios.post(`${backend}/results`, payload)	
	} catch (error) {
		console.log(error)
	}
}

const getResults = async (options) => {
	if (!options) options = {
		eMail: '',
		gameID: ''
	}
	try {
		const results = await axios.get(`${backend}/results?eMail=${options.eMail || ''}&gameID=${options.gameID || ''}`)
		return results.data
	} catch (error) {
		throw error
	}
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
		<div id={styles.progressBar}>
			<span id={styles.timer}>{`Pozostały czas: ${(internalTime / 1000).toFixed(1)}s`}</span>
			<ProgressBar completed={internalTime / time * 100} isLabelVisible={false} transitionDuration='0.1s' transitionTimingFunction='linear' />
		</div>
	)
}

const Circle = ({ tap, isActive, color }) =>
	<button
		className={styles.circle} style={{ backgroundColor: color}}
		onClick={() => { if (isActive) tap(CIRCLE_SCORE) }}
	/>

const Circles = ({ tap, activeId, activeColor }) =>
	<div id={styles.circles}>
		{new Array(CIRCLE_NUMBER).fill().map((_, id) =>
			<Circle key={id} tap={tap} isActive={id === activeId} color={id === activeId ? activeColor : 'black'} />)}
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
	constructor(props) {
		super(props)
		this.state = {
			playing: false,
			finished: false,
			countdown: false,
			score: 0,
			activeCircleId: 0,
			gameTime: '',
			color: 'green',
			highScore: ''
		}
	}
	async componentDidMount() {
		try {
			const results = await getResults({ eMail: this.profile.email, gameID: 1 })
			const highScore = results.sort((a, b) => (a.Result2 >= b.Result2) ? 1 : -1)[0].Result2
			this.setState({ highScore: highScore + 'ms'})
		} catch (error) {
			this.setState({ highScore: error.toString() })
		}
	}
	startGame = () => {
		this.setState({
			playing: true,
			finished: false,
			countdown: false,
			score: 0,
			activeCircleId: Math.floor(Math.random() * CIRCLE_NUMBER)
		})
	}
	endGame = () => {
		this.setState({
			playing: false,
			countdown: false,
			finished: true
		})
		sendResults(this.profile.email, 1, { Setting1: this.state.gameTime }, { Result1: this.state.score, Result2: (parseFloat(this.state.gameTime) * 1000 / this.state.score).toFixed(2) })
	}
	backToStart = () => {
		this.setState({
			playing: false,
			countdown: false,
			finished:false
		})
	}
	getReady = () => {
		this.setState({
			playing: false,
			countdown: true,
			finished: false
		})
	}
	tap = (points) => {
		this.setState((state) => ({ score: state.score + points }))
		let rn
		do rn = Math.floor(Math.random() * CIRCLE_NUMBER)
		while (rn === this.state.activeCircleId)
		this.setState({ activeCircleId: rn })
	}
	render() {
		return <>
			<Link to='/'>Powrót</Link>
			<div className={styles.game}>
				{!this.state.playing && !this.state.finished && !this.state.countdown && (
					<div className={styles.welcome}>
						<h1>Polowanie na przedmioty</h1>
						<h3>Zalogowany jako: {this.profile.name} ({this.profile.email})</h3>
						<h3>Najlepszy wynik: { this.state.highScore }</h3>
						Czas gry: <input value={this.state.gameTime} onChange={e => this.setState({ gameTime: e.target.value })/*setGameTime(e.target.value)*/} /><br/>
						Kolor aktywnego obiektu: <select value={this.state.color} onChange={e => this.setState({ color: e.target.value })} >
							<option value='green'>Zielony</option>
							<option value='red'>Czerwony</option>
							<option value='blue'>Niebieski</option>
							<option value='yellow'>Żółty</option>
							<option value='magenta'>Magenta</option>
						</select>
						<button id={styles.startButton} onClick={Number.isInteger(parseFloat(this.state.gameTime)) ? this.getReady : null}>Start</button>
					</div>
				)}
				{this.state.countdown && (
					<div className={styles.countdown}>
						<h2>Przygotuj się</h2>
						<Timer time={3000} onEnd={this.startGame}/>
					</div>
				)}
				{this.state.playing && (
					<>
						<Timer time={parseFloat(this.state.gameTime) * 1000} onEnd={this.endGame} />
						<Score value={this.state.score} />
						<button id={styles.endButton} onClick={this.backToStart}>End</button>
						<Circles tap={this.tap} activeId={this.state.activeCircleId} activeColor={this.state.color}/>
					</>
				)}
				{this.state.finished && (
					<div className={styles.endGame}>
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