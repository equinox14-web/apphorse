import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SEO({
    title,
    description,
    keywords,
    image = '/Logo_equinox.png',
    type = 'website',
    structuredData,
    noIndex = false
}) {
    const { i18n } = useTranslation();
    const location = useLocation();
    const siteUrl = 'https://horse-equinox.com';
    const currentUrl = `${siteUrl}${location.pathname}`;
    const defaultTitle = 'Equinox - Gestion équestre moderne';
    const defaultDescription = 'Gérez vos écuries, chevaux et élevages avec simplicité et efficacité grâce à Equinox.';
    const pageTitle = title ? `${title} | Equinox` : defaultTitle;

    return (
        <Helmet htmlAttributes={{ lang: i18n.language }}>
            {/* Standard Metadata */}
            <title>{pageTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={`${siteUrl}${image}`} />
            <meta property="og:site_name" content="Equinox" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={description || defaultDescription} />
            <meta name="twitter:image" content={`${siteUrl}${image}`} />

            {/* Structured Data (JSON-LD) for AI & Search Engines */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}

            {/* Default Organization Structured Data */}
            {!structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Equinox",
                        "applicationCategory": "BusinessApplication",
                        "operatingSystem": "Web",
                        "description": defaultDescription,
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "EUR"
                        }
                    })}
                </script>
            )}
        </Helmet>
    );
}
