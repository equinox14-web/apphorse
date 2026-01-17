import React from 'react';

const Card = ({ children, className = '', title, accent = false, style = {}, ...props }) => {
    // Merge accent style if needed
    const finalStyle = {
        padding: '1.5rem',
        ...(accent ? { borderLeft: '4px solid var(--color-accent)' } : {}),
        ...style
    };

    return (
        <div
            className={`glass-panel ${className}`}
            style={finalStyle}
            {...props}
        >
            {(title || props.action) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    {title && (
                        <h3 style={{ margin: 0, color: accent ? 'var(--color-accent)' : 'inherit', fontWeight: 600 }}>
                            {title}
                        </h3>
                    )}
                    {props.action && <div>{props.action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;
