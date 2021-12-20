import React from "react"
import { Link } from "react-router-dom"
import FlipMove from "react-flip-move"
import Timer from "./Timer"
import { shuffle } from "lodash"
import { sendResults, getResults } from "./comms"
import styles from './threeCardMonte.module.css'

const ANSWER_SCORE = 1

/**
 * Component representing a card used in game. Uses React.forwardRef 
 * required by react-flip-move for animation
 * 
 * @param {{cardValue: boolean, phaseNumber: number, correctAnswerAction: Function, wrongAnswerAction: Function}} props cardValue - true or false, phaseNumber - game phase number, correctAnswerAction - function to run if cardValue === true, wrongAnswerAction - function to run if cardValue === false
 */
const Card = React.forwardRef(({ cardValue, phaseNumber, correctAnswerAction, wrongAnswerAction }, ref) => (
	<button
		className={styles.card}
		ref={ref}
		onClick={phaseNumber === 2 ? () => {
			if (cardValue) correctAnswerAction(ANSWER_SCORE)
			else wrongAnswerAction(ANSWER_SCORE)
		} : null}>
			{phaseNumber === 1 || phaseNumber === 2 ? '?' : cardValue ? '✔' : '❌'}
	</button>
))

/**
 * Component used as a grid of buttons representing cards
 * 
 * @param {{cards: {id: number, status: boolean}[], phaseNumber: number, correctAnswerAction: Function, wrongAnswerAction: Function}} props cards - array of objects representing cards with id and status, phaseNumber - game phase number, correctAnswerAction - function to run if card.status === true passed to cards, wrongAnswerAction - function to run if card.status === false passed to cards
 * @returns 
 */
const Cards = ({ cards, phaseNumber, correctAnswerAction, wrongAnswerAction }) => {
	const renderCards = () =>  cards.map((card) => <Card key={card.id} cardValue={card.status} phaseNumber={phaseNumber} correctAnswerAction={correctAnswerAction} wrongAnswerAction={wrongAnswerAction} />)
	return (
		<div id={styles.cards} style={{ gridTemplateColumns: `repeat(${cards.length}, ${100/cards.length}%` }}>
			<FlipMove
				duration={750}
				delay={0}
				easing={"cubic-bezier(1, 0, 0, 1)"}
				staggerDurationBy={0}
				staggerDelayBy={0}
				typeName={null}
			>
				{renderCards()}
			</FlipMove>
		</div>
	)
}

/**
 * Component representing the ThreeCardMonte game
 */
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
			phaseNumber: 0,
			score: 0,
			wrongAnswers: 0,
			cardsNumber: 3,
			numberOfRounds: 10,
			currentRound: 0,
			shuffleNumber: 5,
			cards: [],
			highScore: ''
		}
	}
	/**
	 * Asynchronously retrieves game results for current user and 
	 * sets this.state.highScore to the best value
	 */
	async componentDidMount() {
		try {
			const results = await getResults({ eMail: this.profile.email, gameID: 4 })
			const highScore = results.sort((a, b) => (a.Result3 <= b.Result3) ? 1 : -1)[0].Result3
			this.setState({ highScore: highScore + '%'})
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
			currentRound: 0,
		})
		this.nextRound()
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
		sendResults(this.profile.email, 4, { Setting1: this.state.cardsNumber, Setting2: this.state.numberOfRounds, Setting3: this.state.shuffleNumber }, { Result1: this.state.score, Result2: this.state.wrongAnswers, Result3: ((this.state.score / (this.state.score + this.state.wrongAnswers)) * 100).toFixed(2) })
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
	 * Generates a new game round by randomly selecting the correct card 
	 * and moving to phase 0. If the previous round was the last one, 
	 * then ends the game instead
	 */
	nextRound = () => {
		if (this.state.currentRound < this.state.numberOfRounds) {
			let correctCardId = Math.floor(Math.random() * this.state.cardsNumber)
			let cards = []
			for (let i = 0; i < this.state.cardsNumber; ++i) {
				let card = {
					id: i,
					status: false,
				}
				cards.push(card)
			}
			cards[correctCardId].status = true
			this.setState((state) => ({
				cards: cards,
				currentRound: state.currentRound + 1,
				phaseNumber: 0
			}))
		} else this.endGame()
	}
	/**
	 * Adds points for a correct answer and moves to phase 3
	 * 
	 * @param {number} points number of points to be awarded
	 */
	correctAnswer = (points) => {
		this.setState((state) => ({ score: state.score + points, phaseNumber: 3 }))
	}
	/**
	 * Adds points for a wrong answer and moves to phase 3
	 * 
	 * @param {number} points number of points to be added to wrong answers
	 */
	wrongAnswer = (points) => {
		this.setState((state) => ({ wrongAnswers: state.wrongAnswers + points, phaseNumber: 3 }))
	}
	/**
	 * Shuffles cards using shuffle function from lodash
	 * Utilises a version of Fisher-Yates algorithm
	 */
	shuffleCards = () => {
		this.setState((state) => ({ cards: shuffle(this.state.cards) }))
	}
	/**
	 * Moves to phase 1, then shuffles cards with a 1000ms animation
	 * Then moves to phase 2
	 */
	handleShuffling = () => {
		this.setState({ phaseNumber: 1 });
		const timer = ms => new Promise(res => setTimeout(res, ms));
		(async () => {
			for (let i = 0; i < this.state.shuffleNumber; ++i) {
				this.shuffleCards()
				await timer(1000)
			}
		})().then(() => {this.setState({ phaseNumber: 2 })})
	}
	/**
	 * Renders the game
	 * @returns JSX.Element representing the game field
	 */
	render() {
		return <>
			<Link to='/'>Powrót</Link>
			<div className={styles.game}>
				{!this.state.playing && !this.state.finished && !this.state.countdown && (
					<div className={styles.welcome}>
						<h1>Trzy karty</h1>
						<h3>Zalogowany jako: {this.profile.name} ({this.profile.email})</h3>
						<h3>Najlepszy wynik: {this.state.highScore}</h3>
						<div className={styles.instructions}>
							<h3 style={{textAlign: "center"}}>INSTRUKCJA</h3>
							Zapamiętaj pozycję karty z symbolem ✔. Następnie po kliknięciu przycisku "Tasuj karty" obserwuj przemieszczanie się kart.
							Gdy karty się zatrzymają, wybierz właściwą kartę. Na koniec kliknij przycisk "Nowa runda".
						</div>
						Liczba kart: <input value={this.state.cardsNumber} onChange={e => this.setState({ cardsNumber: e.target.value })} /><br />
						Liczba rund: <input value={this.state.numberOfRounds} onChange={e => this.setState({ numberOfRounds: e.target.value })} /><br />
						Liczba tasowań: <input value={this.state.shuffleNumber} onChange={e => this.setState({ shuffleNumber: e.target.value })}/><br />
						<button id={styles.startButton} onClick={Number.isInteger(parseFloat(this.state.cardsNumber)) && Number.isInteger(parseFloat(this.state.numberOfRounds)) && Number.isInteger(parseFloat(this.state.shuffleNumber)) ? this.getReady : null}>Start</button>
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
						<Cards cards={this.state.cards} phaseNumber={this.state.phaseNumber} correctAnswerAction={this.correctAnswer} wrongAnswerAction={this.wrongAnswer} />
					</>
				)}
				{this.state.playing && this.state.phaseNumber === 0 && (
					<button onClick={this.handleShuffling}>Tasuj karty</button>
				)}
				{this.state.playing && this.state.phaseNumber === 3 && (
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