import React from "react"

class Login extends React.Component {
	componentDidMount() {
		window.gapi.load('signin2', () => window.gapi.signin2.render('loginButton'))
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