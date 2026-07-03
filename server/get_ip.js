const address = require('address');
address.ip((err, ip) => {
    if (err) console.error(err);
    else console.log('Machine IP:', ip);
});
