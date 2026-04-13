import { Bike, Mountain, Music2, Palette, Plane, Sparkles, Trophy, UtensilsCrossed } from 'lucide-react'

export function CategoryIcon({ icon, className = 'h-3.5 w-3.5' }: { icon: 'mountain' | 'utensils' | 'music' | 'bike' | 'palette' | 'plane' | 'trophy' | 'sparkles'; className?: string }) {
  const map = {
    mountain: Mountain,
    utensils: UtensilsCrossed,
    music: Music2,
    bike: Bike,
    palette: Palette,
    plane: Plane,
    trophy: Trophy,
    sparkles: Sparkles,
  }
  const Icon = map[icon]
  return <Icon className={className} />
}
