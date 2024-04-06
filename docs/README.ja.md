# userstory-review-by-bedrock-action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

このGitHubアクションは、Amazon BedrockのClaude 3 Sonnet
(anthropic.claude-3-sonnet-20240229-v1:0) を使用して、以下の基準に基づいて引数で
渡されたユーザーストーリーの文章をレビューします。

- ストーリーは要求者の視点から書かれていますか？
- 受け入れ基準は定義され、テスト可能ですか？
- 機能は明確に定義され、他と区別できますか？
- ストーリーは一般的に使用されるフォーマットに従っていますか？
  - [ユーザーのタイプ]として、[ある目的]を達成したい、なぜなら[ある理由]だから。

> [!IMPORTANT]
>
> これは現在、日本語での使用を前提としています。

## 使い方

前提条件

- あなたのAWSアカウントでBedrockを使用します（**料金が発生することに注意してくだ
  さい**）
- BedrockでClaude3 Sonnetモデルを使用できる必要があります
  - 日本語が読める場合は、以下のブログを参考にしてください
  - [Amazon BedrockでClaude 3 Haikuを試してみた | DevelopersIO](https://dev.classmethod.jp/articles/claude-3-haiku-bedrock/)
- 事前にBedrockへのアクセス権限を持つIAM権限が必要です
  - 日本語が読める場合は、以下のブログを参考にIAMロールを設定してください
    - [GitHub ActionsにAWSクレデンシャルを直接設定したくないのでIAMロールを使用したい | DevelopersIO](https://dev.classmethod.jp/articles/github-actions-aws-sts-credentials-iamrole/)

### GitHubのIssueでのユーザーストーリーに対する設定例

例えば、`.github/workflows/*.yml`を以下のように設定することで、GitHubのIssueとし
て登録されたユーザーストーリーのレビューや、ラベルの追加・削除などを自動化できま
す。

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

## 開発者の方へ

このリポジトリをフォークして変更を加える場合、以下のように必要なリポジトリのシー
クレットを設定する必要があります：

- `AWS_ROLE_ARN`: Bedrockへのアクセスを許可するIAMロールのARN
- `AWS_REGION`: Bedrockを利用するリージョン（Sonnet3が利用できるリージョンである
  こと）
