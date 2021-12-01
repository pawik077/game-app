import React from "react"
import { Link } from "react-router-dom"
import Timer from "./Timer"
import { sendResults, getResults } from "./comms"
import styles from './stroop.module.css'

const BUTTON_NUMBER = 5
const ANSWER_SCORE = 1
const COLORS = ['green', 'blue', 'red', 'orange', 'yellow', 'black', 'purple', 'saddlebrown']
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

/* Randomize array in-place using Durstenfeld shuffle algorithm */
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
    }
}

const ColorButton = ({ color, isCorrect, correctAnswerAction, wrongAnswerAction }) =>
	<button
		className={styles.colorButton} style={{ backgroundColor: color }}
		onClick={() => {
			if (isCorrect) correctAnswerAction(ANSWER_SCORE)
			else wrongAnswerAction(ANSWER_SCORE)
		}}
	/>

const ColorButtons = ({ colors, currentColor, correctAnswerAction, wrongAnswerAction }) =>
	<div id={styles.colorButtonsGrid}>
		{new Array(BUTTON_NUMBER).fill().map((_, id) =>
			<ColorButton key={id} color={colors[id]} isCorrect={colors[id] === currentColor} correctAnswerAction={correctAnswerAction} wrongAnswerAction={wrongAnswerAction} />)}
	</div>

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
	async componentDidMount() {
		try {
			const results = await getResults({ eMail: this.profile.email, gameID: 3 })
			const highScore = results.sort((a, b) => (a.Result3 >= b.Result3) ? 1 : -1)[0].Result3
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
			wrongAnswers: 0,
		})
		this.generateRound()
	}
	endGame = () => {
		this.setState({
			playing: false,
			countdown: false,
			finished: true
		})
		sendResults(this.profile.email, 3, { Setting1: this.state.gameTime }, { Result1: this.state.score, Result2: this.state.wrongAnswers, Result3: (parseFloat(this.state.gameTime) * 1000 / this.state.score).toFixed(2) })
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
	correctAnswer = (points) => {
		this.setState((state) => ({ score: state.score + points }))
		this.generateRound()
	}
	wrongAnswer = (points) => {
		this.setState((state) => ({ wrongAnswers: state.wrongAnswers + points }))
	}
	render() {
		return <>
			<Link to='/'>Powrót</Link>
			<div className={styles.game}>
				{!this.state.playing && !this.state.finished && !this.state.countdown && (
					<div className={styles.welcome}>
						<h1>Badanie efektu Stroopa</h1>
						<h3>Zalogowany jako: {this.profile.name} ({this.profile.email})</h3>
						<h3>Najlepszy wynik: { this.state.highScore }</h3>
						Czas gry: <input value={this.state.gameTime} onChange={e => this.setState({ gameTime: e.target.value })/*setGameTime(e.target.value)*/} /><br />
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