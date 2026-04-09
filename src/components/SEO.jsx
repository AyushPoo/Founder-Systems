import { useEffect } from 'react';

const SEO = ({ title, description, canonical }) => {
    useEffect(() => {
        // Update Title
        if (title) {
            document.title = `${title} | Founder Systems`;
        }

        // Update Description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && description) {
            metaDescription.setAttribute('content', description);
        }

        // Update Og Title
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && title) {
            ogTitle.setAttribute('content', `${title} | Founder Systems`);
        }

        // Update Canonical
        const canonicalTag = document.querySelector('link[rel="canonical"]');
        if (canonicalTag && canonical) {
            canonicalTag.setAttribute('href', `https://foundersystems.in${canonical}`);
        }
    }, [title, description, canonical]);

    return null;
};

export default SEO;
