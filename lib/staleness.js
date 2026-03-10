// Staleness = hours since last meaningful event (push, review, comment).
// Drives all mood/color/animation logic.
export function getStaleness(pr) {
  return pr.lastActivityHours;
}

export function getBlockedBy(pr) {
  const reviewerMustAct = pr.reviewers.some(
    (r) => r.status === "pending" || r.status === "re_review_needed",
  );
  if (reviewerMustAct) return "reviewers";
  if (pr.reviewers.every((r) => r.status === "approved")) return "merge";
  return "author";
}

// Collect unique people across all PRs
export function getAllPeople(prs) {
  const byName = {};
  prs.forEach((pr) => {
    byName[pr.author.name] = pr.author;
    pr.reviewers.forEach((r) => {
      byName[r.name] = { name: r.name, initials: r.initials, hue: r.hue, seed: r.seed };
    });
  });
  return Object.values(byName).sort((a, b) => a.name.localeCompare(b.name));
}

// blocking: sum of staleness of PRs where this person is a pending reviewer
// blocked:  sum of staleness of PRs this person authored where reviewers are pending
// net = blocked - blocking (positive = being held up more than holding others up)
export function computeKarma(allPeople, prs) {
  const stats = {};
  allPeople.forEach((p) => {
    stats[p.name] = { person: p, blocking: 0, blocked: 0, blockingPRs: 0, blockedPRs: 0 };
  });

  prs.forEach((pr) => {
    const staleness = getStaleness(pr);
    // pending = hasn't reviewed yet; re_review_needed = dev pushed fixes, awaiting re-review
    const pendingReviewers = pr.reviewers.filter(
      (r) => r.status === "pending" || r.status === "re_review_needed",
    );
    const authorName = pr.author.name;

    pendingReviewers.forEach((r) => {
      if (stats[r.name]) {
        stats[r.name].blocking += staleness;
        stats[r.name].blockingPRs += 1;
      }
    });

    if (pendingReviewers.length > 0 && stats[authorName]) {
      stats[authorName].blocked += staleness;
      stats[authorName].blockedPRs += 1;
    }
  });

  return Object.values(stats);
}
