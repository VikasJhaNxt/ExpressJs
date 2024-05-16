const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()

const dbPath = path.join(__dirname, 'userData.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const q = `select * from user where username='${username}';`
  const res = await db.get(q)
  if (res !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const np = bcrypt.hash(password, 10)
      const q = `insert into user values(${username},${name},${np},${gender},${location});`
      const res = await db.run(q)
      response.status(200)
      response.send('User created successfully')
    }
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const q = `select * from user where username='${username}';`
  const res = await db.get(q)
  if (res === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const p = await bcrypt.compare(password, res.password)
    if (p === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.code(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const q = `select * from user where username='${username}';`
  const res = await db.get(q)
  const p = await bcrypt.compare(oldPassword, res.password)
  if (p === true) {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const q = `update user set password=${newPassword} where username=${username};`
      const res = await db.run(q)
      response.status(200)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})
module.exports = app
