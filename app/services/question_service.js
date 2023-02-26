/*
    submission: {
        answers: {
            1: false,
            2: true,
            3: false,
            4: false,
        }
    }
*/

const getQuestionScore = function (question, submission) {
    let grade = 0
    switch(question.type) {
        case "multiple choice":
        case "multiple answer":
            grade = scoreMultipleQuestion(question, submission)
    }
    return Math.round((grade + Number.EPSILON) * 100) / 100
}

const scoreMultipleQuestion = function (question, submission) {
    const answers = submission.answers
    if (answers == null) { // no answers in the submission? The score must be 0
        return 0
    }
    const matchResults = getMatchResults(question, answers)
    const positiveFraction = 1.00/(matchResults.numTrueAnswers)
    let score = positiveFraction * matchResults.truePositives - positiveFraction * matchResults.falsePositives
    if (score < 0) score = 0
    return score
}

const getMatchResults = function (question, answers) {
    let falsePositives = 0
    let falseNegatives = 0
    let truePositives = 0
    let trueNegatives = 0
    let index = 0
    let numTrueAnswers = 0
    for (; index < Object.entries(question.answers).length; index++) {
        if (answers[index] === true && question.answers[index] === true) {
            truePositives += 1
            numTrueAnswers += 1
        }
        else if (answers[index] === true && question.answers[index] === false) {
            falsePositives += 1
        }
        else if (answers[index] === false && question.answers[index] === true) {
            falseNegatives += 1
            numTrueAnswers += 1
        }
        else {
            trueNegatives += 1
        }
    }
    return {
        falsePositives: falsePositives,
        falseNegatives: falseNegatives,
        truePositives: truePositives,
        trueNegatives: trueNegatives,
        numTrueAnswers: numTrueAnswers
    }
}

exports.getQuestionScore = getQuestionScore