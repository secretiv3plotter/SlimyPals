function App() {
  return (
    <main className="app-shell">
      <section className="status-panel" aria-labelledby="app-title">
        <p className="eyebrow">Offline MVP</p>
        <h1 id="app-title">Slimy Pals</h1>
        <p className="summary">
          Local persistence is ready. The next screens can now connect to the
          IndexedDB service layer for users, slimes, food, friends, and interactions.
        </p>
      </section>
    </main>
  )
}

export default App
