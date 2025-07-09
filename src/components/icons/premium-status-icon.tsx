import type { SVGProps } from "react";

export function PremiumStatusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path
        d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 3.963 2.31 7.346 5.602 8.916l.135.061L2 22l1.167-5.717.06-.293A9.96 9.96 0 0 0 22 12c0-5.523-4.477-10-10-10Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        fill="currentColor"
      />
    </svg>
  );
}
