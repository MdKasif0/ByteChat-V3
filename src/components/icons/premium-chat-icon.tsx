
import type { SVGProps } from "react";

export function PremiumChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5a.75.75 0 0 0 .75.75h.75v2.25a.75.75 0 0 0 1.28.53L8.72 15.5h6.53a.75.75 0 0 0 .75-.75v-8.5a.75.75 0 0 0-.75-.75h-11Zm15.5 0a.75.75 0 0 0-.75.75v8.5a.75.75 0 0 0 .75.75H21v2.25a.75.75 0 0 0 1.28.53L24.72 15.5H25a.75.75 0 0 0 .75-.75v-8.5a.75.75 0 0 0-.75-.75h-5.25Z"
        clipRule="evenodd"
        opacity={0.4}
      />
      <path d="M8.25 2.5a.75.75 0 0 0-.75.75v8.5a.75.75 0 0 0 .75.75h10.5a.75.75 0 0 0 .75-.75v-8.5a.75.75 0 0 0-.75-.75h-10.5Z" />
    </svg>
  );
}
