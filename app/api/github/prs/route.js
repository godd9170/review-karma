import { transformGitHubPR } from "@/lib/github";

const GH_API = "https://api.github.com";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  // PAT from request header, falling back to env var
  const authHeader = request.headers.get("authorization");
  const pat = authHeader?.replace(/^Bearer\s+/i, "") || process.env.GITHUB_PAT;

  const effectiveOwner = owner || process.env.GITHUB_OWNER;
  const effectiveRepo = repo || process.env.GITHUB_REPO;

  if (!effectiveOwner || !effectiveRepo || !pat) {
    return Response.json(
      { error: "Missing owner, repo, or GitHub PAT" },
      { status: 400 },
    );
  }

  const headers = {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const prsRes = await fetch(
    `${GH_API}/repos/${effectiveOwner}/${effectiveRepo}/pulls?state=open&per_page=100`,
    { headers, cache: "no-store" },
  );

  if (!prsRes.ok) {
    const err = await prsRes.json().catch(() => ({}));
    return Response.json(
      { error: err.message || "GitHub API error" },
      { status: prsRes.status },
    );
  }

  const ghPRs = await prsRes.json();

  // Fetch reviews for each PR in parallel
  const prsWithReviews = await Promise.all(
    ghPRs.map(async (pr) => {
      const reviewsRes = await fetch(
        `${GH_API}/repos/${effectiveOwner}/${effectiveRepo}/pulls/${pr.number}/reviews`,
        { headers, cache: "no-store" },
      );
      const reviews = reviewsRes.ok ? await reviewsRes.json() : [];
      return transformGitHubPR(pr, reviews);
    }),
  );

  return Response.json(prsWithReviews);
}
