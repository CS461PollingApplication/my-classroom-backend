const db = require('../../../app/models/index')
const moment = require('moment')

describe("Session model", () => {
    let session

    beforeAll(async() => {
        //await db.sequelize.sync() // connect to the database
        session = await db.Session.create()
    })

    describe("Session.create", () => {
        it ("Should create a valid session record with default time in expires (Now + 4 hours)", async () => {
            expect(moment(session.expires).isValid()).toEqual(true) 
        })

        it ("Should return false, as we just made the session", async() => {
            expect(session.checkIfExpired()).toEqual(false) 
        })

        it ("Should return true, as the session expired", async() =>{
            console.log(session.expires)
            console.log(moment().subtract(2, 'minutes').utc().format("YYYY-MM-DD HH:mm:ss"))
            await session.update({expires: moment().subtract(1, 'minutes').utc().format("YYYY-MM-DD HH:mm:ss")})
            console.log(moment(session.expires))
            expect(session.checkIfExpired()).toEqual(true) 
        })
    })
    

    afterAll(async () => {
        await db.Session.destroy({ // delete all session records to flush out the database after the tests have run
            where: {},
            truncate: true
        })
        //await db.sequelize.close()
    })
})