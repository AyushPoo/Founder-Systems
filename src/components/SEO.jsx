import { useEffect } from 'react';

const SITE_ORIGIN = 'https://foundersystems.in';

function ensureMeta(key, value) {
    let tag = document.querySelector(`meta[${key}="${value}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(key, value);
        document.head.appendChild(tag);
    }
    return tag;
}

function ensureCanonicalLink() {
    let tag = document.querySelector('link[rel="canonical"]');
    if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', 'canonical');
        document.head.appendChild(tag);
    }
    return tag;
}

const SEO = ({ title, description, canonical, noIndex = false }) => {
    useEffect(() => {
        if (title) {
            document.title = `${title} | Founder Systems`;
        }

        if (description) {
            const metaDescription = ensureMeta('name', 'description');
            metaDescription.setAttribute('content', description);

            const metaTitle = ensureMeta('name', 'title');
            metaTitle.setAttribute('content', `${title} | Founder Systems`);

            const ogDescription = ensureMeta('property', 'og:description');
            ogDescription.setAttribute('content', description);

            const twitterDescription = ensureMeta('property', 'twitter:description');
            twitterDescription.setAttribute('content', description);
        }

        if (title) {
            const ogTitle = ensureMeta('property', 'og:title');
            ogTitle.setAttribute('content', `${title} | Founder Systems`);

            const twitterTitle = ensureMeta('property', 'twitter:title');
            twitterTitle.setAttribute('content', `${title} | Founder Systems`);
        }

        const resolvedCanonical = canonical ? `${SITE_ORIGIN}${canonical}` : SITE_ORIGIN;
        const canonicalTag = ensureCanonicalLink();
        canonicalTag.setAttribute('href', resolvedCanonical);

        const ogUrl = ensureMeta('property', 'og:url');
        ogUrl.setAttribute('content', resolvedCanonical);

        const twitterUrl = ensureMeta('property', 'twitter:url');
        twitterUrl.setAttribute('content', resolvedCanonical);

        const robots = ensureMeta('name', 'robots');
        robots.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');
    }, [title, description, canonical, noIndex]);

    return null;
};

export default SEO;
