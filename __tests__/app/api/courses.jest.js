const app = require('../../../app/app')
const request = require('supertest')

describe('GET /courses', () => {

    it('should respond with 200 and the courses enrolled in', async () => {
        const respUser = await request(app).post('/users').send({
            firstName: "Yeety",
            lastName: "Yeeter",
            email: "YeetYeet@myclassroom.com",
            rawPassword: "YoungestYeeter",
            confirmedPassword: "YoungestYeeter"
        })
        const token = respUser.body.token
        
        const resp = await request(app).get('/courses').set('Authorization', `Bearer ${token}`)
        expect(resp.statusCode).toEqual(200)
    })

    it('should respond with 401 if authorization is wrong', async () => {
        const respUser = await request(app).post('/users').send({
            firstName: "Yoity",
            lastName: "Mcyoiterson",
            email: "rgergwerg@myclassroom.com",
            rawPassword: "thisisapassword",
            confirmedPassword: "thisisapassword"
        })
        
        const resp = await request(app).get('/courses').set('Authorization', `Bearer rgergnerignergienrgieurng`)
        expect(resp.statusCode).toEqual(401)
    })

    it('should respond with 201 when a valid course is created and should create an enrollment', async () => {
        const respUser = await request(app).post('/users').send({
            firstName: "Swaggy",
            lastName: "Doo",
            email: "Swaggydoo@myclassroom.com",
            rawPassword: "ualreadyknoooo",
            confirmedPassword: "ualreadyknoooo"
        })
        expect(respUser.statusCode).toEqual(201)
        const token = respUser.body.token
        
        const resp = await request(app).post('/courses').send({
            name: "Litness 101",
            description: "Wanna get lit? We'll show you how",
            published: false
        }).set('Authorization', `Bearer ${token}`)
        expect(resp.statusCode).toEqual(201)
        expect(resp.body.course.name).toEqual("Litness 101")
        expect(resp.body.course.description).toEqual("Wanna get lit? We'll show you how")
        expect(resp.body.course.published).toEqual(false)
        expect(resp.body.enrollment.courseId).toEqual(resp.body.course.id)
        //expect(resp.enrollment.userId).toEqual() **NOTE: user response does not include id
        expect(resp.body.enrollment.role).toEqual("teacher")
        expect(resp.body.enrollment.section).toBeFalsy()
    })
})