import { ExternalLink, MapPin } from 'lucide-react'

export function LocationLink({ location, googleMapsLink }: { location: string; googleMapsLink?: string | null }) {
  const mapsUrl = googleMapsLink || `https://maps.google.com/?q=${encodeURIComponent(location)}`

  return (
    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-blue-500">
      <MapPin size={14} />
      <span className="line-clamp-1">{location}</span>
      <ExternalLink size={12} />
    </a>
  )
}
