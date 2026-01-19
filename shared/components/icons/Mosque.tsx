import React from 'react';

export const Mosque = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M12 2.5c3 0 4.5 3 4.5 5.5H7.5c0-2.5 1.5-5.5 4.5-5.5z" />
        <path d="M4 21h16" />
        <path d="M6 21v-9" />
        <path d="M18 21v-9" />
        <path d="M7 21v-8h10v8" />
        <circle cx="12" cy="5" r="0.5" fill="currentColor" />
    </svg>
);
