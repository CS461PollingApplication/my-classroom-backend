const { Router } = require('express')
const router = Router()

router.use('/courses', require('./courses.js'))

module.exports = router