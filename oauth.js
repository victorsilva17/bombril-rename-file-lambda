require('dotenv').config()
const qs = require('qs')
const axios = require('axios')

exports.OAuth = async () => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 8000 // Setting explicit timeout
    }
    const body = qs.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: process.env.GRANT_TYPE,
      scope: process.env.SCOPE
    })

    const auth = await axios.post('https://developer.api.autodesk.com/authentication/v2/token', body, config)
    return "Bearer " + auth.data.access_token

  } catch (error) {
    console.log('Erro OAuth', error)
    return null
  }
}
