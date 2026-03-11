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
  return {
    name: login,
    initials,
    hue: hash % 360,
    seed: (hash % 9000) + 1000,
  };
}

function getPRSize(additions, deletions) {
  const total = (additions || 0) + (deletions || 0);
  if (total < 50) return "S";
  if (total < 200) return "M";
  if (total < 500) return "L";
  return "XL";
}

export function transformGitHubPR(pr, reviews, latestCommitAt) {
  const now = Date.now();
  const openedHours = Math.round((now - new Date(pr.created_at).getTime()) / 3600000);
  const latestCommitMs = latestCommitAt ? new Date(latestCommitAt).getTime() : new Date(pr.created_at).getTime();
  // lastPushHours: how long since the author last pushed — the clock for reviewer responsibility
  const lastPushHours = Math.round((now - latestCommitMs) / 3600000);

  // Group reviews by user, keep latest meaningful (non-COMMENTED) state per reviewer
  const reviewsByUser = {};
  (reviews || []).forEach((review) => {
    if (["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state)) {
      const existing = reviewsByUser[review.user.login];
      if (!existing || new Date(review.submitted_at) > new Date(existing.submitted_at)) {
        reviewsByUser[review.user.login] = review;
      }
    }
  });

  // Build reviewer list.
  // requested_reviewers = people GitHub considers to still need to act (GitHub removes
  // someone from this list once they review, and re-adds them if re-review is needed).
  // So: if someone is in requested_reviewers, they must act regardless of any old review.
  const reviewerMap = {};
  (pr.requested_reviewers || []).forEach((r) => {
    const prevReview = reviewsByUser[r.login];
    let status = "pending";
    if (prevReview?.state === "CHANGES_REQUESTED") {
      // They previously requested changes; dev may have addressed them
      const reviewedAtMs = new Date(prevReview.submitted_at).getTime();
      status = latestCommitMs && latestCommitMs > reviewedAtMs ? "re_review_needed" : "pending";
    } else if (prevReview?.state === "APPROVED") {
      // Their approval was dismissed (branch protection) and re-review was requested
      status = "re_review_needed";
    }
    reviewerMap[r.login] = { ...personFromLogin(r.login), status };
  });

  // Add reviewers who have completed their review and were removed from requested_reviewers
  Object.entries(reviewsByUser).forEach(([login, review]) => {
    if (reviewerMap[login]) return; // still in requested_reviewers — already handled above
    let status;
    if (review.state === "APPROVED") {
      status = "approved";
    } else if (review.state === "CHANGES_REQUESTED") {
      const reviewedAtMs = new Date(review.submitted_at).getTime();
      status = latestCommitMs && latestCommitMs > reviewedAtMs ? "re_review_needed" : "changes_requested";
    } else {
      // DISMISSED but not in requested_reviewers — shouldn't normally happen, treat as pending
      status = "pending";
    }
    reviewerMap[login] = { ...personFromLogin(login), status };
  });

  // lastChangesRequestedHours: how long since a reviewer last requested changes —
  // the clock for author responsibility. Falls back to lastPushHours if no CR review.
  const latestCRMs = Object.values(reviewsByUser)
    .filter((r) => r.state === "CHANGES_REQUESTED")
    .reduce((max, r) => Math.max(max, new Date(r.submitted_at).getTime()), 0);
  const lastChangesRequestedHours = latestCRMs
    ? Math.round((now - latestCRMs) / 3600000)
    : lastPushHours;

  // idleHours: time since the most recent meaningful action by anyone (commit or review).
  // Used for card display, mood, and sort order — irrespective of who has the ball.
  const latestReviewMs = Object.values(reviewsByUser)
    .reduce((max, r) => Math.max(max, new Date(r.submitted_at).getTime()), 0);
  const lastMeaningfulMs = Math.max(latestCommitMs, latestReviewMs);
  const idleHours = Math.round((now - lastMeaningfulMs) / 3600000);

  return {
    id: pr.number,
    title: pr.title,
    branch: pr.head.ref,
    url: pr.html_url,
    openedHours,
    idleHours,
    lastPushHours,
    lastChangesRequestedHours,
    author: personFromLogin(pr.user.login),
    reviewers: Object.values(reviewerMap),
    comments: (pr.comments || 0) + (pr.review_comments || 0),
    size: getPRSize(pr.additions, pr.deletions),
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
  };
}
