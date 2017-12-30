const redis = require('redis');
const client = redis.createClient({
  url: 'redis://redis-12727.c1.us-west-2-2.ec2.cloud.redislabs.com',
  port: '12727',
  password: 'fognetrulez',
});
  
function get(key, callback) {
  client.get(key, (err, res) => {
    callback(err, JSON.parse(res));
  });
}

function set(key, obj, callback) {
  client.set(key, JSON.stringify(obj), (err, res) => {
    callback(err, res);
  });
}

function incr(key, callback) {
  client.incr(key, (err, res) => {
    callback(err, res);
  });
}

module.exports = {
  'get': get,
  'set': set,
  'incr': incr
}
