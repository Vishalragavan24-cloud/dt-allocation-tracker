export default function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-10 w-10 border-4' : 'h-6 w-6 border-2'
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sz} rounded-full border-ibm-blue border-t-transparent animate-spin`} />
    </div>
  )
}
