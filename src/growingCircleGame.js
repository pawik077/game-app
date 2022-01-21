import React from "react"
import { Link } from "react-router-dom"
import Timer from "./Timer"
import { sendResults, getResults } from "./comms"
import styles from './growingCircleGame.module.css'

const CIRCLE_SCORE = 1
const CIRCLE_NUMBER = 20

/**
 * Circle component, used as a visual representation of the object
 * to be found during the game
 */
class Circle extends React.Component {
	/**
	 * Initialises the component's state, retrieves component's props
	 * 
	 * @param {{tap: Function, isActive: boolean, color: string, growTime: number}} props tap - function to run if clicked on active circle, isActive - boolean representing active circle status, color - css argument determining the color of the circle, growTime - time in which the circle grows from 0 to 100% (in seconds)
	 */
	constructor(props) {
		super(props)
		this.state = {
			size: 0,
			time: 0
		}
	}
	/**
	 * Starts timer used for growing circles, sets new circle size every 10ms
	 */
	startTimer = () => {
		this.setState({ size: 0, time: 0 }) //initialising timer
		this.interval = setInterval(() => {
			if (this.props.isActive) {
				this.setState(state => ({ time: state.time + 10 })) //incrementing timer every interval
				const newSize = this.state.time / (this.props.growTime * 10) //calculates new percentage size of element ((currentTime[ms])/(growTime[s] * 1000)[ms]) * 100%))
				this.setState({ size: newSize <= 100 ? newSize : 100 }) //stops increasing size over 100%
			}
		}, 10);
	}
	/**
	 * Stops current timer, starts a new timer for another circle, runs tap function
	 */
	click = () => {
		clearInterval(this.interval)
		this.startTimer()
		this.props.tap(CIRCLE_SCORE)
	}
	/**
	 * Starts initial timer
	 */
	componentDidMount() {
		this.startTimer()
	}
	/**
	 * Clears timer on component unmount (prevents errors and memory leaks)
	 */
	componentWillUnmount() {
		clearInterval(this.interval)
	}
	/**
	 * 
	 * @returns JSX.Element representing a circular button of variable size
	 */
	render() {
		return <button
			className={styles.circle} id={this.props.isActive ? styles.activeCircle : null} style={{ background: this.props.color, width: `${this.state.size}%`, height: `${this.state.size}%` }}
			onClick={() => { if (this.props.isActive) this.click() }}
		/>
	}
}
/**
 * Component used as a grid of available objects, which randomly
 * activate during the game and start growing
 * 
 * @param {{tap: Function, activeId: number, activeColor: string, growTime: number}} props tap - onClick function passed to circles, activeId - ID of active circle, activeColor - css argument determining the color of the active circle, growTime - time in which circle grows from 0 to 100% (in seconds), passed down to circles
 * @returns JSX.Element representing a grid of circles
 */

const Circles = ({ tap, activeId, activeColor, growTime }) =>
	<div id={styles.circles}>
		{new Array(CIRCLE_NUMBER).fill().map((_, id) =>
			<Circle key={id} tap={tap} isActive={id === activeId} color={activeColor} growTime={growTime}/>)}
	</div>

const Score = ({ value }) => <div>{`Score: ${value}`}</div>

/**
 * Component representing the GrowingItemHunt game
 */
class GrowingCircleGame extends React.Component {
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
	 * Initialises thee component's state
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
			growTime: '2',
			color: 'linear-gradient(to bottom right, #00e600, #008000)',
			highScore: ''
		}
	}
	/**
	 * Asynchronously retrieves game results for current user and 
	 * sets this.state.highScore to the best value
	 */
	async componentDidMount() {
		try {
			const results = await getResults({ eMail: this.profile.email, gameID: 2 })
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
		sendResults(this.profile.email, 2, { Setting1: this.state.gameTime, Setting2: colorFloat, Setting3: this.state.growTime }, { Result1: this.state.score, Result2: (parseFloat(this.state.gameTime) * 1000 / this.state.score).toFixed(2) })
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
						<h1>Polowanie na rosnące przedmioty</h1>
						<h3>Zalogowany jako: {this.profile.name} ({this.profile.email})</h3>
						<h3>Najlepszy wynik: {this.state.highScore}</h3>
						<div className={styles.instructions}>
							<h3 style={{textAlign: "center"}}>INSTRUKCJA</h3>
							Klikaj jak najszybciej na rosnące okrągłe obiekty zanim skończy się czas.
						</div>
						Czas gry: <input value={this.state.gameTime} onChange={e => this.setState({ gameTime: e.target.value })} /><br />
						Czas przyrostu obiektu: <input value={this.state.growTime} onChange={e => this.setState({ growTime: e.target.value })}/><br/>
						Kolor aktywnego obiektu: <select value={this.state.color} onChange={e => this.setState({ color: e.target.value })} >
							<option value='linear-gradient(to bottom right, #00e600, #008000)'>Zielony (gradient)</option>
							<option value='linear-gradient(to bottom right, #4d4dff, #0000ff)'>Niebieski (gradient)</option>
							<option value='linear-gradient(to bottom right, #e65c00, #ff8533)'>Pomarańczowy (gradient)</option>
							<option value='green'>Zielony</option>
							<option value='red'>Czerwony</option>
							<option value='blue'>Niebieski</option>
							<option value='yellow'>Żółty</option>
							<option value='magenta'>Magenta</option>
						</select>
						<button id={styles.startButton} onClick={Number.isInteger(parseFloat(this.state.gameTime)) && Number.isFinite(parseFloat(this.state.growTime)) ? this.getReady : null}>Start</button>
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
						<Circles tap={this.tap} activeId={this.state.activeCircleId} activeColor={this.state.color} growTime={this.state.growTime}/>
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
export default GrowingCircleGame