const queryString = require("query-string")
const parseurl = require("parseurl")

module.exports = (req, res) => {
  // Get url info
  const url = parseurl(req)
  const queries = queryString.parse(url.query)
  // Check is there is a hash
  if (!queries.key) return res.send(`<p>Please attach a key :)</p>`)

  // Put authChecker in here
  if (false) return res.send(`<p>Invalid Key</p>`)

  var options = {
    root: __dirname + "/../public"
  }
  // Respond with the file
  console.log(options.root)
  return res.sendFile(url.pathname, options, function(err) {
    // Throw if file doesn't exist
    if (err) {
      res.send(`<p>File not found</p>`)
    } else {
      console.log("Sent:", url.pathname)
    }
  })
}
