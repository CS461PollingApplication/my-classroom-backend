const db = require('../../../app/models/index')
const moment = require('moment')

describe("Section model", () => {

    let section //declare section so it can be accessed in all the following tests, where necessary

    beforeAll(async() => {
        await db.sequelize.sync() // connect to the database
    })

    describe("Section.create", () => {
        it ("should create a valid section record with default values", async () => {
            const section = await db.Section.create({
                number: 15
            })
            expect(section.number).toEqual(15)
        })

        it ("should reject a section with repeated section number", async () => {
            await expect(db.Section.create({
                number: 15
            })).rejects.toThrow("Validation error")
        })
    
        it ("should reject a null section number", async () => {
            await expect(db.Section.create({
                
            })).rejects.toThrow("notNull Violation: Section.number cannot be null")
        })
    
    })

    describe("Section.update", () => {

        beforeEach(async() => {
            section = await db.Section.create({
                number: 14
            })
        })

        it ("should update the section number", async () => {
            await section.update({number: 2})
            await expect(section.save()).resolves.toBeTruthy()
            await section.reload() // reloads the instance from the database after the update into the section variables
            expect(section.number).toEqual(2)
        })

        afterEach(async () => {
            await section.destroy()
        })
    })

    afterAll(async () => {
        await db.Section.destroy({ // delete all Section records to flush out the database after the tests have run
            where: {},
            truncate: true
        })
        await db.sequelize.close()
    })
})