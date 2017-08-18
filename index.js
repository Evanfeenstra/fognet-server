const serve = require("./libs/serve")
const express = require("express"),
  util = require("util")
const path = require("path")

const app = express()

app.use(serve.auth)

app.listen(9000, function() {
  console.log("Listening on port 9000!")
})
