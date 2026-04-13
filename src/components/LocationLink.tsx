import { ExternalLink, MapPin } from 'lucide-react'

export function LocationLink({ location }: { location: string }) {
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(location)}`
  return (
    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium">
      <MapPin size={14} />
      <span>{location}</span>
      <ExternalLink size={12} className="text-zinc-500" />
    </a>
  )
}
