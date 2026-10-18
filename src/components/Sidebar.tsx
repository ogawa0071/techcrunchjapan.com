const adClient = 'ca-pub-8137402229295875'

// Static on purpose: AdSense rewrites the <ins> element, so it must stay out
// of hydrated islands. The interactive part is passed in as `events`.
export default function Sidebar({ events }: { events: React.ReactNode }) {
  return (
    <div className="l-sidebar">
      {events}
      <div>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
          crossOrigin="anonymous"
        ></script>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adClient}
          data-ad-slot="2189839244"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
        <script
          dangerouslySetInnerHTML={{
            __html: '(adsbygoogle = window.adsbygoogle || []).push({});',
          }}
        ></script>
      </div>
    </div>
  )
}
