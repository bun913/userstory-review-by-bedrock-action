import { defaultCheckList, orderMessage, rulePrompt } from './constants'

export const getRegion = (): string => {
  const region = process.env.BEDROCK_REGION
  if (!region) {
    return 'us-east-1'
  }
  return region
}

export const getSystemPrompt = () => {
  const rule = rulePrompt
  const checkList = getCheckList()
  return `${rule}${checkList}${orderMessage}`
}

const getCheckList = (): string => {
  const checkList = process.env.CHECK_LIST
  if (!checkList) {
    return `<checklist>${defaultCheckList}</checklist>`
  }
  return `<checklist>${checkList}</checklist>`
}
