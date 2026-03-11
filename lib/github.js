// Deterministically derive hue/seed from a GitHub username
function hashStr(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function personFromLogin(login) {
  const hash = hashStr(login);
  const initials = login
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2) || login.slice(0, 2).toUpperCase();
  return { name: login, initials, hue: hash % 360, seed: (hash % 9000) + 1000 };
}

function getPRSize(additions, deletions) {
  const total = (additions || 0) + (deletions || 0);
  if (total < 50)  return "S";
  if (total < 200) return "M";
  if (total < 500) return "L";
  return "XL";
}

// pr       = REST PR detail object (GET /repos/:owner/:repo/pulls/:number)
// reviews  = REST reviews array (GET /repos/:owner/:repo/pulls/:number/reviews)
// latestCommitAt = ISO date string from git/commits/{sha} committer.date, or null
export function transformGitHubPR(pr, reviews, latestCommitAt) {
  const now = Date.now();
  const openedHours = Math.round((now - new Date(pr.created_at).getTime()) / 3600000);

  // latestCommitMs: when the author last pushed.
  const latestCommitMs = new Date(latestCommitAt ?? pr.created_at).getTime();
  const lastPushHours  = Math.round((now - latestCommitMs) / 3600000);

  // Group reviews by author; keep the most recent meaningful state per person.
  const reviewsByUser = {};
  (reviews || []).forEach((review) => {
    const login = review.user?.login;
    if (!login) return;
    const existing = reviewsByUser[login];
    if (!existing || new Date(review.submitted_at) > new Date(existing.submitted_at)) {
      reviewsByUser[login] = review;
    }
  });

  // Build reviewer map.
  // requested_reviewers is authoritative — GitHub removes people once reviewed,
  // re-adds if re-review is needed.
  const reviewerMap = {};
  (pr.requested_reviewers || []).forEach(({ login }) => {
    if (!login) return;
    const prev = reviewsByUser[login];
    let status = "pending";
    if (prev?.state === "CHANGES_REQUESTED") {
      const reviewedAtMs = new Date(prev.submitted_at).getTime();
      status = latestCommitMs > reviewedAtMs ? "re_review_needed" : "pending";
    } else if (prev?.state === "APPROVED") {
      // Approval was dismissed (branch protection) and re-review requested
      status = "re_review_needed";
    }
    reviewerMap[login] = { ...personFromLogin(login), status };
  });

  // Reviewers who completed their review and were removed from requested_reviewers.
  Object.entries(reviewsByUser).forEach(([login, review]) => {
    if (reviewerMap[login]) return; // already handled above
    let status;
    if (review.state === "APPROVED") {
      status = "approved";
    } else if (review.state === "CHANGES_REQUESTED") {
      const reviewedAtMs = new Date(review.submitted_at).getTime();
      status = latestCommitMs > reviewedAtMs ? "re_review_needed" : "changes_requested";
    } else {
      status = "pending"; // DISMISSED but not re-requested
    }
    reviewerMap[login] = { ...personFromLogin(login), status };
  });

  // lastChangesRequestedHours: clock for author responsibility.
  const latestCRMs = Object.values(reviewsByUser)
    .filter((r) => r.state === "CHANGES_REQUESTED")
    .reduce((max, r) => Math.max(max, new Date(r.submitted_at).getTime()), 0);
  const lastChangesRequestedHours = latestCRMs
    ? Math.round((now - latestCRMs) / 3600000)
    : lastPushHours;

  // idleHours: time since any meaningful action by anyone — used for card display & sort.
  const latestReviewMs = Object.values(reviewsByUser)
    .reduce((max, r) => Math.max(max, new Date(r.submitted_at).getTime()), 0);
  const idleHours = Math.round((now - Math.max(latestCommitMs, latestReviewMs)) / 3600000);

  return {
    id: pr.number,
    title: pr.title,
    branch: pr.head?.ref,
    url: pr.html_url,
    openedHours,
    idleHours,
    lastPushHours,
    lastChangesRequestedHours,
    author: personFromLogin(pr.user.login),
    reviewers: Object.values(reviewerMap),
    comments: pr.comments || 0,
    size: getPRSize(pr.additions, pr.deletions),
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
  };
}
