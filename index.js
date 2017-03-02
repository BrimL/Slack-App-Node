let express = require('express')
let request = require('request')
let bodyParser = require('body-parser')

// Import our secrets if not already defined to the environment
if(!process.env.CLIENT_ID){
	let env = require('./env.js')
}
let clientId = process.env.CLIENT_ID
let clientSecret = process.env.CLIENT_SECRET
let verificationToken = process.env.VERIFICATION_TOKEN

// Define constants
const app = express()
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const PORT=4390

// Bring up the server
app.listen(PORT, function () {
  console.log("Server is now running on port: " + PORT)
})
app.get('/', function(req, res) {
    res.send('Ngrok is working! Path Hit: ' + req.url)
})

// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get('/oauth', function(req, res) {
  // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
  if (!req.query.code) {
    res.status(500)
    res.send({"Error": "Looks like we're not getting code."})
    console.log("Looks like we're not getting code.")
  } else {
    // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
    request({
      url: 'https://slack.com/api/oauth.access', //URL to hit
      qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
      method: 'GET', 
      }, 
      function (error, response, body) {
        if (error) {
          console.log(error)
        } else {
          res.json(body)
        }
      })
  }
})

app.post('/command/ping', urlencodedParser, (req, res) =>{
  var reqBody = req.body
  var responseURL = reqBody.response_url
  if (reqBody.token != verificationToken){
    res.status(403).end('Access forbidden')
  }else{
  	res.status(200).end() 
  	var message = { "text":"Slack app is currently up and available!"}
  }
  sendMessageToSlackResponseURL(responseURL, message)
})

app.post('/command/send-me-buttons', urlencodedParser, (req, res) =>{
  var reqBody = req.body
  var responseURL = reqBody.response_url
  if (reqBody.token != verificationToken){
    res.status(403).end('Access forbidden')
  }else{
  	res.status(200).end() 
    let message = {
      "text": "This is your first interactive message",
      "attachments": [
        {
          "text": "Building buttons is easy right?",
          "fallback": "Shame... buttons aren't supported in this land",
          "callback_id": "button_tutorial",
          "color": "#3AA3E3",
          "attachment_type": "default",
          "actions": [
            {
              "name": "yes",
              "text": "yes",
              "type": "button",
              "value": "yes"
            },
            {
              "name": "no",
              "text": "no",
              "type": "button",
              "value": "no"
            },
            {
              "name": "maybe",
              "text": "maybe",
              "type": "button",
              "value": "maybe",
              "style": "danger"
            }
          ]
        }
      ]
    }
    sendMessageToSlackResponseURL(responseURL, message)
  }
})

app.post('/actions', urlencodedParser, (req, res) =>{
  res.status(200).end() 
  let actionJSONPayload = JSON.parse(req.body.payload) 
  let message = {
    "text": actionJSONPayload.user.name+" clicked: "+actionJSONPayload.actions[0].name,
    "replace_original": false
  }
  sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
})

function sendMessageToSlackResponseURL(responseURL, JSONmessage){
  var postOptions = {
    uri: responseURL,
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    json: JSONmessage
  }
  request(postOptions, (error, response, body) => {
    if (error){
      // handle errors as you see fit
    }
  })
}