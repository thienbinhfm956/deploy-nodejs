module.exports = (req, res, next) => {
  if (!req.user) {
    var retUrl = req.originalUrl;
    return res.redirect(`/users/login?retUrl=${retUrl}`);
  }
  next();
};
