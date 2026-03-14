import * as React from "react"

interface FlowPartyLogoProps {
  size?: number
  className?: string
}

export function FlowPartyLogo({ size = 24, className }: FlowPartyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id="fp-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7B68EE" />
          <stop offset="100%" stopColor="#5B4BCF" />
        </radialGradient>
        <filter id="fp-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Glow layer */}
      <circle cx="24" cy="24" r="22" fill="url(#fp-bg)" filter="url(#fp-glow)" opacity="0.5" />

      {/* Main circle */}
      <circle cx="24" cy="24" r="20" fill="url(#fp-bg)" />

      {/* Left eye — 6-pointed asterisk */}
      <g transform="translate(16, 18)">
        <line x1="0" y1="-4" x2="0" y2="4" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="-3.5" y1="-2" x2="3.5" y2="2" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="-3.5" y1="2" x2="3.5" y2="-2" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Right eye — 6-pointed asterisk */}
      <g transform="translate(32, 18)">
        <line x1="0" y1="-4" x2="0" y2="4" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="-3.5" y1="-2" x2="3.5" y2="2" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="-3.5" y1="2" x2="3.5" y2="-2" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Mouth — vertical oval */}
      <ellipse cx="24" cy="32" rx="3.5" ry="5" fill="black" />
    </svg>
  )
}
