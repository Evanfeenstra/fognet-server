const redis = require('redis');
const client = redis.createClient();
  
function get(key, callback) {
  client.get(key, (err, res) => {
    callback(err, JSON.parse(res));
  });
}

function set(key, obj) {
  client.set(key, JSON.stringify(obj), (err, res) => {
    callback(err, res);
  });
}

function incr(key) {
  client.incr(key, (err, res) => {
    callback(err, res);
  });
}

module.exports = {
  'get': get,
  'set': set,
  'incr': incr
}
