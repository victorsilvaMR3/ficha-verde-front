import clsx from 'clsx'

const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

const variants = {
  default: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600',
  secondary: 'bg-gray-800 text-gray-100 hover:bg-gray-700 focus-visible:ring-gray-700',
  outline: 'border border-gray-700 bg-transparent text-gray-100 hover:bg-gray-800',
  ghost: 'bg-transparent text-gray-200 hover:bg-gray-800'
}

export function Button({ variant = 'default', className, ...props }) {
  return (
    <button className={clsx(base, variants[variant], 'px-3 py-2', className)} {...props} />
  )
}


