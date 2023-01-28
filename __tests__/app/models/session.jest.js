const db = require('../../../app/models/index')
const moment = require('moment')

describe("Session model", () => {
    let Session

    beforeAll(async() => {
        await db.sequelize.sync() // connect to the database
        session = await db.Session.create()
    })

    describe("Session.create", () => {
        it ("Should create a valid session record with default time in expires (Now + 4 hours)", async () => {
            expect(moment(session.expires).Empty).toBeFalsy()
        })

        it ("Should return false, as we just made the session", async() => {
            expect(session.checkIfExpired()).toBeFalsy()
        })
    })
    

    afterAll(async () => {
        await db.Session.destroy({ // delete all session records to flush out the database after the tests have run
            where: {},
            truncate: true
        })
        await db.sequelize.close()
    })
})