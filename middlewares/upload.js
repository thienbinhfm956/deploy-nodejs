var multer = require('multer');

module.exports = function (app) {
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/img/post')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  });

  app.post('/upload', (req, res, next) => {
    multer({ storage }).array('fuMain')(req, res, err => {
      if (err) {
        return res.json({
          error: err.message
        })
      }

      res.json({});
    })
  })
}
