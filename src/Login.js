import React from "react"
import axios from "axios"
import styles from "./Login.module.css"
const backend = process.env.REACT_APP_BACKEND

class Login extends React.Component {
	componentDidMount() {
		window.gapi.load('signin2', () => window.gapi.signin2.render('loginButton'))
	}
	async componentWillUnmount() {
		const authInstance = window.gapi.auth2.getAuthInstance()
		const isSignedIn = authInstance.isSignedIn.get()
		if (isSignedIn) {
			const user = authInstance.currentUser.get()
			// console.log(user.getAuthResponse().id_token)
			this.onSignIn(user)
		}
	}
	async onSignIn(user) {
		const id_token = user.getAuthResponse().id_token
		try {
			const r = await axios.post(`${backend}/tokensignin`, 'id_token=' + id_token)
			console.log(r)
		} catch (error) {
			console.error(error)
		}
	}

	render() {
		return (
			<div className={styles.welcome}>
				<h1>Witamy</h1>
				<div id='loginButton'>Zaloguj się z Google</div>
			</div>
		)
	}
}
export default Login