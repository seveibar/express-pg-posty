const express = require("express")
const pgPosty = require("./dist")

const app = express()

app.use(
  "/posty",
  pgPosty({
    pgCredentials: {
      host: "localhost",
      user: "postgres",
      password: "postgres",
      database: "postgres"
    }
  })
)

app.listen(3000)
