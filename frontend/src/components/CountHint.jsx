export default function CountHint({ charCount }) {
  if (charCount === 0) return <span className="text-xs text-slate-500">至少 10 字</span>
  if (charCount < 10) return <span className="text-xs text-slate-400">至少 10 字（还差 {10 - charCount} 字）</span>
  if (charCount > 2000) return <span className="text-xs text-red-400">超出 {charCount - 2000} 字</span>
  return <span className="text-xs text-slate-400">当前 {charCount} / 2000 字</span>
}
