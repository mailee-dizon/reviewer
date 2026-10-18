// "use client" is needed because visitors write reviews, pick filters, and vote,
// and all of that talks to the database from the browser.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpIcon, CheckIcon, LockIcon, StarIcon } from "@/components/Icons";
import type { EntertainmentItem } from "@/data/entertainment";
import {
  deleteReview,
  findMediaId,
  getReviews,
  likeReview,
  saveReview,
  unlikeReview,
  type Review,
} from "@/lib/reviews";
import { useUser } from "@/lib/supabase";

const ratingOptions = [5, 4, 3, 2, 1];

// Loads an item's reviews. An item nobody has reviewed isn't in the "media" table
// yet, so there's nothing to load in that case.
async function fetchReviews(item: EntertainmentItem): Promise<Review[]> {
  const mediaId = await findMediaId(item);
  return mediaId === null ? [] : getReviews(mediaId);
}

type ReviewsSectionProps = {
  item: EntertainmentItem;
  noun: string; // what kind of item this is, e.g. "movie" or "game"
};

export default function ReviewsSection({ item, noun }: ReviewsSectionProps) {
  const { user, loading: userLoading } = useUser();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // null means "All reviews"; otherwise only reviews with this many stars are shown.
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  // Load once we know who's signed in, and again if they sign in or out
  // (it changes which private reviews they can see).
  const userId = user?.id;
  useEffect(() => {
    if (userLoading) return;
    let cancelled = false; // ignore the answer if the page moved on meanwhile
    fetchReviews(item)
      .then((loaded) => {
        if (cancelled) return;
        setReviews(loaded);
        setError("");
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [item, userLoading, userId]);

  // Fetches the reviews again after a change, so the page matches the database.
  async function reloadReviews() {
    setReviews(await fetchReviews(item));
    setError("");
  }

  // The signed-in user's own review, if they've written one. Each person gets one
  // review per item; writing again edits it.
  const myReview = user ? reviews.find((review) => review.userId === user.id) : undefined;

  const shownReviews = reviews.filter(
    (review) => ratingFilter === null || review.rating === ratingFilter,
  );

  // Runs an action, then reloads the reviews so the page matches the database.
  async function runThenReload(action: () => Promise<void>) {
    try {
      await action();
      await reloadReviews();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSubmit(input: { rating: number; body: string; isPublic: boolean }) {
    if (!user) return;
    await saveReview(item, user.id, input); // errors are shown inside the form
    setIsWriting(false);
    setRatingFilter(null);
    await reloadReviews();
  }

  function handleDelete(review: Review) {
    if (!window.confirm("Delete your review? This can't be undone.")) return;
    runThenReload(() => deleteReview(review.id));
  }

  function handleToggleHelpful(review: Review) {
    if (!user) return;
    const hasVoted = review.likedBy.includes(user.id);
    runThenReload(() =>
      hasVoted ? unlikeReview(review.id, user.id) : likeReview(review.id, user.id),
    );
  }

  const headerButtonStyles =
    "flex-none rounded-full bg-navy px-7 py-4 text-[15px] font-medium text-cream transition hover:-translate-y-px hover:bg-navy-hover";

  return (
    <section id="reviews" className="mt-24 scroll-mt-28">
      {/* Heading and "Write a review" button */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">
            THE COMMUNITY
          </p>
          <h2 className="mb-3 text-[clamp(36px,5vw,58px)] leading-[1.02] tracking-[-0.02em]">
            Reviews for {item.title}
          </h2>
          <p className="text-[17px] text-navy-soft">
            Honest reactions from people who spent time with this {noun}.
          </p>
        </div>

        {/* Signed-out visitors sign in first, then come back to this section. */}
        {!userLoading && !user ? (
          <Link href={`/login?next=/item/${item.slug}%23reviews`} className={headerButtonStyles}>
            Sign in to write a review
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setIsWriting(!isWriting)}
            disabled={userLoading || isLoading}
            className={`${headerButtonStyles} disabled:opacity-60`}
          >
            {isWriting ? "Close review" : myReview ? "Edit your review" : "Write a review"}
          </button>
        )}
      </div>

      {isWriting && (
        // "key" makes the form start fresh if the review it's editing changes.
        <ReviewForm key={myReview?.id ?? "new"} existing={myReview} onSubmit={handleSubmit} />
      )}

      {/* Rating filter */}
      <div className="mt-10 flex flex-col gap-4 border-y border-line py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] font-medium">Filter by rating</p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={ratingFilter === null} onClick={() => setRatingFilter(null)}>
            All reviews
          </FilterChip>
          {ratingOptions.map((stars) => (
            <FilterChip
              key={stars}
              active={ratingFilter === stars}
              onClick={() => setRatingFilter(stars)}
              label={`${stars} star reviews`}
            >
              {stars}
              <span className="text-star">
                <StarIcon size={15} />
              </span>
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Reviews list, with the honor system card beside it on wide screens */}
      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-20">
        <div>
          {error && (
            <p className="mb-8 rounded-xl bg-red-50 px-5 py-4 text-[15px] text-red-800">
              Something went wrong: {error}
            </p>
          )}

          {isLoading ? (
            <p className="text-[15px] text-muted">Loading reviews…</p>
          ) : shownReviews.length === 0 ? (
            <p className="font-serif text-[22px] leading-normal text-navy-soft">
              {reviews.length === 0
                ? `No reviews yet. Be the first to share what you thought of this ${noun}.`
                : "No reviews with this rating yet."}
            </p>
          ) : (
            shownReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isMine={review.userId === user?.id}
                hasVoted={user ? review.likedBy.includes(user.id) : false}
                canVote={Boolean(user)}
                onToggleHelpful={() => handleToggleHelpful(review)}
                onEdit={() => setIsWriting(true)}
                onDelete={() => handleDelete(review)}
              />
            ))
          )}
        </div>

        <HonorSystemCard />
      </div>
    </section>
  );
}

// ----- Smaller pieces used above -----

type FilterChipProps = {
  active: boolean;
  onClick: () => void;
  label?: string; // read aloud by screen readers instead of the visible text
  children: React.ReactNode;
};

function FilterChip({ active, onClick, label, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm transition ${
        active
          ? "border-periwinkle bg-lavender text-navy"
          : "border-line text-navy-soft hover:bg-lavender-soft"
      }`}
    >
      {children}
    </button>
  );
}

// A row of 5 stars with the first "rating" of them filled in.
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-star" : "text-[#cdc8bd]"}>
          <StarIcon size={20} />
        </span>
      ))}
    </span>
  );
}

// "Maya Chen" -> "MC"
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

type ReviewCardProps = {
  review: Review;
  isMine: boolean;
  hasVoted: boolean;
  canVote: boolean; // signed-out visitors can see votes but not vote
  onToggleHelpful: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function ReviewCard({
  review,
  isMine,
  hasVoted,
  canVote,
  onToggleHelpful,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const postedDate = new Date(review.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="border-b border-line py-10 first:pt-0">
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-lavender text-[15px] font-semibold">
          {initials(review.authorName)}
        </span>
        <div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-lg font-medium">
            {review.authorName}
            {isMine && <span className="text-sm font-normal text-muted">(you)</span>}
            {!review.isPublic && (
              <span className="flex items-center gap-1 rounded-full bg-lavender-soft px-2.5 py-1 text-xs font-medium text-navy-soft">
                <LockIcon size={12} /> Private
              </span>
            )}
          </p>
          <p className="text-[15px] text-muted">Posted {postedDate}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Stars rating={review.rating} />
        <span className="text-[15px] text-navy-soft">{review.rating}/5</span>
      </div>

      {review.body && (
        <p className="mb-7 whitespace-pre-line font-serif text-[clamp(20px,2.2vw,27px)] leading-[1.5] text-navy-soft">
          {review.body}
        </p>
      )}

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={onToggleHelpful}
          disabled={!canVote}
          title={canVote ? undefined : "Sign in to vote"}
          aria-pressed={hasVoted}
          className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-[15px] transition disabled:cursor-default ${
            hasVoted
              ? "border-periwinkle bg-lavender-soft text-navy"
              : "border-line text-navy-soft enabled:hover:bg-lavender-soft"
          }`}
        >
          <ArrowUpIcon size={18} />
          Helpful · {review.likedBy.length}
        </button>
        {isMine && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="text-sm text-muted transition hover:text-navy"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-sm text-muted transition hover:text-navy"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function HonorSystemCard() {
  return (
    <aside className="rounded-[20px] border border-lavender bg-lavender-soft p-9 lg:sticky lg:top-28">
      <span className="mb-10 flex h-14 w-14 items-center justify-center rounded-full bg-lavender text-periwinkle">
        <CheckIcon size={20} />
      </span>
      <p className="mb-6 text-[13px] font-semibold tracking-[0.17em]">THE REWIND HONOR SYSTEM</p>
      <h3 className="mb-6 text-[34px] leading-tight">Real opinions rise.</h3>
      <p className="text-base leading-[1.7] text-navy-soft">
        Helpful votes recognize reviewers who consistently share honest, thoughtful perspectives.
        Trusted Voice badges are earned through community support—never purchased.
      </p>
    </aside>
  );
}

type ReviewFormProps = {
  existing?: Review; // set when editing a review instead of writing a new one
  onSubmit: (input: { rating: number; body: string; isPublic: boolean }) => Promise<void>;
};

function ReviewForm({ existing, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [isPublic, setIsPublic] = useState(existing?.isPublic ?? true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  // A rating is required; the written part is optional.
  const canSubmit = rating > 0 && !isPosting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsPosting(true);
    setError("");
    try {
      await onSubmit({ rating, body: body.trim(), isPublic });
    } catch (err) {
      setError((err as Error).message);
      setIsPosting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 rounded-[24px] border border-line bg-paper p-6 shadow-[0_18px_40px_rgba(23,35,61,0.06)] sm:p-12"
    >
      <div className="mb-8 flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
        {/* Star rating */}
        <fieldset>
          <legend className="mb-4 text-[13px] font-semibold tracking-[0.17em]">YOUR RATING</legend>
          <div className="flex items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                aria-pressed={rating === star}
                className={`transition hover:scale-110 ${
                  star <= (hoverRating || rating) ? "text-star" : "text-[#cdc8bd]"
                }`}
              >
                <StarIcon size={42} />
              </button>
            ))}
            {rating > 0 && <span className="ml-3 text-[15px] text-navy-soft">{rating}/5</span>}
          </div>
        </fieldset>

        {/* Public / Private switch */}
        <fieldset>
          <legend className="mb-4 text-[13px] font-semibold tracking-[0.17em]">WHO CAN SEE IT?</legend>
          <div className="inline-flex rounded-full bg-lavender-soft p-1.5">
            <VisibilityOption selected={isPublic} onClick={() => setIsPublic(true)}>
              Public
            </VisibilityOption>
            <VisibilityOption selected={!isPublic} onClick={() => setIsPublic(false)}>
              <LockIcon /> Private
            </VisibilityOption>
          </div>
        </fieldset>
      </div>

      <label className="mb-8 block">
        <span className="sr-only">Your review</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="Share what felt memorable, surprising, or worth knowing…"
          className="w-full resize-y rounded-[18px] border border-line bg-cream/40 px-6 py-5 text-lg leading-relaxed text-navy outline-none transition placeholder:text-muted focus:border-periwinkle sm:text-[22px]"
        />
      </label>

      {error && (
        <p className="mb-6 rounded-xl bg-red-50 px-5 py-4 text-[15px] text-red-800">
          Your review couldn&apos;t be posted: {error}
        </p>
      )}

      <div className="flex flex-col-reverse justify-between gap-5 sm:flex-row sm:items-center">
        <p className="text-[15px] text-navy-soft">
          {isPublic
            ? "Your review will appear in the public community feed."
            : "Only you will be able to see this review."}
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          title={rating > 0 ? undefined : "Pick a star rating first"}
          className="self-end rounded-full bg-navy px-8 py-4 text-[17px] font-medium text-cream transition hover:-translate-y-px hover:bg-navy-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:self-auto"
        >
          {isPosting ? "Posting…" : existing ? "Update review" : "Post review"}
        </button>
      </div>
    </form>
  );
}

type VisibilityOptionProps = {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function VisibilityOption({ selected, onClick, children }: VisibilityOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-2 rounded-full px-6 py-3 text-[17px] transition ${
        selected
          ? "bg-paper text-navy shadow-[0_2px_8px_rgba(23,35,61,0.08)]"
          : "text-navy-soft hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}
