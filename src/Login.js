import React from "react"
import axios from "axios"
import styles from "./Login.module.css"
const backend = process.env.REACT_APP_BACKEND
/**
 * Component responsible for handling user login using Google Sign-In
 */
class Login extends React.Component {
	/**
	 * Renders login button
	 */
	componentDidMount() {
		window.gapi.load('signin2', () => window.gapi.signin2.render('loginButton'))
	}
	/**
	 * Executes onSignIn action while unmounting if user signed in
	 */
	async componentWillUnmount() {
		const authInstance = window.gapi.auth2.getAuthInstance()
		const isSignedIn = authInstance.isSignedIn.get()
		if (isSignedIn) {
			const user = authInstance.currentUser.get()
			this.onSignIn(user)
		}
	}
	/**
	 * Sends user id_token to backend
	 * 
	 * @param {GoogleUser} user 
	 */
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