import { useEffect } from 'react';

const SEO = ({ title, description, canonical, image }) => {
    useEffect(() => {
        if (title) {
            document.title = `${title} | Founder Systems`;
        }

        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            }
            const ogDescription = document.querySelector('meta[property="og:description"]');
            if (ogDescription) {
                ogDescription.setAttribute('content', description);
            }
            const twitterDescription = document.querySelector('meta[name="twitter:description"]');
            if (twitterDescription) {
                twitterDescription.setAttribute('content', description);
            }
        }

        if (title) {
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) {
                ogTitle.setAttribute('content', `${title} | Founder Systems`);
            }
            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            if (twitterTitle) {
                twitterTitle.setAttribute('content', `${title} | Founder Systems`);
            }
        }

        if (image) {
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage) {
                ogImage.setAttribute('content', image.startsWith('http') ? image : `https://foundersystems.in${image}`);
            }
            const twitterImage = document.querySelector('meta[name="twitter:image"]');
            if (twitterImage) {
                twitterImage.setAttribute('content', image.startsWith('http') ? image : `https://foundersystems.in${image}`);
            }
        }

        if (canonical) {
            const canonicalTag = document.querySelector('link[rel="canonical"]');
            if (canonicalTag) {
                canonicalTag.setAttribute('href', `https://foundersystems.in${canonical}`);
            }
            const ogUrl = document.querySelector('meta[property="og:url"]');
            if (ogUrl) {
                ogUrl.setAttribute('content', `https://foundersystems.in${canonical}`);
            }
            const twitterUrl = document.querySelector('meta[name="twitter:url"]');
            if (twitterUrl) {
                twitterUrl.setAttribute('content', `https://foundersystems.in${canonical}`);
            }
        }
    }, [title, description, canonical, image]);

    return null;
};

export default SEO;
