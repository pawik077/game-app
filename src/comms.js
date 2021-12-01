import axios from "axios"
const backend = process.env.REACT_APP_BACKEND

const sendResults = (eMail, gameID, gameSettings, gameResults) => {
	const payload = {
		eMail: eMail,
		gameID: gameID,
		gameSettings: gameSettings,
		gameResults: gameResults
	}
	try {
		axios.post(`${backend}/results`, payload)	
	} catch (error) {
		console.log(error)
	}
}

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