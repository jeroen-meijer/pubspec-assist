import { open } from "openurl";

export type GitIssueContent = { title: string; body: string };

export function generateNewGitIssueUrl(content: GitIssueContent) {
  const url: string = `https://github.com/jeroen-meijer/pubspec-assist/issues/new?title=${content.title}&body=${content.body}`;
  return url;
}

export function generateNewGitIssueContent(error: Error): GitIssueContent {
  let title: string = `Bug Report: ${error.message}`;

  let body: string = `
# Bug Report

## Description

<!-- If you want to give a brief description of the error, please do so here. -->

## Steps to Reproduce

<!-- Please tell me exactly how to reproduce the problem you are running into. -->

1. ...
2. ...
3. ...

## Exception Info

**Type:** \`${(typeof error).toString()}\`

**Name:** \`${error.name}\`

**Message:** \`${error.message}\`

**Stack:**

\`\`\`
${error.stack}
\`\`\`
`;

  return { title, body };
}

export function openNewGitIssueUrl(error: Error) {
  open(generateNewGitIssueUrl(generateNewGitIssueContent(error)));
}
