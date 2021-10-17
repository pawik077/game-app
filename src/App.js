import React from "react"
import { BrowserRouter, Switch, Route } from "react-router-dom"

import Login from "./Login"
import Home from "./Home"
import CircleGame from "./circleGame"

class App extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isSignedIn: null
		}
	}
	initGoogleSignIn() {
		window.gapi.load('auth2', () => {
			window.gapi.auth2.init({
				client_id: '479916084496-dp7jkcmdb7k4evs23grf0sotrb0nfo5p.apps.googleusercontent.com'
			}).then(() => {
				const authInstance = window.gapi.auth2.getAuthInstance()
				const isSignedIn = authInstance.isSignedIn.get()
				this.setState({ isSignedIn })
				authInstance.isSignedIn.listen(isSignedIn => this.setState({ isSignedIn }))
			})
		})
	}
	componentDidMount() {
		const script = document.createElement('script')
		script.src = 'https://apis.google.com/js/platform.js'
		script.onload = () => this.initGoogleSignIn()
		document.body.appendChild(script)
	}
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
			</Switch>
		</BrowserRouter>
		)
	}
}

export default App
