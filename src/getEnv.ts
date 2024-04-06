import * as core from '@actions/core'
import { defaultCheckList, orderMessage, rulePrompt } from './constants'

export const getRegion = (): string => {
  const region = core.getInput('bedrock_region')
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
  const checkList = core.getInput('check_list')
  if (!checkList) {
    return `<checklist>${defaultCheckList}</checklist>`
  }
  return `<checklist>${checkList}</checklist>`
}
