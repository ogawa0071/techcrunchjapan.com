import { useNavigate } from '@tanstack/react-router'
import { useId } from 'react'

import { searchPath } from '../lib/paths'

/**
 * Title search. Without JavaScript the form submits `/?s=…` (the WordPress search URL),
 * which the server redirects to `/search/…/`.
 */
export function SearchForm({ defaultValue = '' }: { defaultValue?: string }) {
  const navigate = useNavigate()
  const id = useId()

  return (
    <form
      action="/"
      method="get"
      role="search"
      className="search-form"
      // The theme floats .search-form right at a fixed width (its header search box).
      style={{ float: 'none', width: '100%' }}
      onSubmit={(event) => {
        event.preventDefault()
        const query = new FormData(event.currentTarget).get('s')?.toString().trim()
        if (query) void navigate({ href: searchPath(query) })
      }}
    >
      {/* Markup expected by the theme CSS (bordered fieldset, absolutely positioned input). */}
      <fieldset>
        <label htmlFor={id} className="is-vishidden">
          記事タイトルを検索
        </label>
        <input
          id={id}
          type="search"
          name="s"
          defaultValue={defaultValue}
          placeholder="記事タイトルを検索"
          required
        />
      </fieldset>
    </form>
  )
}
