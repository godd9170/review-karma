import { transformGitHubPR } from "@/lib/github";

// Cache the route output server-side and revalidate in the background.
// All concurrent users share one cached response — GitHub is only called
// once per revalidation window regardless of how many tabs are open.
// CACHE_TTL_SECONDS defaults to 60; set it in env to tune.
export const revalidate = parseInt(process.env.CACHE_TTL_SECONDS ?? "60", 10);

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

  // Fetch full PR detail (includes additions/deletions) and reviews in parallel per PR.
  // The list endpoint omits additions/deletions — individual endpoint includes them.
  const prsWithReviews = await Promise.all(
    ghPRs.map(async (pr) => {
      const [detailRes, reviewsRes, headCommitRes] = await Promise.all([
        fetch(`${GH_API}/repos/${effectiveOwner}/${effectiveRepo}/pulls/${pr.number}`, { headers, cache: "no-store" }),
        fetch(`${GH_API}/repos/${effectiveOwner}/${effectiveRepo}/pulls/${pr.number}/reviews`, { headers, cache: "no-store" }),
        // git/commits/{sha} gives the exact committer date for the HEAD commit,
        // used to detect whether the author pushed after a changes_requested review.
        fetch(`${GH_API}/repos/${effectiveOwner}/${effectiveRepo}/git/commits/${pr.head.sha}`, { headers, cache: "no-store" }),
      ]);
      const detail = detailRes.ok ? await detailRes.json() : pr;
      const reviews = reviewsRes.ok ? await reviewsRes.json() : [];
      const headCommit = headCommitRes.ok ? await headCommitRes.json() : null;
      const latestCommitAt = headCommit?.committer?.date ?? null;
      return transformGitHubPR(detail, reviews, latestCommitAt);
    }),
  );

  return Response.json(prsWithReviews, {
    headers: {
      // Tell Vercel's CDN to cache at the edge and serve stale while revalidating.
      // This means zero GitHub calls for concurrent users hitting the same edge node.
      "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate * 2}`,
    },
  });
}
