'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function ProductReviews({
  displayProduct,
  reviewsData,
  reviewStats,
  isAuthenticated,
  slug,
  refetchReviews,
  refetchStats,
}: {
  displayProduct: any;
  reviewsData: any;
  reviewStats: any;
  isAuthenticated: boolean;
  slug: string;
  refetchReviews: () => void;
  refetchStats: () => void;
}) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const addReviewMutation = trpc.review.add.useMutation({
    onSuccess: () => {
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      refetchReviews();
      refetchStats();
      alert('Review added successfully!');
    },
    onError: (err) => alert(err.message),
  });

  return (
    <div id="reviews-section" className="mt-16 border-t border-gray-100 pt-12">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Customer Reviews
          </h2>
          <div className="mt-1.5 h-1 w-12 rounded-full bg-[#85142b]" />
        </div>
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="px-5 py-2.5 rounded-full border border-[#85142b] text-[#85142b] text-sm font-semibold hover:bg-[#85142b] hover:text-white transition-colors"
        >
          Write a Review
        </button>
      </div>

      {/* Write Review Form */}
      {showReviewForm && (
        <div className="mb-10 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden transform transition-all duration-500 ease-in-out">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#85142b] to-rose-400"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-rose-50 rounded-full text-[#85142b]">
              <Star size={24} fill="currentColor" strokeWidth={0} />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-gray-900 leading-tight">Write a Review</h3>
              <p className="text-sm text-gray-500">Help others by sharing your feedback</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="bg-gray-50/80 p-8 rounded-2xl text-center border border-gray-100">
              <p className="text-base text-gray-600 mb-4 font-medium">Please log in to share your thoughts.</p>
              <Link href={`/login?redirect=/product/${slug}`} className="inline-flex items-center gap-2 px-8 py-3 bg-[#85142b] text-white rounded-full text-sm font-bold hover:bg-[#6c1023] hover:scale-105 transition-all shadow-lg shadow-[#85142b]/20">
                Login Now
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              addReviewMutation.mutate({
                productId: displayProduct.id,
                rating: reviewRating,
                title: reviewTitle,
                comment: reviewComment,
              });
            }} className="space-y-6">
              
              {/* Rating selection */}
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <label className="block text-sm font-bold text-gray-800 mb-3 text-center sm:text-left">Overall Rating</label>
                <div className="flex justify-center sm:justify-start gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`relative p-2 rounded-xl transition-all duration-300 ${
                        reviewRating >= star 
                          ? 'text-yellow-400 bg-yellow-50 scale-110 shadow-sm' 
                          : 'text-gray-300 bg-white hover:bg-gray-50 hover:text-yellow-200'
                      }`}
                    >
                      <Star size={28} fill="currentColor" strokeWidth={0} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Review Title (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#85142b]/20 focus:border-[#85142b] transition-all text-sm font-medium outline-none"
                    placeholder="Sum up your experience in one sentence"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Review Details (Optional)</label>
                  <textarea
                    rows={4}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#85142b]/20 focus:border-[#85142b] transition-all text-sm font-medium outline-none resize-none"
                    placeholder="What did you like or dislike? How did it fit?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addReviewMutation.isPending}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#85142b] text-white text-sm font-bold rounded-xl hover:bg-[#6c1023] disabled:opacity-70 transition-all shadow-lg shadow-[#85142b]/25 hover:-translate-y-0.5 flex justify-center items-center gap-2"
                >
                  {addReviewMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="grid gap-6">
        {!reviewsData || reviewsData.items.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviewsData.items.map((review: any) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex flex-shrink-0 items-center justify-center text-gray-500 font-bold uppercase text-sm overflow-hidden">
                  {review.user?.profileImage ? (
                    <Image
                      src={review.user.profileImage}
                      alt=""
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    review.user?.name?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < review.rating ? 'currentColor' : 'none'} className={i >= review.rating ? 'text-gray-200' : ''} />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {review.title && <h4 className="font-semibold text-gray-900 text-sm mt-3 mb-1">{review.title}</h4>}
              {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
