import { Loader2 } from 'lucide-react'

export function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="animate-spin" size={16} />
    </div>
  )
}
