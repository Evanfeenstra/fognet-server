const serve = require("./libs/serve")
const express = require("express"),
  util = require("util")
const path = require("path")

const app = express()

app.use(serve.auth)

app.listen(3000, function() {
  console.log("Listening on port 3000!")
})
