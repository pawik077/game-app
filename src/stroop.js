import React from "react"
import { Link } from "react-router-dom"
import Timer from "./Timer"
import { sendResults, getResults } from "./comms"
import styles from './stroop.module.css'
import { shuffle } from "lodash"

const BUTTON_NUMBER = 5
const ANSWER_SCORE = 1
/**
 * Array of available colors
 */
const COLORS = ['green', 'blue', 'red', 'orange', 'yellow', 'black', 'purple', 'saddlebrown']
/**
 * List of names of available colors
 */
const COLOR_STRINGS = {
	'green': 'Zielony',
	'blue': 'Niebieski',
	'red': 'Czerwony',
	'orange': 'Pomarańczowy',
	'yellow': 'Żółty',
	'black': 'Czarny',
	'purple': 'Fioletowy',
	'saddlebrown': 'Brązowy',
}

/**
 * Color button component, used for choosing color answer
 * 
 * @param {{color: string, isCorrect: boolean, correctAnswerAction: Function, wrongAnswerAction: Function}} props color - css argument determining the color of the button, isCorrect - boolean representing button status, correctAnswerAction - function to run if isCorrect, wrongAnswerAction - function to run if !isCorrect 
 * @returns JSX.Element representing a color button
 */
const ColorButton = ({ color, isCorrect, correctAnswerAction, wrongAnswerAction }) =>
	<button
		className={styles.colorButton} style={{ backgroundColor: color }}
		onClick={() => {
			if (isCorrect) correctAnswerAction(ANSWER_SCORE)
			else wrongAnswerAction(ANSWER_SCORE)
		}}
	/>

/**
 * Component used as a grid of buttons representing a choice of colors
 * during the game
 * 
 * @param {{colors: string[], currentColor: string, correctAnswerAction: Function, wrongAnswerAction: Function}} props colors - string array representing colors of buttons, currentColor - color representing correct color, correctAnswerAction - function to run if currentColor === color passed to buttons, wrongAnswerAction - function to run if currentColor !== color passed to buttons
 * @returns JSX.Element representing a grid of buttons
 */
const ColorButtons = ({ colors, currentColor, correctAnswerAction, wrongAnswerAction }) =>
	<div id={styles.colorButtonsGrid}>
		{new Array(BUTTON_NUMBER).fill().map((_, id) =>
			<ColorButton key={id} color={colors[id]} isCorrect={colors[id] === currentColor} correctAnswerAction={correctAnswerAction} wrongAnswerAction={wrongAnswerAction} />)}
	</div>

/**
 * Component representing the StroopEffectTest game
 */
class Stroop extends React.Component {
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
			currentColor: 'green',
			currentColorText: 'black',
			choiceColors: [],
			score: 0,
			wrongAnswers: 0,
			gameTime: '30',
			highScore: '',
		}
	}
	/**
	 * Asynchronously retrieves game results for current user and 
	 * sets this.state.highScore to the best value
	 */
	async componentDidMount() {
		try {
			const results = await getResults({ eMail: this.profile.email, gameID: 3 })
			const highScore = results.sort((a, b) => (a.Result3 >= b.Result3) ? 1 : -1)[0].Result3
			this.setState({ highScore: highScore + 'ms'})
		} catch (error) {
			this.setState({ highScore: 'N/A' })
		}
	}
	/**
	 * Sets state to playing state and generates first round
	 */
	startGame = () => {
		this.setState({
			playing: true,
			finished: false,
			countdown: false,
			score: 0,
			wrongAnswers: 0,
		})
		this.generateRound()
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
		sendResults(this.profile.email, 3, { Setting1: this.state.gameTime }, { Result1: this.state.score, Result2: this.state.wrongAnswers, Result3: (parseFloat(this.state.gameTime) * 1000 / this.state.score).toFixed(2) })
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
	 * Generates a new game round by randomly selecting text color,
	 * randomly selecting a color name (different from the first one),
	 * then adding next random colors to an array, which is then shuffled and
	 * used for creating color buttons
	 */
	generateRound = () => {
		let currentColor = COLORS[Math.floor(Math.random() * COLORS.length)]
		let currentColorText
		let choiceColors = []
		do currentColorText = COLORS[Math.floor(Math.random() * COLORS.length)]
		while (currentColorText === currentColor)
		choiceColors[0] = currentColor
		choiceColors[1] = currentColorText
		for (let i = 2; i < BUTTON_NUMBER; ++i) {
			let color
			do color = COLORS[Math.floor(Math.random() * COLORS.length)]
			while (choiceColors.includes(color))
			choiceColors[i] = color
		}
		shuffle(choiceColors)
		this.setState({
			currentColor: currentColor,
			currentColorText: currentColorText,
			choiceColors: choiceColors
		})
	}
	/**
	 * Adds points for a correct answer and generates a new round
	 * 
	 * @param {number} points number of points to be awarded
	 */
	correctAnswer = (points) => {
		this.setState((state) => ({ score: state.score + points }))
		this.generateRound()
	}
	/**
	 * Adds points for a wrong answer
	 * 
	 * @param {number} points number of points to be added to wrong answers
	 */
	wrongAnswer = (points) => {
		this.setState((state) => ({ wrongAnswers: state.wrongAnswers + points }))
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
						<h1>Badanie efektu Stroopa</h1>
						<h3>Zalogowany jako: {this.profile.name} ({this.profile.email})</h3>
						<h3>Najlepszy wynik: { this.state.highScore }</h3>
						Czas gry: <input value={this.state.gameTime} onChange={e => this.setState({ gameTime: e.target.value })} /><br />
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
						<div>{`Prawidłowe odpowiedzi: ${this.state.score}`}</div>
						<div>{`Błędne odpowiedzi: ${this.state.wrongAnswers}`}</div>
						<button id={styles.endButton} onClick={this.backToStart}>End</button>
						<div id={styles.gameField}>
							<div id={styles.colorText} style={{ color: this.state.currentColor }}>{COLOR_STRINGS[this.state.currentColorText]}</div>
							<ColorButtons colors={this.state.choiceColors} currentColor={this.state.currentColor} correctAnswerAction={this.correctAnswer} wrongAnswerAction={this.wrongAnswer} />
						</div>
					</>
				)}
				{this.state.finished && (
					<div className={styles.endGame}>
						<div>{`Prawidłowe odpowiedzi: ${this.state.score}`}</div>
						<div>{`Błędne odpowiedzi: ${this.state.wrongAnswers}`}</div>
						<p>Średni czas odpowiedzi: {(parseFloat(this.state.gameTime) * 1000 / this.state.score).toFixed(2)}ms</p>
						<button onClick={this.startGame}>Zagraj ponownie</button><br/>
						<button onClick={this.backToStart}>Wróć na start</button>
					</div>
				)}

			</div>
		</>
	}
}
export default Stroop