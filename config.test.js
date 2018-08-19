const { createRobot } = require('probot')
const app = require('probot-workflow')
const fs = require('fs');

describe('app', () => {
  let robot
  let github

  const configure = async (payload) => {
    github.repos.getContent.mockImplementation(params => {
      const config = fs.readFileSync(params.path);
      return Promise.resolve({
        data: {
          content: config
        }
      })
    })
    robot.auth = () => Promise.resolve(github)
    await robot.receive({ event: 'pull_request', payload: require(payload) })
  }

  beforeEach(() => {
    robot = createRobot()
    app(robot)

    github = {
      repos: {
        getContent: jest.fn().mockReturnValue(Promise.resolve({}))
      },
      issues: {
        createComment: jest.fn()
        // TODO mock other functions, e.g edit
      }
    }
  })

  describe('create a comment after closing a pr', () => {
    it('accept', async () => {
      await configure('./fixtures/pr-closed.json')
      expect(github.issues.createComment).toHaveBeenCalled()
    })

    it('skip pr made by dependabot', async () => {
      await configure('./fixtures/pr-closed-by-dependabot.json')
      expect(github.issues.createComment).not.toHaveBeenCalled()
    })
  })
})
