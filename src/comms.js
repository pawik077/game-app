import axios from "axios"
import { deviceDetect } from "react-device-detect"
const backend = process.env.REACT_APP_BACKEND

/**
 * Sends results of a game round to backend by sending a POST request to /results endpoint
 * 
 * @param {string} eMail eMail of the current player (used to identify player in backend)
 * @param {number} gameID ID of the current game
 * @param {{Setting1: ?number, Setting2: ?number, Setting3: ?number, Setting4: ?number, Setting5: ?number}} gameSettings Settings of current game round
 * @param {{Result1: ?number, Result2: ?number, Result3: ?number, Result4: ?number, Result5: ?number}} gameResults Results of current game round
 */
const sendResults = (eMail, gameID, gameSettings, gameResults) => {
	const payload = {
		eMail: eMail,
		gameID: gameID,
		gameSettings: gameSettings,
		gameResults: gameResults,
		deviceInfo: deviceDetect(),
	}
	try {
		axios.post(`${backend}/results`, payload)	
	} catch (error) {
		console.log(error)
	}
}
/**
 * Retrieves results of game rounds for a specified player or game by sending a GET request to /results endpoint
 * 
 * @param {{eMail: ?string, gameID: ?number}} options Contains parameters for request (eMail or gameID)
 * @returns Array of objects containing results
 */
const getResults = async (options) => {
	if (!options) options = {
		eMail: '',
		gameID: ''
	}
	try {
		const results = await axios.get(`${backend}/results?eMail=${options.eMail || ''}&gameID=${options.gameID || ''}`)
		return results.data
	} catch (error) {
		throw error
	}
}

export { sendResults, getResults }