export function YouTubeMark({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.582 6.186a2.752 2.752 0 0 0-1.936-1.949C17.938 3.75 12 3.75 12 3.75s-5.938 0-7.646.487A2.752 2.752 0 0 0 2.418 6.186C1.93 7.905 1.93 12 1.93 12s0 4.095.488 5.814a2.752 2.752 0 0 0 1.936 1.949C6.062 20.25 12 20.25 12 20.25s5.938 0 7.646-.487a2.752 2.752 0 0 0 1.936-1.949C22.07 16.095 22.07 12 22.07 12s0-4.095-.488-5.814ZM9.93 15.53V8.47L16.12 12l-6.19 3.53Z"
        fill="currentColor"
      />
    </svg>
  );
}
