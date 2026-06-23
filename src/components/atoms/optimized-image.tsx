import type { ImgHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type OptimizedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  cloudinaryWidth?: number
  cloudinaryQuality?: 'auto' | number
}

export function OptimizedImage({
  alt,
  className,
  cloudinaryQuality = 'auto',
  cloudinaryWidth,
  loading = 'lazy',
  src,
  ...props
}: OptimizedImageProps) {
  return (
    <img
      alt={alt}
      className={cn('bg-muted object-cover', className)}
      decoding="async"
      loading={loading}
      src={getOptimizedSrc(src, cloudinaryWidth, cloudinaryQuality)}
      {...props}
    />
  )
}

function getOptimizedSrc(src: string | undefined, width?: number, quality: 'auto' | number = 'auto') {
  if (!src || !src.includes('res.cloudinary.com') || src.includes('/upload/f_')) {
    return src
  }

  const transforms = [`f_auto`, `q_${quality}`]

  if (width) {
    transforms.push(`w_${width}`, 'c_limit')
  }

  return src.replace('/upload/', `/upload/${transforms.join(',')}/`)
}
