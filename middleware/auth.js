const { validateUser } = require("../service/auth");

function checkUsertoken(cookieName) {
  return (req, res, next) => {
    let tokenValue = req.cookies[cookieName];
    if (!tokenValue) return next();
    
    let user = validateUser(tokenValue);
    req.user = user;
    // console.log(req.user)
    next();
  };
}

module.exports = { checkUsertoken };
