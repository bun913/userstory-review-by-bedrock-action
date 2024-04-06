import type { BedrockRuntime } from '@aws-sdk/client-bedrock-runtime'
import { getSystemPrompt } from './getEnv'

export const reviewByAI = async (client: BedrockRuntime, userStory: string) => {
  const res = await client.invokeModel({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      temperature: 0.5,
      max_tokens: 5000,
      system: getSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `<userstory>${userStory}</userstory>`
            }
          ]
        }
      ]
    }),
    accept: 'application/json',
    contentType: 'application/json'
  })

  const body = Buffer.from(res.body).toString('utf-8')
  const bodyObj = JSON.parse(body)
  return bodyObj.content[0].text
}
