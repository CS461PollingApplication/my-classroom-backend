const { Router } = require('express')
const router = Router()

//GET request from /courses homepage
router.get('/',  async function (req, res) {


    res.status(200).json({

    })
})

module.exports = router