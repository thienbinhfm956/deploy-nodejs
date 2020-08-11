var session = require('express-session');

module.exports = function (app) {
  app.use(session({
    secret: 'b177fa269bb1a69fe54d99eb6ad0239b',
    resave: true,
    saveUninitialized: true
  }));
}
