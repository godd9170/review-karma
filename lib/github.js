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
  const lastActivityHours = Math.round((now - new Date(pr.updated_at).getTime()) / 3600000);
  const latestCommitMs = latestCommitAt ? new Date(latestCommitAt).getTime() : null;

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

  // Build reviewer list: requested reviewers start as pending
  const reviewerMap = {};
  (pr.requested_reviewers || []).forEach((r) => {
    reviewerMap[r.login] = { ...personFromLogin(r.login), status: "pending" };
  });

  // Overlay actual reviews on top
  Object.entries(reviewsByUser).forEach(([login, review]) => {
    let status;
    if (review.state === "APPROVED") {
      status = "approved";
    } else if (review.state === "CHANGES_REQUESTED") {
      // If the author pushed new commits after this review was submitted,
      // the feedback has been addressed and the reviewer needs to re-review.
      const reviewedAtMs = new Date(review.submitted_at).getTime();
      status =
        latestCommitMs && latestCommitMs > reviewedAtMs
          ? "re_review_needed"
          : "changes_requested";
    } else {
      // DISMISSED — GitHub dismissed the review when branch protection required re-review
      status = "pending";
    }
    reviewerMap[login] = { ...personFromLogin(login), status };
  });

  return {
    id: pr.number,
    title: pr.title,
    branch: pr.head.ref,
    url: pr.html_url,
    openedHours,
    lastActivityHours,
    author: personFromLogin(pr.user.login),
    reviewers: Object.values(reviewerMap),
    comments: (pr.comments || 0) + (pr.review_comments || 0),
    size: getPRSize(pr.additions, pr.deletions),
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
  };
}
