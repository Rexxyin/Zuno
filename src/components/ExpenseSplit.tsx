import { Expense } from '@/lib/types'

export function ExpenseSplit({ expenses }: { expenses: Expense[] }) {
  return (
    <section className="space-y-2 rounded-xl border bg-white p-4">
      <h3 className="font-semibold">Expenses</h3>
      {expenses.map((e) => (
        <div key={e.id} className="flex justify-between text-sm">
          <span>{e.label}</span>
          <span>₹{Number(e.total_amount).toFixed(0)}</span>
        </div>
      ))}
    </section>
  )
}
