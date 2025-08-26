const jwt = require("jsonwebtoken")
const secret = "123"

function generateToken(user) {
    let payload = {
        _id: user._id,
        name: user.name,
        email: user.email,
    }
    let token = jwt.sign(payload, secret)
    return token
}

function validateUser(token) {
    let payload = jwt.verify(token, secret)
    return payload
}

module.exports = {
    generateToken,
    validateUser
}