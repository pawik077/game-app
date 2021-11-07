import React from "react"
import { Link } from "react-router-dom"

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
	return (
		<>
			<h1>HOME</h1>
			<h2>Zalogowano jako {profile.name} ({profile.email})</h2>
			<div className='logoutButton' onClick={authInstance.signOut}>LOGOUT</div>
			<div>
				<nav>
					<ul>
						<li><Link to='/circleGame'>Polowanie na przedmioty</Link></li>
					</ul>
				</nav>
			</div>
		</>
	)
}
export default Home