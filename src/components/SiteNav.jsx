import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NAV_ITEMS, ROUTES } from '../lib/routes'
import { goToPage } from '../lib/navigation'

function isHomePath() {
  const path = window.location.pathname
  return path === '/' || path.endsWith('/') || path.endsWith('index.html')
}

export default function SiteNav({ active = 'home', bordered = false, onNavigate }) {
  const [open, setOpen] = useState(false)

  const handleNav = (event, href) => {
    if (href === ROUTES.home && isHomePath()) {
      event.preventDefault()
      setOpen(false)
      return
    }
    onNavigate?.()
    goToPage(event, href)
    setOpen(false)
  }

  const shellClass = bordered ? 'site-nav site-nav-bordered' : 'site-nav'

  return (
    <>
      <nav className={shellClass}>
        <a
          href={ROUTES.home}
          className="site-nav-brand"
          onClick={(e) => handleNav(e, ROUTES.home)}
        >
          yiyisa&apos;s space
        </a>
        <div className="site-nav-links">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={active === item.key ? 'is-active' : ''}
              onClick={(e) => handleNav(e, item.href)}
            >
              {item.label}
            </a>
          ))}
        </div>
        <button
          type="button"
          className="site-nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <div className={`site-nav-mobile ${open ? 'is-open' : ''}`}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className={active === item.key ? 'is-active' : ''}
            onClick={(e) => handleNav(e, item.href)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </>
  )
}
