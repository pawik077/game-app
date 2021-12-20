import React from "react"
import { Link } from "react-router-dom"
import screenfull from "screenfull"

/**
 * Home page component, consists of links to other components,
 * Fullscreen toggle button and user info,
 * along with a logout button
 * 
 * @returns JSX.Element representing Home Page
 */
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
	// const [fullScreenState, setFullScreenState] = React.useState(screenfull.isFullscreen ? 'ON' : 'OFF')
	const toggleFullScreen = () => {
		screenfull.toggle()
		// setFullScreenState(!screenfull.isFullscreen ? 'ON' : 'OFF')
	}
	return (
		<>
			<h1>HOME</h1>
			Dla najlepszych efektów zaleca się użytkowanie w trybie pełnego ekranu: <button onClick={toggleFullScreen}>Fullscreen</button>
			<h2>Zalogowano jako {profile.name} ({profile.email})</h2>
			<button className='logoutButton' onClick={authInstance.signOut}>LOGOUT</button>
			<div>
				Wybierz ćwiczenie:
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