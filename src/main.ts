import { BedrockRuntime } from '@aws-sdk/client-bedrock-runtime'
import { getRegion } from './getEnv'
import { reviewByAI } from './review'
import * as core from '@actions/core'
import { notOkUserStory } from './samples/samples'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const client = new BedrockRuntime({ region: getRegion() })
    const reviewdResult = await reviewByAI(client, notOkUserStory)
    core.setOutput('review_result', reviewdResult)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
