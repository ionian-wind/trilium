const dns = require('dns');
const http = require('https');
const qs = require('querystring');

const dnsCache = new Map();

const lookup = (hostname, options, callback) => dnsCache.has(hostname)
  ? callback(null, ...dnsCache.get(hostname))
  : dns.lookup(hostname, options, (error, ...result) => {
    if (error) {
      callback(error);
    } else {
      dnsCache.set(hostname, result);

      callback(null, ...result)
    }
  });

const request = ({
  host,
  path,
  method = 'get',
  params = {},
  body = {},
  json = true
} = {}) => new Promise((resolve, reject) => {
  const realPath = `${path}?${qs.stringify(params)}`;

  const req = http.request({
    lookup,
    method,
    host,
    path: realPath,
    headers: json ? {
      'Content-Type': 'application/json'
    } : {}
  }, (res) => {

    const body = [];
    // console.log(res.headers)
    res.on('data', chunk => body.push(chunk));
    res.on('end', _ => {
      try {
        const content = Buffer.concat(body);

        const result = json ? JSON.parse(content.toString()) : content;

        res.statusCode < 200 || res.statusCode > 399
          ? reject(result)
          : resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }).on('error', reject);
  req.on('information', console.log)
  if (['post', 'patch', 'put'].includes(method.toLowerCase())) {
    req.write(JSON.stringify(body));
  }

  req.end();
});

module.exports = request;
