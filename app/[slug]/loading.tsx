export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
      </div>
      <div className="rounded-md border">
        <div className="h-[400px] w-full bg-gray-100 animate-pulse"></div>
      </div>
    </div>
  )
}
