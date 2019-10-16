const core = require('@actions/core')
const github = require('@actions/github')
const context = github.context

const githubToken = core.getInput('github-token')
const task = core.getInput('task')
const auto_merge = core.getInput('auto_merge')
const required_contexts = core.getInput('required_contexts')
const payload = core.getInput('payload')
const environment = core.getInput('environment')
const description = core.getInput('description')
const transient_environment = core.getInput('transient_environment')
const production_environment = core.getInput('production_environment')
  || environment === 'production'
const state = core.getInput('state')
const log_url = core.getInput('log_url')
const deployment_id = core.getInput('deployment_id')

const octokit = new github.GitHub(githubToken)

async function run () {
  if (deployment_id) {
    console.log('deployment id is exists, update deployment')
    const {
      data: deployment,
    } = await octokit.repos.getDeployment({
      ...context.repo, deployment_id: deployment_id,
    })
    if (deployment) {
      const { data: created } = await createDeploymentStatus(deployment_id)
      context.setOutput('deployment-id', created.id)
      context.setOutput('deployment-url', created.url)
    } else {
      console.error(`deployment not found : ${deployment_id}`)
      context.setFailed('`deployment not found : ${deploymentId}`')
    }
  } else {
    console.log('deployment id is not exists, create deployment')
    const { data: deployment } = await octokit.repos.createDeployment({
      ...context.repo,
      ref: context.ref,
      task: task,
      auto_merge: auto_merge,
      required_contexts: [],
      environment: environment,
      description: description,
      transient_environment: transient_environment,
      production_environment: production_environment,
    })
    context.setOutput('deployment-id', deployment.id)
    context.setOutput('deployment-url', deployment.url)
    if (state) {
      await createDeploymentStatus(deployment.id)
    }
  }
}

async function createDeploymentStatus (id) {
  return await octokit.repos.createDeploymentStatus({
    ...context.repo,
    deployment_id: id,
    state: state,
    log_url: log_url,
    description: description,
    environment: environment,
  })
}

run()
