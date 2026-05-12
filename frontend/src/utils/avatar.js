import { createAvatar } from '@dicebear/core'
import { thumbs } from '@dicebear/collection'

export function getAvatarUrl(seed) {
  const avatar = createAvatar(thumbs, { seed })
  return `data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`
}
