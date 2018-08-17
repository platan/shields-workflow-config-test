const {createRobot} = require('probot')
const app = require('probot-workflow')

describe('app', () => {
  let robot
  let github
  const configuration = `
  on('pull_request.closed')
  .filter(context => context.payload.pull_request.merged)
  .filter(
    context =>
      context.payload.pull_request.head.ref.slice(0, 11) !== 'dependabot/'
  )
  .filter(context => context.payload.pull_request.base.ref === 'master')
  .comment(\`This pull request was merged to [{{ pull_request.base.ref }}]({{ repository.html_url }}/tree/{{ pull_request.base.ref }}) branch. Now this change is waiting for deployment. 
Deploys usually happen every few weeks. After deployment changes are copied to [gh-pages]({{ repository.html_url }}/tree/gh-pages) branch. 

This badge displays deployment status:
![](https://img.shields.io/github/commit-status/{{ repository.full_name }}/gh-pages/{{ pull_request.merge_commit_sha }}.svg?label=deploy%20status)\`)
    `; 

  const configure = async (content, payload) => {
    github.repos.getContent.mockImplementation(params => Promise.resolve({
      data: {
        content: Buffer
          .from(content)
          .toString('base64')
      }
    }))
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
        createComment: jest.fn(),
        edit: jest.fn()
      }
    }
  })

  describe.only('create a comment after closing a pr', () => {
    it('accept', async () => {
      await configure(configuration, './fixtures/pr-closed.json')
      expect(github.issues.createComment).toHaveBeenCalled()
    })

    it('skip pr made by dependabot', async () => {
      await configure(configuration, './fixtures/pr-closed-by-dependabot.json')
      expect(github.issues.createComment).not.toHaveBeenCalled()
    })
  })
})
