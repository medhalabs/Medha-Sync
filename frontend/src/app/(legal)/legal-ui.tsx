export function Updated({ date }: { date: string }) {
  return <p className="text-sm text-gray-400 mb-10">Last updated: {date}</p>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">{children}</h2>;
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-indigo-700 mt-6 mb-2">{children}</h3>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 leading-relaxed mb-4">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 leading-relaxed mb-4">{children}</ul>;
}

export function Code({ children }: { children: React.ReactNode }) {
  return <code className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">{children}</code>;
}

export function ScopeTable({ rows }: { rows: { scope: React.ReactNode; purpose: string }[] }) {
  return (
    <div className="overflow-x-auto mb-4 rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-indigo-50 text-left">
            <th className="px-4 py-2.5 font-semibold text-gray-900">Scope</th>
            <th className="px-4 py-2.5 font-semibold text-gray-900">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="px-4 py-2.5 align-top text-gray-700">{r.scope}</td>
              <td className="px-4 py-2.5 align-top text-gray-600">{r.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
