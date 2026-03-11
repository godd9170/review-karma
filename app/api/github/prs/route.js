import { transformGraphQLPR } from "@/lib/github";

// Cache the route output server-side; all users share one GitHub fetch per window.
// Must be a static literal — Next.js reads segment config at build time.
export const revalidate = 60;

// Single GraphQL query replaces 1 + (N × 3) REST calls with 1 call total.
// With 50 open PRs the old approach used ~151 API calls per revalidation;
// this uses 1, keeping us well inside GitHub's 5000 req/hr limit.
const QUERY = `
  query OpenPRs($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(states: OPEN, first: 100) {
        nodes {
          number
          title
          headRefName
          url
          createdAt
          additions
          deletions
          author { login }
          comments { totalCount }
          headRef {
            target {
              ... on Commit { committedDate }
            }
          }
          reviewRequests(first: 20) {
            nodes {
              requestedReviewer {
                ... on User { login }
              }
            }
          }
          reviews(first: 100, states: [APPROVED, CHANGES_REQUESTED, DISMISSED]) {
            nodes {
              author { login }
              state
              submittedAt
            }
          }
        }
      }
    }
  }
`;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner") || process.env.GITHUB_OWNER;
  const repo  = searchParams.get("repo")  || process.env.GITHUB_REPO;

  const authHeader = request.headers.get("authorization");
  const pat = authHeader?.replace(/^Bearer\s+/i, "") || process.env.GITHUB_PAT;

  if (!owner || !repo || !pat) {
    return Response.json({ error: "Missing owner, repo, or GitHub PAT" }, { status: 400 });
  }

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query: QUERY, variables: { owner, repo } }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return Response.json({ error: err.message || "GitHub API error" }, { status: res.status });
  }

  const { data, errors } = await res.json();
  if (errors?.length) {
    return Response.json({ error: errors[0].message }, { status: 500 });
  }

  const prs = (data.repository.pullRequests.nodes || []).map(transformGraphQLPR);

  return Response.json(prs, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
