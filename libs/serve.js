//const queryString = require("query-string")
const parseurl = require("parseurl")

module.exports = (req, res) => {
  // Get url info
  // Check is there is a hash
  //if (!queries.key) return res.send(`<p>Please attach a key :)</p>`)

  // Put authChecker in here
  //if (false) return res.send(`<p>Invalid Key</p>`)

  var options = {
    root: __dirname + "/../public"
  }
  // Respond with the file
  return res.sendFile(parseurl(req).pathname, options, function(err) {
    // Throw if file doesn't exist
    if (err) {
      res.send(`<p>File not found</p>`)
    }
  })
}
