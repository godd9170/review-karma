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

export function transformGraphQLPR(node) {
  const now = Date.now();
  const openedHours = Math.round((now - new Date(node.createdAt).getTime()) / 3600000);

  // latestCommitMs: when the author last pushed. Falls back to PR creation if headRef is gone.
  const latestCommitAt = node.headRef?.target?.committedDate ?? node.createdAt;
  const latestCommitMs = new Date(latestCommitAt).getTime();
  const lastPushHours  = Math.round((now - latestCommitMs) / 3600000);

  // Group reviews by author; keep the most recent meaningful state per person.
  const reviewsByUser = {};
  (node.reviews?.nodes || []).forEach((review) => {
    const login = review.author?.login;
    if (!login) return;
    const existing = reviewsByUser[login];
    if (!existing || new Date(review.submittedAt) > new Date(existing.submittedAt)) {
      reviewsByUser[login] = review;
    }
  });

  // Build reviewer map.
  // reviewRequests = people GitHub currently expects to act (mirrors REST requested_reviewers).
  // Their previous review state (if any) determines pending vs re_review_needed.
  const reviewerMap = {};
  (node.reviewRequests?.nodes || []).forEach(({ requestedReviewer }) => {
    const login = requestedReviewer?.login;
    if (!login) return;
    const prev = reviewsByUser[login];
    let status = "pending";
    if (prev?.state === "CHANGES_REQUESTED") {
      const reviewedAtMs = new Date(prev.submittedAt).getTime();
      status = latestCommitMs > reviewedAtMs ? "re_review_needed" : "pending";
    } else if (prev?.state === "APPROVED") {
      // Approval was dismissed (branch protection) and re-review requested
      status = "re_review_needed";
    }
    reviewerMap[login] = { ...personFromLogin(login), status };
  });

  // Reviewers who completed their review and were removed from reviewRequests.
  Object.entries(reviewsByUser).forEach(([login, review]) => {
    if (reviewerMap[login]) return; // already handled above
    let status;
    if (review.state === "APPROVED") {
      status = "approved";
    } else if (review.state === "CHANGES_REQUESTED") {
      const reviewedAtMs = new Date(review.submittedAt).getTime();
      status = latestCommitMs > reviewedAtMs ? "re_review_needed" : "changes_requested";
    } else {
      status = "pending"; // DISMISSED but not re-requested
    }
    reviewerMap[login] = { ...personFromLogin(login), status };
  });

  // lastChangesRequestedHours: clock for author responsibility.
  const latestCRMs = Object.values(reviewsByUser)
    .filter((r) => r.state === "CHANGES_REQUESTED")
    .reduce((max, r) => Math.max(max, new Date(r.submittedAt).getTime()), 0);
  const lastChangesRequestedHours = latestCRMs
    ? Math.round((now - latestCRMs) / 3600000)
    : lastPushHours;

  // idleHours: time since any meaningful action by anyone — used for card display & sort.
  const latestReviewMs = Object.values(reviewsByUser)
    .reduce((max, r) => Math.max(max, new Date(r.submittedAt).getTime()), 0);
  const idleHours = Math.round((now - Math.max(latestCommitMs, latestReviewMs)) / 3600000);

  return {
    id: node.number,
    title: node.title,
    branch: node.headRefName,
    url: node.url,
    openedHours,
    idleHours,
    lastPushHours,
    lastChangesRequestedHours,
    author: personFromLogin(node.author.login),
    reviewers: Object.values(reviewerMap),
    comments: (node.comments?.totalCount || 0) + (node.reviewComments?.totalCount || 0),
    size: getPRSize(node.additions, node.deletions),
    additions: node.additions || 0,
    deletions: node.deletions || 0,
  };
}
