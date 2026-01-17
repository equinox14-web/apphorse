import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 rounded-full px-6 py-3 cursor-pointer';

    // Note: We are using standard CSS classes defined in index.css, 
    // but for the reusable component we compose them here or use our custom classes.
    // Since we aren't using Tailwind, we map variants to the CSS classes we created.

    let variantClass = '';
    switch (variant) {
        case 'primary':
            variantClass = 'btn-primary';
            break;
        case 'secondary':
            variantClass = 'btn-secondary';
            break;
        case 'text':
            variantClass = 'text-primary hover:text-primary-dark underline-offset-4 hover:underline';
            break;
        default:
            variantClass = 'btn-primary';
    }

    return (
        <button
            className={`${baseStyles} ${variantClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
