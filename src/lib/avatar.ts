export const buildDicebearAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear
&skinColor=ecad80,f2d3b1&backgroundColor=ffd5dc,ffdfbf,transparent,d1d4f9,c0aede`

export const generateAvatarSeed = () =>
  `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`

export const getUserAvatarUrl = ({
  avatarUrl,
  avatarSeed,
  fallbackSeed,
}: {
  avatarUrl?: string | null
  avatarSeed?: string | null
  fallbackSeed?: string | null
}) => {
  if (avatarUrl?.trim()) return avatarUrl
  const seed = avatarSeed?.trim() || fallbackSeed?.trim() || 'zuno-user'
  return buildDicebearAvatarUrl(seed)
}
