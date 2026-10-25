import { Loader } from '@/components/ui/loader'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--glass) backdrop-blur-sm">
      <Loader />
    </div>
  )
}
