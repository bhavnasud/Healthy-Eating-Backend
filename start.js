'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000
const db = require('./queries')


app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/users', db.getUsers)
app.get('/users/:id', db.getUserById)
app.post('/users', db.createUser)
app.put('/users/:id', db.updateUser)
app.post('/preferences', db.getPreferences)
app.delete('/users/:id', db.deleteUser)
app.post('/updatepreferences', db.updatePreferences)
app.post('/restaurants', db.getRestaurants)





app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})
