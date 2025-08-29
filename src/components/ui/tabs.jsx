import { useState } from 'react'
import clsx from 'clsx'

export function Tabs({ value, onValueChange, children }) {
  return <div>{children}</div>
}

export function TabsList({ children, className }) {
  return <div className={clsx('inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-700', className)}>{children}</div>
}

export function TabsTrigger({ value, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        active ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ hidden, children, className }) {
  if (hidden) return null
  return <div className={clsx('mt-3', className)}>{children}</div>
}


