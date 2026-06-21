import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
relative
overflow-hidden

rounded-[28px]

border
border-white/10

bg-gradient-to-br
from-card
via-card
to-card/90

backdrop-blur-xl

shadow-[0_20px_80px_rgba(0,0,0,.18)]

transition-all
duration-300

hover:-translate-y-[2px]
hover:shadow-[0_30px_100px_rgba(0,0,0,.24)]

before:absolute
before:inset-0
before:bg-[linear-gradient(180deg,rgba(255,255,255,.05),transparent)]
before:pointer-events-none

after:absolute
after:right-[-80px]
after:top-[-80px]
after:h-[180px]
after:w-[180px]
after:rounded-full
after:bg-primary/5
after:blur-3xl
after:pointer-events-none
      `,
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
relative
z-10

flex
flex-col

gap-2

px-7
pt-7
pb-4
`,
        className,
      )}
      {...props}
    />
  ),
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
text-lg
font-semibold
tracking-tight
      `,
        className,
      )}
      {...props}
    />
  ),
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
text-sm
text-muted-foreground
leading-6
      `,
        className,
      )}
      {...props}
    />
  ),
);

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
relative
z-10

px-7
pb-7
`,
        className,
      )}
      {...props}
    />
  ),
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        `
relative
z-10

flex
items-center

px-7
pb-7
`,
        className,
      )}
      {...props}
    />
  ),
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
