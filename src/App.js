import React from "react"
import { BrowserRouter, Switch, Route } from "react-router-dom"

import Login from "./Login"
import Home from "./Home"
import CircleGame from "./circleGame"
import GrowingCircleGame from "./growingCircleGame"
import Stroop from "./stroop.js"
import ThreeCardMonte from "./threeCardMonte"

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID
/**
 * Main App component, responsible for initialising Google Sign-In and rendering
 * other components using BrowserRouter
 */
class App extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isSignedIn: null
		}
	}
	/**
	 * Initialises Google Sign-In API and sets up a listener for changes
	 * in the current user's sign-in state
	 */
	initGoogleSignIn() {
		window.gapi.load('auth2', () => {
			window.gapi.auth2.init({
				client_id: CLIENT_ID
			}).then(() => {
				const authInstance = window.gapi.auth2.getAuthInstance()
				const isSignedIn = authInstance.isSignedIn.get()
				this.setState({ isSignedIn })
				authInstance.isSignedIn.listen(isSignedIn => this.setState({ isSignedIn }))
			})
		})
	}
	/**
	 * Appends Google platform scripts to document body
	 */
	componentDidMount() {
		const script = document.createElement('script')
		script.src = 'https://apis.google.com/js/platform.js'
		script.onload = () => this.initGoogleSignIn()
		document.body.appendChild(script)
	}
	/**
	 * Checks if user is signed in,
	 * if true, renders the desired component,
	 * if false, renders Login component
	 * 
	 * @param {React.Component} Component 
	 * @returns Component to be rendered
	 */
	ifUserSignedIn(Component) {
		if (this.state.isSignedIn === null) return null
		return this.state.isSignedIn ? <Component/> : <Login/>
	}
	render() {
		return (
			<BrowserRouter>
				<Switch>
					<Route exact path='/' render={() => this.ifUserSignedIn(Home)} />
					<Route path='/circleGame' render={() => this.ifUserSignedIn(CircleGame)} />
					<Route path='/growingCircleGame' render={() => this.ifUserSignedIn(GrowingCircleGame)} />
					<Route path='/stroop' render={() => this.ifUserSignedIn(Stroop)} />
					<Route path='/threeCardMonte' render={() => this.ifUserSignedIn(ThreeCardMonte)} />
				</Switch>
			</BrowserRouter>
		)
	}
}

export default App
