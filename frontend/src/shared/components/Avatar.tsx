type AvatarProps = {
  name: string
  imageUrl?: string
}

export function Avatar({ name, imageUrl }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .filter((_, index, parts) => index === 0 || index === parts.length - 1)
    .join('')
    .toLocaleUpperCase('vi-VN')

  return imageUrl ? (
    <img
      alt={name}
      className="size-9 rounded-full object-cover"
      src={imageUrl}
    />
  ) : (
    <span
      aria-label={name}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700"
      role="img"
    >
      {initials}
    </span>
  )
}
