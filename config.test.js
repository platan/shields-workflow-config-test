const { createRobot } = require('probot')
const app = require('probot-workflow')
const fs = require('fs');

describe('app', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot()
    app(robot)

    robot.auth = () => Promise.resolve(github)
    github = {
      repos: {
        getContent: jest.fn().mockImplementation(params => {
          const config = fs.readFileSync(params.path);
          return Promise.resolve({
            data: {
              content: config
            }
          })
        })
      },
      issues: {
        createComment: jest.fn()
        // TODO mock other functions, e.g edit
      }
    }
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
