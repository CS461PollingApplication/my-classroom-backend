const app = require('../../../app/app')
const request = require('supertest')
const db = require('../../../app/models')
const { logger } = require('../../../lib/logger')

describe('POST /users', () => {
    it('should respond with 201 and user information', async () => {
        const resp = await request(app).post('/users').send({
            firstName: "Memey",
            lastName: "Meme",
            email: "MemeyMeme@myclassroom.com",
            rawPassword: "TheMemeiestSecret",
            confirmedPassword: "TheMemeiestSecret"
        })
        expect(resp.statusCode).toEqual(201)
        expect(resp.body.user.firstName).toEqual("Memey")
        expect(resp.body.user.lastName).toEqual("Meme")
        expect(resp.body.user.email).toEqual("MemeyMeme@myclassroom.com")
        expect(resp.body.token).toBeTruthy()
    })

    it('should respond with 400 and missing fields', async () => {
        const resp = await request(app).post('/users').send({
            firstName: "Memey",
            email: "MemeyMeme@myclassroom.com",
            rawPassword: "TheMemeiestSecret",
        })
        expect(resp.statusCode).toEqual(400)
        expect(resp.body.error).toEqual("Missing fields required to create user: lastName, confirmedPassword")
    })

    it('should respond with 400 and message that passwords do not match', async () => {
        const resp = await request(app).post('/users').send({
            firstName: "Memer",
            lastName: "Memey",
            email: "MemeyMemer123@myclassroom.com",
            rawPassword: "TheMemeiestSecret",
            confirmedPassword: "TheMemeiestSecret123"
        })
        expect(resp.statusCode).toEqual(400)
        expect(resp.body.error).toEqual("Password & confirmed password do not match")
    })

    it('should respond with 400 and message that email already exists', async () => {
        const resp = await request(app).post('/users').send({
            firstName: "Memer",
            lastName: "Memey",
            email: "MemeyMeme@myclassroom.com",
            rawPassword: "TheMemeiestSecret123",
            confirmedPassword: "TheMemeiestSecret123"
        })
        expect(resp.statusCode).toEqual(400)
        expect(resp.body.error).toEqual("An account associated with that email already exists")
    })

    it('should respond with 400 and validation errors', async () => {
        const resp = await request(app).post('/users').send({
            firstName: "Memer",
            lastName: "",
            email: "MemeyMemer123@myclassroom",
            rawPassword: "TheMemeiestSecret123",
            confirmedPassword: "TheMemeiestSecret123"
        })
        expect(resp.statusCode).toEqual(400)
        expect(resp.body.error).toContain("Invalid email")
        expect(resp.body.error).toContain("Last name cannot be empty")
    })
})

describe('POST /users/login', () => {

    it('should respond with 200 and loginStatus = 2', async () => {
        const user = await db.User.create({
            firstName: "Login",
            lastName: "Tester",
            email: "loginTester1@myclassroom.com",
            rawPassword: "loginTester123!",
            confirmedPassword: "loginTester123!"
        })
        const resp = await request(app).post('/users/login').send({
            email: "loginTester1@myclassroom.com",
            rawPassword: "loginTester123!"
        })
        expect(resp.statusCode).toEqual(200)
        expect(resp.body.user.firstName).toEqual("Login")
        expect(resp.body.user.lastName).toEqual("Tester")
        expect(resp.body.user.email).toEqual("loginTester1@myclassroom.com")
        expect(resp.body.token).toBeTruthy()
        expect(resp.body.loginStatus).toEqual(2)
        await user.destroy()
    })

    it('should respond with 200 and loginStatus = 0', async () => {
        const user = await db.User.create({
            firstName: "Login",
            lastName: "Tester",
            email: "loginTester2@myclassroom.com",
            rawPassword: "loginTester123!",
            confirmedPassword: "loginTester123!",
            emailConfirmed: true
        })
        const resp = await request(app).post('/users/login').send({
            email: "loginTester2@myclassroom.com",
            rawPassword: "loginTester123!",
        })
        expect(resp.statusCode).toEqual(200)
        expect(resp.body.user.firstName).toEqual("Login")
        expect(resp.body.user.lastName).toEqual("Tester")
        expect(resp.body.user.email).toEqual("loginTester2@myclassroom.com")
        expect(resp.body.token).toBeTruthy()
        expect(resp.body.loginStatus).toEqual(0)
        await user.destroy()
    })

    it('should respond with 200 and loginStatus = 1', async () => {
        const user = await db.User.create({
            firstName: "Login",
            lastName: "Tester",
            email: "loginTester3@myclassroom.com",
            rawPassword: "loginTester123!",
            confirmedPassword: "loginTester123!",
            emailConfirmed: true,
            passwordResetInitiated: true
        })
        const resp = await request(app).post('/users/login').send({
            email: "loginTester3@myclassroom.com",
            rawPassword: "loginTester123!",
        })
        expect(resp.statusCode).toEqual(200)
        expect(resp.body.user.firstName).toEqual("Login")
        expect(resp.body.user.lastName).toEqual("Tester")
        expect(resp.body.user.email).toEqual("loginTester3@myclassroom.com")
        expect(resp.body.token).toBeTruthy()
        expect(resp.body.loginStatus).toEqual(1)
        await user.destroy()
    })

    it('should respond with 404 and message that email does not exist', async () => {
        const resp = await request(app).post('/users/login').send({
            email: "abc123@myclassroom.com",
            rawPassword: "loginTester123!",
        })
        expect(resp.statusCode).toEqual(404)
        expect(resp.body.error).toEqual('No account found with email: abc123@myclassroom.com')
    })

    it('should respond with 401 and message that account is locked', async () => {
        const user = await db.User.create({
            firstName: "Login",
            lastName: "Tester",
            email: "loginTester4@myclassroom.com",
            rawPassword: "loginTester123!",
            confirmedPassword: "loginTester123!",
            failedLoginAttempts: 3
        })
        const resp = await request(app).post('/users/login').send({
            email: "loginTester4@myclassroom.com",
            rawPassword: "loginTester123!",
        })
        expect(resp.statusCode).toEqual(401)
        expect(resp.body.error).toEqual('This account has been locked until the password is reset. An email should have been sent with instructions')
        await user.destroy()
    })

    it('should respond with 401 and message that account is now locked', async () => {
        let user = await db.User.create({
            firstName: "Login",
            lastName: "Tester",
            email: "loginTester5@myclassroom.com",
            rawPassword: "loginTester123!",
            confirmedPassword: "loginTester123!",
            failedLoginAttempts: 2
        })
        const resp = await request(app).post('/users/login').send({
            email: "loginTester5@myclassroom.com",
            rawPassword: "loginTester123",
        })
        expect(resp.statusCode).toEqual(401)
        expect(resp.body.error).toEqual('Incorrect password. Your account has been locked. You will need to reset your password before logging in. An email should have been sent to your inbox')
        await user.reload()
        expect(user.failedLoginAttempts).toEqual(3)
        await user.destroy()
    })

    it('should respond with 401 and message that account has 2 remaining tries', async () => {
        let user = await db.User.create({
            firstName: "Login",
            lastName: "Tester",
            email: "loginTester6@myclassroom.com",
            rawPassword: "loginTester123!",
            confirmedPassword: "loginTester123!"
        })
        const resp = await request(app).post('/users/login').send({
            email: "loginTester6@myclassroom.com",
            rawPassword: "loginTester123",
        })
        expect(resp.statusCode).toEqual(401)
        expect(resp.body.error).toEqual('Incorrect password. Your account will be locked after 2 more unsuccessful attempts')
        await user.reload()
        expect(user.failedLoginAttempts).toEqual(1)
        await user.destroy()
    })

})