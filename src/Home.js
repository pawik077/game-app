import React from "react"
import { Link } from "react-router-dom"
import screenfull from "screenfull"

const Home = () => {
	const authInstance = window.gapi.auth2.getAuthInstance()
	const user = authInstance.currentUser.get()
	const userProfile = user.getBasicProfile()
	const profile = {
		id: userProfile.getId(),
		name: userProfile.getName(),
		image: userProfile.getImageUrl(),
		email: userProfile.getEmail(),
		token: user.getAuthResponse().id_token
	}
	const [fullScreenState, setFullScreenState] = React.useState(screenfull.isFullscreen ? 'ON' : 'OFF')
	const toggleFullScreen = () => {
		screenfull.toggle()
		setFullScreenState(!screenfull.isFullscreen ? 'ON' : 'OFF')
	}
	return (
		<>
			<h1>HOME</h1>
			<button onClick={toggleFullScreen}>Fullscreen: {fullScreenState}</button>
			<h2>Zalogowano jako {profile.name} ({profile.email})</h2>
			<div className='logoutButton' onClick={authInstance.signOut}>LOGOUT</div>
			<div>
				<nav>
					<ul>
						<li><Link to='/circleGame'>Polowanie na przedmioty</Link></li>
						<li><Link to='/growingCircleGame'>Polowanie na rosnące przedmioty</Link></li>
						<li><Link to='/stroop'>Badanie efektu Stroopa</Link></li>
						<li><Link to='/threeCardMonte'>Trzy karty</Link></li>
					</ul>
				</nav>
			</div>
		</>
	)
}
export default Home