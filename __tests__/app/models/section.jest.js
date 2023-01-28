const db = require('../../../app/models/index')

describe("Section model", () => {

    describe("Section.create", () => {
        it ("should create a valid section record with default values", async () => {
            const section = await db.Section.create({
                number: 15,
                joinCode: "23XyZ7" // some alphanumeric value
            })
            expect(section.number).toEqual(15)
            expect(section.joinCode).toEqual("23XyZ7")
            await section.destroy()
        })

        // UNCOMMENT: when the course relationship has been set up
        // it ("should reject a section with repeated section number", async () => {
        //     const section = await db.Section.create({
        //         number: 15,
        //         joinCode: "34Rt56"
        //     })
        //     await expect(db.Section.create({
        //         number: 15,
        //         joinCode: "34Rt57"
        //     })).rejects.toThrow("Validation error")
        //     await section.destroy()
        // })

        it ("should reject a section with repeated join code", async () => {
            const section = await db.Section.create({
                number: 11,
                joinCode: "23Xyp7"
            })
            await expect(db.Section.create({
                number: 10,
                joinCode: "23Xyp7"
            })).rejects.toThrow("Validation error")
            await section.destroy()
        })
    
        it ("should reject a null section number", async () => {
            await expect(db.Section.create({
                joinCode: "23gyZ9"
            })).rejects.toThrow("notNull Violation: Section.number cannot be null")
        })

        it ("should reject a null section join code", async () => {
            await expect(db.Section.create({
                number: 11
            })).rejects.toThrow("notNull Violation: Section join code required")
        })

        it ("should reject a section with a non alphanumeric join code", async () => {
            await expect(db.Section.create({
                number: 8,
                joinCode: "3#$,.5"
            })).rejects.toThrow("Validation error: Validation isAlphanumeric on joinCode failed")
        })

        it ("should reject a section with a join code shorter than 6 characters", async () => {
            await expect(db.Section.create({
                number: 7,
                joinCode: "XSXS"
            })).rejects.toThrow("Validation error: Section join code must be 6 characters")
        })

        it ("should reject a section with a join code longer than 6 characters", async () => {
            await expect(db.Section.create({
                number: 7,
                joinCode: "XSXSXSXS"
            })).rejects.toThrow("Validation error: Section join code must be 6 characters")
        })
    
    })

    describe("Section.update", () => {

        let section

        beforeEach(async() => {
            section = await db.Section.create({
                number: 20,
                joinCode: "RT1YU3"
            })
        })

        it ("should update the section number", async () => {
            await section.update({number: 25})
            await expect(section.save()).resolves.toBeTruthy()
            await section.reload() // reloads the instance from the database after the update into the section variables
            expect(section.number).toEqual(25)
        })

        it ("should update the section join code", async () => {
            await section.update({joinCode: "5TY7UI"})
            await expect(section.save()).resolves.toBeTruthy()
            await section.reload() // reloads the instance from the database after the update into the section variables
            expect(section.joinCode).toEqual("5TY7UI")
        })

        afterEach(async () => {
            await section.destroy()
        })
    })
})