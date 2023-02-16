const app = require('../../../app/app')
const request = require('supertest')

describe('GET /courses', () => {

    let user
    let course
    let section

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

    it('should respond with 400 for malformed request when there is no course name', async () => {
        const respUser = await request(app).post('/users').send({
            firstName: "Matthew",
            lastName: "Hotchkiss",
            email: "mitchelliscoolerthanme@myclassroom.com",
            rawPassword: "mitchellbetta",
            confirmedPassword: "mitchellbetta"
        })
        expect(respUser.statusCode).toEqual(201)
        const token = respUser.body.token
        
        const resp = await request(app).post('/courses').send({
            description: "Wanna get lit? We'll show you how",
            published: false
        }).set('Authorization', `Bearer ${token}`)
        expect(resp.statusCode).toEqual(400)
    })

    it('should respond with 201 when a valid section is created', async () => {
        const respUser = await request(app).post('/users').send({
            firstName: "Scooby",
            lastName: "Dont",
            email: "Scoobyyo@myclassroom.com",
            rawPassword: "meepmeepmeep",
            confirmedPassword: "meepmeepmeep"
        })
        expect(respUser.statusCode).toEqual(201)
        const token = respUser.body.token
        user = respUser.body
        
        const resp = await request(app).post('/courses').send({
            name: "Fitness 101",
            description: "Wanna get fit? We'll show you how",
            published: false
        }).set('Authorization', `Bearer ${token}`)
        expect(resp.statusCode).toEqual(201)
        expect(resp.body.course.name).toEqual("Fitness 101")
        expect(resp.body.course.description).toEqual("Wanna get fit? We'll show you how")
        expect(resp.body.course.published).toEqual(false)
        expect(resp.body.enrollment.courseId).toEqual(resp.body.course.id)
        //expect(resp.enrollment.userId).toEqual() **NOTE: user response does not include id
        expect(resp.body.enrollment.role).toEqual("teacher")
        expect(resp.body.enrollment.section).toBeFalsy()
        course = resp.body.course

        const respSection = await request(app).post(`/courses/${resp.body.course.id}/sections`).send({
            courseId: resp.body.course.id,
            number: 15,
            joinCode: "45GH1T"
        }).set('Authorization', `Bearer ${token}`)
        expect(respSection.statusCode).toEqual(201)
        expect(respSection.body.section.courseId).toEqual(resp.body.course.id)
        expect(respSection.body.section.number).toEqual(15)
        expect(respSection.body.section.joinCode).toEqual("45GH1T")
        section = respSection.body.section
    })

    it('should respond with 400 for malformed request when there is no course id', async () => {
        const token = user.token

        const respSection = await request(app).post(`/courses/${course.id}/sections`).send({
            number: 15,
            joinCode: "45GH1T"
        }).set('Authorization', `Bearer ${token}`)
        expect(respSection.statusCode).toEqual(400)
    })

    it('should respond with 400 for malformed request when there is no section number', async () => {
        const token = user.token

        const respSection = await request(app).post(`/courses/${course.id}/sections`).send({
            courseId: course.id,
            joinCode: "45GH1T"
        }).set('Authorization', `Bearer ${token}`)
        expect(respSection.statusCode).toEqual(400)
    })

    it('should respond with 400 for malformed request when there is no join code', async () => {
        const token = user.token

        const respSection = await request(app).post(`/courses/${course.id}/sections`).send({
            courseId: course.id,
            number: 15
        }).set('Authorization', `Bearer ${token}`)
        expect(respSection.statusCode).toEqual(400)
    })

    it('should respond with 201 when a student joins a course', async () => {
        const respUser = await request(app).post('/users').send({
            firstName: "Shrek",
            lastName: "DaBoy",
            email: "ShrekyDaBoyyyyyy@myclassroom.com",
            rawPassword: "whoopwhoopwee",
            confirmedPassword: "whoopwhoopwee"
        })
        expect(respUser.statusCode).toEqual(201)
        const token = respUser.body.token
        
        const resp = await request(app).post('/courses/join').send({
            joinCode: "45GH1T"
        }).set('Authorization', `Bearer ${token}`)
        expect(resp.statusCode).toEqual(201)
        expect(resp.body.section.courseId).toEqual(course.id)
        expect(resp.body.section.number).toEqual(section.number)
        expect(resp.body.enrollment.role).toEqual('student')
        expect(resp.body.enrollment.sectionId).toEqual(section.id)
        //expect(resp.body.enrollment.userId).toEqual(respUser.body.user.id) can't get user id because it is not part of the response
        expect(resp.body.enrollment.courseId).toBeFalsy()
        
    })

    it('should respond with 404 when trying to join a course with incorrect join code', async () => {
        const token = user.token
        
        const resp = await request(app).post('/courses/join').send({
            joinCode: "XXXXXX"
        }).set('Authorization', `Bearer ${token}`)
        expect(resp.statusCode).toEqual(404)
    })

    it('should respond with 200 and the courses enrolled in', async () => {
        const token = user.token

        const respJoin = await request(app).post('/courses/join').send({
            joinCode: "45GH1T"
        }).set('Authorization', `Bearer ${token}`)
        expect(respJoin.statusCode).toEqual(201)
        expect(respJoin.body.section.courseId).toEqual(course.id)
        expect(respJoin.body.section.number).toEqual(section.number)
        expect(respJoin.body.enrollment.role).toEqual('student')
        expect(respJoin.body.enrollment.sectionId).toEqual(section.id)
        //expect(respJoin.body.enrollment.userId).toEqual(respUser.body.user.id) can't get user id because it is not part of the response
        expect(respJoin.body.enrollment.courseId).toBeFalsy()
        
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
})