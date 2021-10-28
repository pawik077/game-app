import React from "react"
const backend = 'http://localhost:4000'

class Login extends React.Component {
	componentDidMount() {
		window.gapi.load('signin2', () => window.gapi.signin2.render('loginButton'))
	}
	componentWillUnmount() {
		const authInstance = window.gapi.auth2.getAuthInstance()
		const isSignedIn = authInstance.isSignedIn.get()
		if (isSignedIn) {
			const user = authInstance.currentUser.get()
			// console.log(user.getAuthResponse().id_token)
			this.onSignIn(user)
		}
	}
	onSignIn(user) {
		const id_token = user.getAuthResponse().id_token
		let xhr = new XMLHttpRequest()
		xhr.open('POST', `${backend}/tokensignin`)
		xhr.onload = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					console.log(xhr.responseText)
				} else {
					console.error(xhr.statusText)
				}
			}
		}
		xhr.onerror = () => console.error(xhr.statusText)
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
		xhr.send('id_token=' + id_token)
	}

	render() {
		return (
			<div>
				<h1>Witamy</h1>
				<div id='loginButton'>Zaloguj się z Google</div>
			</div>
		)
	}
}
export default Login