import React from "react"
import { Link } from "react-router-dom"
import Timer from "./Timer"
import { sendResults, getResults } from "./comms"
import styles from './circleGame.module.css'

const CIRCLE_SCORE = 1
const CIRCLE_NUMBER = 20

/**
 * Circle component, used as a visual representation of the object
 * to be found during the game
 * 
 * @param {{tap: Function, isActive: boolean, color: string}} props tap - function to run if clicked on active circle, isActive - boolean representing active circle status, color - css argument determining the color of the circle 
 * @returns JSX.Element representing a circular button
 */
const Circle = ({ tap, isActive, color }) =>
	<button
		className={styles.circle} id={isActive ? styles.activeCircle : null} style={{ background: color}}
		onClick={() => { if (isActive) tap(CIRCLE_SCORE) }}
	/>

/**
 * Component used as a grid of available objects, which randomly
 * activate during the game
 * 
 * @param {{tap: Function, activeId: number, activeColor: string}} props tap - onClick function passed to circles, activeId - ID of active circle, activeColor - css argument determining the color of the active circle
 * @returns JSX.Element representing a grid of circles
 */
const Circles = ({ tap, activeId, activeColor }) =>
	<div id={styles.circles}>
		{new Array(CIRCLE_NUMBER).fill().map((_, id) =>
			<Circle key={id} tap={tap} isActive={id === activeId} color={activeColor} />)}
	</div>

const Score = ({ value }) => <div>{`Score: ${value}`}</div>

/**
 * Component representing the ItemHunt game
 */
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
	/**
	 * Initialises the component's state
	 * 
	 * @param {Object} props 
	 */
	constructor(props) {
		super(props)
		this.state = {
			playing: false,
			finished: false,
			countdown: false,
			score: 0,
			activeCircleId: 0,
			gameTime: '30',
			color: 'linear-gradient(45deg, rgba(0,255,0,1) 20%, rgba(0,0,255,1) 80%)',
			highScore: ''
		}
	}
	/**
	 * Asynchronously retrieves game results for current user and 
	 * sets this.state.highScore to the best value
	 */
	async componentDidMount() {
		try {
			const results = await getResults({ eMail: this.profile.email, gameID: 1 })
			const highScore = results.sort((a, b) => (a.Result2 >= b.Result2) ? 1 : -1)[0].Result2
			this.setState({ highScore: highScore + 'ms'})
		} catch (error) {
			this.setState({ highScore: 'N/A' })
		}
	}
	/**
	 * Sets state to playing state and generates first activeCircle
	 */
	startGame = () => {
		this.setState({
			playing: true,
			finished: false,
			countdown: false,
			score: 0,
			activeCircleId: Math.floor(Math.random() * CIRCLE_NUMBER)
		})
	}
	/**
	 * Sets state to finished state, sends game results and settings to backend
	 */
	endGame = () => {
		this.setState({
			playing: false,
			countdown: false,
			finished: true
		})
		let colorFloat
		switch (this.state.color) {
			case 'green':
				colorFloat = 0
				break
			case 'red':
				colorFloat = 1
				break
			case 'blue':
				colorFloat = 2
				break
			case 'yellow':
				colorFloat = 3
				break
			case 'magenta':
				colorFloat = 4
				break
			default:
				colorFloat = -1
				break
		}
		sendResults(this.profile.email, 1, { Setting1: this.state.gameTime, Setting2: colorFloat }, { Result1: this.state.score, Result2: (parseFloat(this.state.gameTime) * 1000 / this.state.score).toFixed(2) })
	}
	/**
	 * Resets state to starting state
	 */
	backToStart = () => {
		this.setState({
			playing: false,
			countdown: false,
			finished:false
		})
	}
	/**
	 * Sets state to countdown state
	 */
	getReady = () => {
		this.setState({
			playing: false,
			countdown: true,
			finished: false
		})
	}
	/**
	 * Adds points for a correct click and generates a new activeCircle
	 * 
	 * @param {number} points number of points to be awarded
	 */
	tap = (points) => {
		this.setState((state) => ({ score: state.score + points }))
		let rn
		do rn = Math.floor(Math.random() * CIRCLE_NUMBER)
		while (rn === this.state.activeCircleId)
		this.setState({ activeCircleId: rn })
	}
	/**
	 * Renders the game
	 * 
	 * @returns JSX.Element representing the game field
	 */
	render() {
		return <>
			<Link to='/'>Powrót</Link>
			<div className={styles.game}>
				{!this.state.playing && !this.state.finished && !this.state.countdown && (
					<div className={styles.welcome}>
						<h1>Polowanie na przedmioty</h1>
						<h3>Zalogowany jako: {this.profile.name} ({this.profile.email})</h3>
						<h3>Najlepszy wynik: {this.state.highScore}</h3>
						<div className={styles.instructions}>
							<h3 style={{textAlign: "center"}}>INSTRUKCJA</h3>
							Klikaj jak najszybciej na pojawiające się okrągłe obiekty zanim skończy się czas.
						</div>
						Czas gry: <input value={this.state.gameTime} onChange={e => this.setState({ gameTime: e.target.value })} /><br/>
						Kolor aktywnego obiektu: <select value={this.state.color} onChange={e => this.setState({ color: e.target.value })} >
							<option value='linear-gradient(45deg, rgba(0,255,0,1) 20%, rgba(0,0,255,1) 80%)'>Gradient</option>
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
						<button onClick={this.startGame}>Zagraj ponownie</button><br/>
						<button onClick={this.backToStart}>Wróć na start</button>
					</div>
				)}
			</div>
		</>
	}
}
export default CircleGame