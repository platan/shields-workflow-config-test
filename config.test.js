const { createRobot } = require('probot')
const app = require('probot-workflow')
const fs = require('fs')

describe('app', () => {
  let robot
  let github
  let workflowConfiguration

  beforeAll(() => {
    workflowConfiguration = fs.readFileSync('.github/probot.js')
  })

  beforeEach(() => {
    robot = createRobot()
    app(robot)

    github = {
      repos: {
        getContent: jest.fn().mockImplementation(params => {
          return Promise.resolve({
            data: {
              content: workflowConfiguration
            }
          })
        })
      },
      issues: {
        createComment: jest.fn()
      }
    }
    robot.auth = () => Promise.resolve(github)
  })

  describe('create a comment after closing a pr', () => {
    it('accept', async () => {
      await robot.receive({ event: 'pull_request', payload: require('./fixtures/pr-closed.json') })

      expect(github.issues.createComment).toHaveBeenCalled()
    })

    it('skip pr made by dependabot', async () => {
      await robot.receive({ event: 'pull_request', payload: require('./fixtures/pr-closed-by-dependabot.json') })

      expect(github.issues.createComment).not.toHaveBeenCalled()
    })
  })
})
