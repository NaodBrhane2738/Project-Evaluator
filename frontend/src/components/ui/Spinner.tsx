import { Loader2 } from 'lucide-react'

export function Spinner({ size = 16, color = 'rgba(255,255,255,0.5)' }: { size?: number, color?: string }) {
  return <Loader2 size={size} color={color} className="anim-spin" />
}
