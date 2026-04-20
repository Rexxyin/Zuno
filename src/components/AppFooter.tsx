import Link from 'next/link'

export function AppFooter() {
  return (
    <footer className="border-t border-[#ede4d7] bg-[#f8f3ec] px-4 py-3 text-xs text-[#7f7065]">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center gap-4">
        <Link href="/terms" className="hover:text-[#5a3825]">Terms</Link>
        <Link href="/safety" className="hover:text-[#5a3825]">Safety</Link>
        <Link href="/report" className="hover:text-[#5a3825]">Report</Link>
      </div>
    </footer>
  )
}
