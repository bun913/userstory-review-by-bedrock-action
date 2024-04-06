# userstory-review-by-bedrock-action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

[日本語ドキュメントはこちら](./docs/README.ja.md)

This GitHub Action utilizes Amazon Bedrock's Claude 3 Sonnet
(anthropic.claude-3-sonnet-20240229-v1:0) to review user stories submitted to
it, based on the following criteria:

- Is the story written from the perspective of the requester?
- Are acceptance criteria defined and testable?
- Is the feature clearly defined and distinguishable from others?
- Does the story adhere to commonly used formats?
  - As a [type of user], I want [some goal] so that [some reason].

> [!IMPORTANT]
>
> Please note that this is currently intended for use in Japanese.

## How to use

Prerequisites

- You will use your AWS account with Bedrock (**please note that charges will
  apply**)
- You must have access to the Claude3 Sonnet model in Bedrock
  - If you can read Japanese, please refer to the following blog for guidance
  - [Trying out Claude 3 Haiku with Amazon Bedrock | DevelopersIO](https://dev.classmethod.jp/articles/claude-3-haiku-bedrock/)
- You must have IAM permissions with access to Bedrock in advance
  - If you can read Japanese, please set up your IAM role with the help of the
    following blog
    - [I don't want to set AWS credentials directly in GitHub Actions, so I want to use an IAM role | DevelopersIO](https://dev.classmethod.jp/articles/github-actions-aws-sts-credentials-iamrole/)

### Example Configuration for User Stories in GitHub Issues

For instance, by setting up your `.github/workflows/*.yml` like the following,
you can automate reviewing user stories registered as GitHub Issues, adding or
removing labels, etc.

```yml
name: User Story Review
on:
  issues:
    types: [opened, edited, reopened]

jobs:
  add-review-comment:
    if: contains(github.event.issue.labels.*.name, 'user-story')
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      issues: write

    steps:
      # Checkout the repository(Needed to access the issue body)
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      # Configure AWS Credentials
      # You need to create a role in AWS IAM and provide the ARN here
      # And allows your role to bedrock access
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      # Review User Story
      # (Issues with label 'user-story' will be reviewed by Bedrock AI)
      - name: Review User Story
        id: review
        uses: bun913/userstory-review-by-bedrock-action@v0.2.1
        with:
          bedrock_region: us-east-1
          issue_body: ${{ github.event.issue.body }}

      # Remove the 'ai-reviewed' label if it exists
      # You need to add 'ai-reviewed' label to the issue manually
      - name: Remove Reviewd Label
        if: contains(github.event.issue.labels.*.name, 'ai-reviewed')
        run: gh issue edit "$NUMBER" --remove-label "$LABELS"
        env:
          NUMBER: ${{ github.event.issue.number }}
          LABELS: 'ai-reviewed'
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Add comment to issue(Review Result will be added as a comment to the issue)
      - name: Add comment to issue
        run: gh issue comment "$NUMBER" --body "$BODY"
        env:
          NUMBER: ${{ github.event.issue.number }}
          BODY: ${{ steps.review.outputs.review_result }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # If Review is completed, add 'ai-reviewed' label to the issue
      # You need to add 'ai-reviewed' label to the issue manually
      - name: Add Label to issue
        if: contains(steps.review.outputs.review_result, 'Review Completed.')
        run: gh issue edit "$NUMBER" --add-label "$LABELS"
        env:
          NUMBER: ${{ github.event.issue.number }}
          LABELS: 'ai-reviewed'
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## For Developers

If you fork this repository and make changes, you need to set the required
repository secrets as follows:

- `AWS_ROLE_ARN`: The ARN of the IAM role that allows access to Bedrock
- `AWS_REGION`: The region where Bedrock is deployed
