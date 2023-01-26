const router = require('express').Router()

router.post('/', async function (req, res, next) {
    var adminRole = false
    if (req.get('authorization')) {
      const token = extractToken(req)
      req.user = verifyToken(token)
      if (!req.user) {
        console.log(err)
        res.status(401).send({
          err: "Invalid authentication token"
        })
        return
      }
      adminRole = isAdmin(req.user)
    }
    if (req.body.admin && !adminRole) {
      res.status(403).send({
        error: "Granting an admin role requires admin authentication"
      })
    }
    else {
      try {
        const user = await User.create(req.body, UserClientFields)
        res.status(201).send({ id: user.id })
      } catch (e) {
        if (e instanceof ValidationError) {
          res.status(400).send({ error: e.message })
        } else {
          throw e
        }
      }
    }
  })

module.exports = router