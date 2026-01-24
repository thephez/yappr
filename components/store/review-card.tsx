'use client'

import { motion } from 'framer-motion'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { formatDate } from '@/lib/utils/format'
import type { StoreReview } from '@/lib/types'

interface ReviewCardProps {
  review: StoreReview
  index?: number
}

export function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />)
      } else {
        stars.push(<StarIcon key={i} className="h-5 w-5 text-gray-300" />)
      }
    }
    return stars
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex">{renderStars(review.rating)}</div>
        <span className="text-sm text-gray-500">
          {formatDate(review.createdAt)}
        </span>
      </div>
      {review.title && (
        <h4 className="font-medium mb-1">{review.title}</h4>
      )}
      {review.content && (
        <p className="text-gray-600 dark:text-gray-400">{review.content}</p>
      )}
    </motion.div>
  )
}
