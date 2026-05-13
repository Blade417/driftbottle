import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuContext = React.createContext({ open: false, setOpen: () => {} })

const DropdownMenuTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext)
    return (
      <button
        ref={ref}
        className={cn("outline-none", className)}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef(
  ({ className, align = "end", children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext)
    
    React.useEffect(() => {
      const handleClick = (e) => {
        if (ref?.current && !ref.current.contains(e.target)) {
          setOpen(false)
        }
      }
      if (open) {
        document.addEventListener("mousedown", handleClick)
      }
      return () => document.removeEventListener("mousedown", handleClick)
    }, [open, setOpen, ref])

    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          align === "end" ? "right-0" : "left-0",
          "absolute top-full mt-1",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef(
  ({ className, children, onClick, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext)
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
          className
        )}
        onClick={(e) => {
          onClick?.(e)
          setOpen(false)
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  )
)
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
