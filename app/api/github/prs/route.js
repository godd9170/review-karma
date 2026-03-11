import { transformGraphQLPR } from "@/lib/github";

// Single GraphQL call per revalidation vs ~151 REST calls.
// At 120s TTL: 30 revalidations/hr × 1 = 30 calls/hr — well within GitHub's 5,000/hr limit.
export const revalidate = 120;

const QUERY = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
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
                ... on Team { slug }
              }
            }
          }
          reviews(first: 100) {
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
    body: JSON.stringify({ query: QUERY, variables: { owner, name: repo } }),
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

  const prs = (data?.repository?.pullRequests?.nodes || []).map(transformGraphQLPR);

  return Response.json(prs, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=240" },
  });
}
