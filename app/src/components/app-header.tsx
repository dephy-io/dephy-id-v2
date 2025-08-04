import { Link, NavLink, useLocation } from 'react-router'
import { WalletUiClusterDropdown as ClusterButton, WalletUiDropdown as WalletButton } from '@wallet-ui/react'
import "@wallet-ui/tailwind/index.css";

const links = [
  { label: 'Home', path: '/' },
  { label: 'Account', path: '/account' },
  { label: 'DePHY ID', path: '/dephy-id' },
  { label: 'Stake Pool', path: '/stake-pool' },
  { label: 'Dev Tools', path: '/dev-tools' },
]

export function AppHeader() {
  const { pathname } = useLocation()

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  return (
    <header className="relative z-50 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400">
      <div className="mx-auto flex justify-between items-center">
        <div className="flex items-baseline gap-4">
          <Link to="/" className="text-xl hover:text-neutral-500 dark:hover:text-white">
            <span>DePHY ID Lite</span>
          </Link>
          <div className="md:flex items-center">
            <ul className="flex gap-4 flex-nowrap items-center">
              {links.map(({ label, path }) => (
                <li key={path}>
                  <NavLink
                    className={`hover:text-neutral-500 dark:hover:text-white ${isActive(path) ? 'text-neutral-500 dark:text-white' : ''}`}
                    to={path}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="md:flex items-center gap-4">
          <WalletButton size="sm" />
          <ClusterButton size="sm" />
        </div>
      </div>
    </header>
  )
}
