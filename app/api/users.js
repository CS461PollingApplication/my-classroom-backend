const db = require('../models')
const { logger } = require('../../lib/logger')
const router = require('express').Router()
const { UniqueConstraintError, ValidationError } = require('sequelize')
const usersService = require('../services/users_service')
const { serializeSequelizeErrors, serializeStringArray } = require('../../lib/string_helpers')
const { generateUserAuthToken, requireAuthentication } = require('../../lib/auth')

/*
  path: '/users
  scope: any user can send these requests - no token authentication
*/

// POST '/users' create a user
router.post('', async function (req, res, next) {
    const missingFields = usersService.validateUserCreationRequest(req.body)
    if (missingFields.length == 0) {
      if (req.body.rawPassword == req.body.confirmedPassword) {
        try {
          const user = await db.User.create(usersService.extractUserCreationFields(req.body))
          res.status(201).send({
            user: usersService.filterUserFields(user),
            token: generateUserAuthToken(user)
          })
        }
        catch (e) {
          if (e instanceof UniqueConstraintError) {
            res.status(400).send({error: "An account associated with that email already exists"})
          }
          else if (e instanceof ValidationError) {
            res.status(400).send({error: serializeSequelizeErrors(e)})
          }
          else {
            next(e)
          }
        }
      }
      else {
        res.status(400).send({error: "Password & confirmed password do not match"})
      }
    }
    else {
      res.status(400).send({error: `Missing fields required to create user: ${serializeStringArray(missingFields)}`})
    }
})

// PUT 'users' reset a password
router.put('', async function (req, res, next) {
  const missingFields = usersService.validateUserPasswordResetRequest(req.body)
  if (missingFields.length == 0) {
    const user = await db.User.findOne({ where: { email: req.body.email } })
    if (user != null) {
      if (user.passwordResetInitiated && user.validatePasswordReset(req.body.passwordResetCode)) {
        if (!user.passwordResetExpired()) {
          if (req.body.rawPassword === req.body.confirmedPassword) {
            try {
              await user.resetPassword(req.body.rawPassword)
              res.status(200).send({
                user: usersService.filterUserFields(user),
                token: generateUserAuthToken(user)
              })
            }
            catch (e) {
              if (e instanceof ValidationError) {
                res.status(400).send({error: serializeSequelizeErrors(e)})
              }
              else {
                next(e)
              }
            }
          }
          else {
            res.status(400).send({error: `Passwords do not match`})
          }
        }
        else {
          res.status(401).send({error: `Credentials expired. Please request new credentials and try again`})
        }
      }
      else {
        res.status(401).send({error: `Invalid credentials provided`})
      }
    }
    else {
      res.status(404).send({error: `No account with that email exists`})
    }
  }
  else {
    res.status(400).send({error: `Missing fields required to reset password: ${serializeStringArray(missingFields)}`})
  }
})

// PUT 'users/password' request a password reset
router.put('/password', async function (req, res, next) {
  const email = req.body.email
  if (email != null) {
    const user = await db.User.findOne({ where: { email: email }})
    if (user != null) {
      try {
        await user.generatePasswordReset()
      }
      catch (e) {
        next(e)
        return
      }
    }
    res.status(200).send({ message: `If an account exists for ${email}, password reset instructions will be sent` })
  }
  else {
    res.status(400).send({ error: `Missing fields required for password reset request: email` })
  }
})

// POST 'users/login' login request for a user
router.post('/login', async function (req, res, next) {
  const missingFields = usersService.validateUserLoginRequest(req.body)
  if (missingFields.length == 0) {
    const user = await db.User.findOne({ where: { email: req.body.email } })
    if (user == null) {
      res.status(404).send({error: `No account found with email: ${req.body.email}`})
    }
    else {
      try {
        const loginStatus = await user.login(req.body.rawPassword)
        switch (loginStatus) {
          case -3:
            res.status(401).send({error: `This account has been locked until the password is reset. An email should have been sent with instructions`})
            break
          case -2:
            res.status(401).send({error: `Incorrect password. Your account has been locked. You will need to reset your password before logging in. An email should have been sent to your inbox`})
            break
          case -1:
            res.status(401).send({error: `Incorrect password. Your account will be locked after ${3 - user.failedLoginAttempts} more unsuccessful attempts`})
            break
          default:
            if (loginStatus >= 0) {
              res.status(200).send({
                user: usersService.filterUserFields(user),
                token: generateUserAuthToken(user),
                loginStatus: loginStatus
              })
            }
            else {
              throw new Error(`User login returned an unexpected loginStatus: ${loginStatus}`)
            }
        }
      }
      catch (e) {
        next(e)
      }
    }
  }
  else {
    res.status(400).send({error: `Missing fields required to authenticate user: ${serializeStringArray(missingFields)}`})
  }
})

/*
  path: 'users/:userId'
  scope: User authenticated as userId is requesting account information
*/

// GET 'users/:userId' authenticated as userId, requesting account information
router.get('/:userId', requireAuthentication, async function (req, res, next) {
  try {
    const userId = req.params.userId
    const user = await db.User.findByPk(userId)
    if (user != null) {
      const subUser = await db.User.findByPk(req.payload.sub)
      if (userId == req.payload.sub || subUser.admin) {
        res.status(200).send({
          user: usersService.filterUserFields(user)
        })
      }
      else {
        res.status(403).send({
          error: `Insufficient permissions to access that resource`
        })
      }
    }
    else {
      res.status(404).send({
        error: `User with id ${userId} not found`
      })
    }
  }
  catch (e) {
    next(e)
  }
})

// PUT 'users/:userId' authenticated as userId, requesting account information update
router.put('/:userId', requireAuthentication, async function (req, res, next) {
  const userId = req.params.userId
  const user = await db.User.findByPk(userId)
  if (user != null) {
    if (userId == req.payload.sub) {
      try {
        const rawPassword = req.body.rawPassword
        if (req.body.oldPassword || rawPassword || req.body.confirmedPassword) {
          const missingFields = usersService.validateUserPasswordChangeRequest(req.body)
          if (missingFields.length == 0) {
            if (user.validatePassword(req.body.oldPassword)) {
              if (rawPassword !== req.body.confirmedPassword) {
                res.status(400).send({
                    error: `Passwords do not match`
                })
                return
              }
            }
            else {
              res.status(401).send({
                error: `Incorrect password. Cannot set new password.`
              })
              return
            }
          }
          else {
            res.status(400).send({
              error: `Missing fields required to update password: ${serializeStringArray(missingFields)}`
            })
            return
          }
        }
        let updateFields = usersService.filterUserFields(req.body)
        if (Object.keys(updateFields).length < 1) {
          res.status(400).send({
            error: `Missing any valid fields to update the user: email, firstName, lastName`
          })
        }
        else {
          let sendEmailConfirmation = false
          if (updateFields.email != null && updateFields.email != user.email) {
            sendEmailConfirmation = true
            updateFields = {
              ...updateFields,
              emailConfirmed: false
            }
          }
          if (rawPassword != null) {
            updateFields = {
              ...updateFields,
              rawPassword: rawPassword
            }
          }
          
          await user.update(updateFields)
          if (sendEmailConfirmation) {
            await user.generateEmailConfirmation()
          }
          
          res.status(200).send({
            user: usersService.filterUserFields(user)
          })
        }
      }
      catch (e) {
          if (e instanceof ValidationError) {
            res.status(400).send({error: serializeSequelizeErrors(e)})
          }
          else {
            next(e)
          }
      }
    }
    else {
      res.status(403).send({
        error: `Insufficient permissions to access that resource`
      })
    }
  }
  else {
    res.status(404).send({
      error: `User with id ${userId} not found`
    })
  }
})

// DELETE 'users/:userId' authenticated as userId, requesting account deletion
router.delete('/:userId', requireAuthentication, async function (req, res, next) {
  try {
    const userId = req.params.userId
    const user = await db.User.findByPk(userId)
    if (user != null) {
      if (userId == req.payload.sub) {
        await user.destroy()
        res.status(204).send()
      }
      else {
        res.status(403).send({
          error: `Insufficient permissions to access that resource`
        })
      }
    }
    else {
      res.status(404).send({
        error: `User with id ${userId} not found`
      })
    }
  }
  catch (e) {
    next(e)
  }
})

router.put('/:userId/confirm', requireAuthentication, async function (req, res, next) {
  const userId = req.params.userId
  const user = await db.User.findByPk(userId)
  if (user != null) {
    if (userId == req.payload.sub) {
      const emailConfirmationCode = req.body.emailConfirmationCode
      if (emailConfirmationCode != null) {
        try {
          if (user.emailConfirmed) {
            res.status(400).send({
              error: `email already confirmed`
            })
          }
          else {
            if (user.emailConfirmationExpired()) {
              user.generateEmailConfirmation()
              res.status(400).send({
                error: `emailConfirmationCode expired. A new code should have been emailed.`
              })
            }
            else {
              const emailConfirmed = await user.validateEmailConfirmation(emailConfirmationCode)
              if (emailConfirmed) {
                res.status(204).send()
              }
              else {
                res.status(401).send({
                  error: `emailConfirmationCode incorrect`
                })
              }
            }
          }
        }
        catch (e) {
          next(e)
        }
      }
      else {
        res.status(400).send({
          error: `emailConfirmationCode required`
        })
      }
    }
    else {
      res.status(403).send({
        error: `Insufficient permissions to access that resource`
      })
    }
  }
  else {
    res.status(404).send({
      error: `User with id ${userId} not found`
    })
  }
})

module.exports = router