import React from "react"
import { Link } from "react-router-dom"
import Timer from "./Timer"
import { sendResults, getResults } from "./comms"
import styles from './threeCardMonte.module.css'

const ANSWER_SCORE = 1

const Card = ({  isCorrect, roundOn, correctAnswerAction, wrongAnswerAction }) =>
	<button
		className={styles.card}
		onClick={roundOn ? () => {
			if (isCorrect) correctAnswerAction(ANSWER_SCORE)
			else wrongAnswerAction(ANSWER_SCORE)
		} : null}>
			{roundOn ? '?' : isCorrect ? '✔' : '❌'}
	</button>

const Cards = ({ correctId, cardsNumber, roundOn, correctAnswerAction, wrongAnswerAction}) =>
	<div id={styles.cards} style={{ gridTemplateColumns: `repeat(${cardsNumber}, 10vw)`}}>
		{new Array(cardsNumber).fill().map((_, id) =>
			<Card key={id} isCorrect={id === correctId} roundOn={roundOn} correctAnswerAction={correctAnswerAction} wrongAnswerAction={wrongAnswerAction} />)}
	</div>

class ThreeCardMonte extends React.Component {
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
			roundOn: true,
			score: 0,
			wrongAnswers: 0,
			correctCardId: 0,
			cardsNumber: 3,
			numberOfRounds: 10,
			currentRound: 0,
			// highScore: ''
		}
	}
	// async componentDidMount() {
	// 	try {
	// 		const results = await getResults({ eMail: this.profile.email, gameID: 4 })
	// 		const highScore = results.sort((a, b) => (a.Result2 >= b.Result2) ? 1 : -1)[0].Result2
	// 		this.setState({ highScore: highScore + 'ms'})
	// 	} catch (error) {
	// 		this.setState({ highScore: error.toString() })
	// 	}
	// }
	startGame = () => {
		this.setState({
			playing: true,
			finished: false,
			countdown: false,
			score: 0,
			wrongAnswers: 0,
			currentRound: 0,
		})
		this.nextRound()
	}
	endGame = () => {
		this.setState({
			playing: false,
			countdown: false,
			finished: true
		})
		// sendResults(this.profile.email, 4, { Setting1: this.state.gameTime }, { Result1: this.state.score, Result2: this.state.wrongAnswers, Result3: (parseFloat(this.state.gameTime) * 1000 / this.state.score).toFixed(2) })
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
	nextRound = () => {
		if (this.state.currentRound < this.state.numberOfRounds) {
			let correctCardId = Math.floor(Math.random() * this.state.cardsNumber)
			this.setState((state) => ({
				correctCardId: correctCardId,
				roundOn: true,
				currentRound: state.currentRound + 1
			}))
		} else this.endGame()
	}
	correctAnswer = (points) => {
		this.setState((state) => ({ score: state.score + points, roundOn: false }))
	}
	wrongAnswer = (points) => {
		this.setState((state) => ({ wrongAnswers: state.wrongAnswers + points, roundOn: false }))
	}
	render() {
		return <>
			<Link to='/'>Powrót</Link>
			<div className={styles.game}>
				{!this.state.playing && !this.state.finished && !this.state.countdown && (
					<div className={styles.welcome}>
						<h1>Trzy karty</h1>
						<h3>Zalogowany jako: {this.profile.name} ({this.profile.email})</h3>
						{/* <h3>Najlepszy wynik: { this.state.highScore }</h3>
						Czas gry: <input value={this.state.gameTime} onChange={e => this.setState({ gameTime: e.target.value })} /><br /> */}
						Liczba kart: <input value={this.state.cardsNumber} onChange={e => this.setState({ cardsNumber: e.target.value })} /><br />
						Liczba rund: <input value={this.state.numberOfRounds} onChange={e => this.setState({ numberOfRounds: e.target.value })} /><br />
						<button id={styles.startButton} onClick={/*Number.isInteger(parseFloat(this.state.gameTime)) ? this.getReady : null*/ this.getReady}>Start</button>
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
						<div>{`Prawidłowe odpowiedzi: ${this.state.score}`}</div>
						<div>{`Błędne odpowiedzi: ${this.state.wrongAnswers}`}</div>
						<div>{`Runda ${this.state.currentRound}/${this.state.numberOfRounds}`}</div>
						<button id={styles.endButton} onClick={this.backToStart}>End</button><br/>
						<Cards cardsNumber={parseInt(this.state.cardsNumber)} roundOn={this.state.roundOn} correctId={this.state.correctCardId} correctAnswerAction={this.correctAnswer} wrongAnswerAction={this.wrongAnswer} />
					</>
				)}
				{this.state.playing && !this.state.roundOn && (
					<button onClick={this.nextRound}>{this.state.currentRound === this.state.numberOfRounds ? 'Koniec' : 'Nowa runda'}</button>
				)}
				{this.state.finished && (
					<div className={styles.endGame}>
						<div>{`Prawidłowe odpowiedzi: ${this.state.score}`}</div>
						<div>{`Błędne odpowiedzi: ${this.state.wrongAnswers}`}</div>
						<p>Wynik procentowy: {(this.state.score * 100 / (this.state.score + this.state.wrongAnswers)).toFixed(2)}%</p>
						<button onClick={this.startGame}>Zagraj ponownie</button><br/>
						<button onClick={this.backToStart}>Wróć na start</button>
					</div>
				)}

			</div>
		</>
	}
}
export default ThreeCardMonte