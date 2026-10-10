export default function DashboardLoading() {
  return (
    <div aria-label="Loading dashboard section" aria-busy="true" className="dashboard-loading">
      <div className="loading-line loading-title" />
      <div className="loading-line loading-subtitle" />
      <div className="loading-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="loading-card" key={index} />
        ))}
      </div>
      <div className="loading-panel" />
    </div>
  )
}
