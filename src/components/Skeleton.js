export function Bone({ className = '' }) {
  return <span className={`bone ${className}`} />;
}

export function TableSkeleton({ columns = 5, rows = 5 }) {
  return (
    <article className="card" aria-hidden="true">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {Array.from({ length: columns }, (_, index) => (
                <th key={index}><Bone className="bone--sm" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: columns }, (_, column) => (
                  <td key={column}><Bone className="bone--row" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function FormSkeleton() {
  return (
    <article className="card form-grid" aria-hidden="true">
      <Bone className="bone--field" />
      <Bone className="bone--field" />
      <Bone className="bone--field" />
      <Bone className="bone--field" />
      <Bone className="bone--button" />
    </article>
  );
}

export function PayoutSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading payout wallets">
      <article className="card"><Bone className="bone--md" /><Bone className="bone--row" /></article>
      <FormSkeleton />
      <TableSkeleton />
    </div>
  );
}

export function DepositSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading deposits">
      <article className="card"><Bone className="bone--md" /><Bone className="bone--row" /></article>
      <TableSkeleton columns={5} rows={6} />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="stats" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <article key={index}>
          <Bone className="bone--sm" />
          <Bone className="bone--lg" />
        </article>
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <article className="card" aria-hidden="true">
      <Bone className="bone--md" />
      {Array.from({ length: lines }, (_, index) => <Bone key={index} className="bone--row" />)}
    </article>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading dashboard">
      <StatSkeleton />
      <div className="split">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function ShellSkeleton() {
  return (
    <div className="shell" aria-busy="true" aria-label="Loading Token Desk">
      <aside className="side">
        <Bone className="bone--lg" />
        <Bone className="bone--row" />
        <Bone className="bone--row" />
      </aside>
      <div className="workspace">
        <header className="topbar"><Bone className="bone--md" /></header>
        <main className="page"><PayoutSkeleton /></main>
      </div>
    </div>
  );
}
