import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'

/** Shown for loader / server-function failures (e.g. the database is unavailable). */
export function ErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter()
  const retry = () => {
    // Reload the failed loaders, then clear the error boundary.
    void router.invalidate().then(reset)
  }

  return (
    <div role="main" className="fluid">
      <div className="lc lc-padding" style={{ padding: '3em 1em' }}>
        <h1 className="alpha">エラーが発生しました</h1>
        <p>しばらくしてから再度お試しください。</p>
        <p>
          <button type="button" onClick={retry}>
            再読み込み
          </button>{' '}
          <Link to="/" activeOptions={{ exact: true }}>
            トップページへ戻る
          </Link>
        </p>
      </div>
    </div>
  )
}
