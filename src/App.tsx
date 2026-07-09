import { Widget } from '../lib/main'

export default function App() {
  return (
    <main style={{ padding: '2rem', maxWidth: 400 }}>
      <Widget title="Flowboard Widget" />
      <Widget title="Dark variant" theme="dark" />
    </main>
  )
}
