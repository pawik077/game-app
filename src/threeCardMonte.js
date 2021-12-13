import React from "react"
import { Link } from "react-router-dom"
import FlipMove from "react-flip-move"
import Timer from "./Timer"
import { shuffle } from "lodash"
import { sendResults, getResults } from "./comms"
import styles from './threeCardMonte.module.css'

const ANSWER_SCORE = 1

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
	async componentDidMount() {
		try {
			const results = await getResults({ eMail: this.profile.email, gameID: 4 })
			const highScore = results.sort((a, b) => (a.Result3 <= b.Result3) ? 1 : -1)[0].Result3
			this.setState({ highScore: highScore + '%'})
		} catch (error) {
			this.setState({ highScore: 'N/A' })
		}
	}
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
		sendResults(this.profile.email, 4, { Setting1: this.state.cardsNumber, Setting2: this.state.numberOfRounds, Setting3: this.state.shuffleNumber }, { Result1: this.state.score, Result2: this.state.wrongAnswers, Result3: ((this.state.score / (this.state.score + this.state.wrongAnswers)) * 100).toFixed(2) })
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
	correctAnswer = (points) => {
		this.setState((state) => ({ score: state.score + points, phaseNumber: 3 }))
	}
	wrongAnswer = (points) => {
		this.setState((state) => ({ wrongAnswers: state.wrongAnswers + points, phaseNumber: 3 }))
	}
	shuffleCards = () => {
		this.setState((state) => ({ cards: shuffle(this.state.cards) }))
	}
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
	render() {
		return <>
			<Link to='/'>Powrót</Link>
			<div className={styles.game}>
				{!this.state.playing && !this.state.finished && !this.state.countdown && (
					<div className={styles.welcome}>
						<h1>Trzy karty</h1>
						<h3>Zalogowany jako: {this.profile.name} ({this.profile.email})</h3>
						<h3>Najlepszy wynik: { this.state.highScore }</h3>
						Liczba kart: <input value={this.state.cardsNumber} onChange={e => this.setState({ cardsNumber: e.target.value })} /><br />
						Liczba rund: <input value={this.state.numberOfRounds} onChange={e => this.setState({ numberOfRounds: e.target.value })} /><br />
						Liczba tasowań: <input value={this.state.shuffleNumber} onChange={e => this.setState({ shuffleNumber: e.target.value })}/><br />
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