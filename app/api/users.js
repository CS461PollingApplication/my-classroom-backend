const db = require('../models')
const { logger } = require('../../lib/logger')
const router = require('express').Router()
const { UniqueConstraintError, ValidationError } = require('sequelize')
const { validateUserCreationRequest, extractUserCreationFields, filterUserFields } = require('../services/users_service')
const { serializeSequelizeErrors, serializeStringArray } = require('../../lib/string_helpers')
const { generateUserAuthToken, requireAuthentication } = require('../../lib/auth')

/*
  path: '/users
  scope: any user can send these requests - no authentication
*/

// POST '/users' create a user
router.post('', async function (req, res) {
    const missingFields = validateUserCreationRequest(req.body)
    if (missingFields.length == 0) {
      if (req.body.rawPassword == req.body.confirmedPassword) {
        try {
          const user = await db.User.create(extractUserCreationFields(req.body))
          res.status(201).json({
            "user": filterUserFields(user),
            "token": generateUserAuthToken(user)
          }).send()
        }
        catch (e) {
          if (e instanceof UniqueConstraintError) {
            res.status(400).json({"error": "An account associated with that email already exists"}).send()
          }
          else if (e instanceof ValidationError) {
            res.status(400).json({"error": serializeSequelizeErrors(e)}).send()
          }
          else {
            logger.error(e)
            res.status(500).json({"error": "An unexpected error occurred. Please try again"}).send()
          }
        }
      }
      else {
        res.status(400).json({"error": "Password & confirmed password do not match"}).send()
      }
    }
    else {
      res.status(400).json({"error": `Missing fields required to create user: ${serializeStringArray(missingFields)}`}).send()
    }
})

// PUT 'users/password' request a password reset for the email
router.put('/password', async function (req, res) {

})

// POST 'users/authenticate' login request for a user
router.post('/authenticate', async function (req, res) {

})

/*
  path: 'users/:userId'
  scope: User authenticated as userId is requesting account information
*/

// GET 'users/:userId' authenticated as userId, requesting account information
router.get('/:userId', async function (req, res) {
  res.status(200).json({"success": "great job!"}).send()
})

// PUT 'users/:userId' authenticated as userId, requesting account information update
router.put('/:userId', async function (req, res) {

})

// DELETE 'users/:userId' authenticated as userId, requesting account deletion
router.delete('/:userId', async function (req, res) {

})

// DEBT-WORK: authenticate admin users to perform any of the above operations

module.exports = router