import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import GuideInlineVisual from '../components/guides/GuideInlineVisual';
import { guidesData } from '../data/guidesData';

function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function formatDate(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

function parseGuideMarkdown(markdown) {
    const normalized = (markdown || '').replace(/\r\n/g, '\n').trim();
    if (!normalized) {
        return { intro: '', sections: [] };
    }

    const parts = normalized.split(/\n(?=## )/);
    const intro = parts[0]?.startsWith('## ') ? '' : parts.shift() || '';

    const sections = parts
        .map((part) => {
            const [headingLine, ...rest] = part.split('\n');
            const title = headingLine.replace(/^##\s+/, '').trim();
            const content = rest.join('\n').trim();

            if (!title || !content) {
                return null;
            }

            return {
                title,
                id: slugify(title),
                content,
            };
        })
        .filter(Boolean);

    return { intro, sections };
}

const markdownComponents = {
    p: ({ children }) => (
        <p className="text-[1.06rem] font-medium leading-9 text-brand-black/82 md:text-[1.12rem]">
            {children}
        </p>
    ),
    ul: ({ children }) => (
        <ul className="space-y-4 pl-6 text-brand-black/82 marker:text-brand-orange">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="space-y-4 pl-6 text-brand-black/82 marker:font-black marker:text-brand-orange">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="pl-2 text-[1.02rem] font-medium leading-8">
            {children}
        </li>
    ),
    h3: ({ children }) => (
        <h3 className="mt-10 text-[2rem] font-black leading-[1.02] tracking-tight-brand text-brand-black md:text-[2.4rem]">
            {children}
        </h3>
    ),
    blockquote: ({ children }) => (
        <blockquote className="my-10 border-l-4 border-brand-orange pl-6 text-[1.35rem] font-medium italic leading-9 text-brand-black/76">
            {children}
        </blockquote>
    ),
    code: ({ children }) => (
        <code className="rounded-md bg-brand-black/6 px-2 py-1 text-[0.95em] font-black text-brand-orange">
            {children}
        </code>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            className="font-black text-brand-orange no-underline transition hover:text-brand-orange-dark"
        >
            {children}
        </a>
    ),
};

const GuideDetail = () => {
    const { id } = useParams();
    const [markdownData, setMarkdownData] = useState('');
    const [relatedProduct, setRelatedProduct] = useState(null);
    const [progress, setProgress] = useState(0);
    const [activeSection, setActiveSection] = useState('');

    const guide = guidesData.find((g) => g.id === id);

    const parsedGuide = useMemo(() => parseGuideMarkdown(markdownData), [markdownData]);
    const introMarkdown = parsedGuide.intro;
    const sections = parsedGuide.sections;

    useEffect(() => {
        let cancelled = false;
        window.scrollTo(0, 0);

        if (!guide) {
            return () => {
                cancelled = true;
            };
        }

        const markdownPromise = fetch(`/guides/${id}.md`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load guide');
                return res.text();
            })
            .catch((err) => {
                console.error('Error loading markdown:', err);
                return '# 404\nGuide not found or failed to load.';
            });

        const relatedProductPromise = guide.relatedProductId
            ? Promise.all([
                fetch(`/product-data/${guide.relatedProductId}.json`).then((res) => (res.ok ? res.json() : null)),
                fetch('/product-data/index.json').then((res) => (res.ok ? res.json() : [])),
            ]).then(([detail, catalog]) => {
                if (!detail) {
                    return null;
                }
                const catalogMatch = Array.isArray(catalog)
                    ? catalog.find((item) => item.id === guide.relatedProductId)
                    : null;

                return {
                    id: guide.relatedProductId,
                    ...catalogMatch,
                    ...detail,
                    thumbnail: catalogMatch?.thumbnail || detail.images?.[0] || guide.thumbnail,
                };
            })
            : Promise.resolve(null);

        Promise.all([markdownPromise, relatedProductPromise]).then(([markdown, product]) => {
            if (cancelled) {
                return;
            }
            setMarkdownData(markdown);
            setRelatedProduct(product);
        });

        return () => {
            cancelled = true;
        };
    }, [guide, id]);

    useEffect(() => {
        const onScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const nextProgress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
            setProgress(nextProgress);
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!sections.length) {
            return undefined;
        }

        const targets = sections
            .map((section) => document.getElementById(section.id))
            .filter(Boolean);

        if (!targets.length) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (visible?.target?.id) {
                    setActiveSection(visible.target.id);
                }
            },
            {
                rootMargin: '-20% 0px -60% 0px',
                threshold: [0.2, 0.35, 0.5],
            }
        );

        targets.forEach((target) => observer.observe(target));
        if (!activeSection && sections[0]) {
            setActiveSection(sections[0].id);
        }

        return () => observer.disconnect();
    }, [sections]);

    if (!guide) {
        return (
            <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
                <Navbar />
                <div className="flex-grow flex items-center justify-center p-6">
                    <div className="w-full max-w-md rounded-[28px] border-2 border-brand-black bg-white p-10 text-center shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
                        <h1 className="text-3xl font-black tracking-tight-brand text-brand-black">Guide Not Found</h1>
                        <p className="mt-4 text-base font-medium leading-7 text-brand-black/62">
                            This guide could not be found. Head back to the library to keep browsing.
                        </p>
                        <Link to="/guides" className="btn-cta mt-8 inline-block w-full text-center">
                            Back to Guides
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const currentUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/guides/${guide.id}`
        : `https://foundersystems.in/guides/${guide.id}`;

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO
                title={guide.title}
                description={guide.description}
                canonical={`/guides/${guide.id}`}
            />
            <Navbar />

            <main className="flex-grow w-full px-6 pb-20 pt-28 md:px-12 md:pt-32">
                <section className="mx-auto max-w-7xl">
                    <Link
                        to="/guides"
                        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-brand-black/58 transition hover:text-brand-orange"
                    >
                        <span aria-hidden="true">&larr;</span>
                        Back to Guides
                    </Link>

                    <div className="mt-10 grid gap-10 border-t border-brand-black/14 pt-10 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-start">
                        <div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/54">
                                <span>Founder Guide</span>
                                <span className="hidden h-4 w-px bg-brand-black/16 md:block" />
                                {guide.category ? <span>{guide.category}</span> : null}
                                <span className="hidden h-4 w-px bg-brand-black/16 md:block" />
                                {guide.lastUpdated ? <span>{formatDate(guide.lastUpdated)}</span> : null}
                                <span className="hidden h-4 w-px bg-brand-black/16 md:block" />
                                {guide.readTime ? <span>{guide.readTime}</span> : null}
                            </div>

                            <h1 className="mt-8 max-w-[13ch] text-[3.2rem] font-black leading-[0.92] tracking-tight-brand text-brand-black md:text-[5.4rem]">
                                {guide.title}
                            </h1>

                            <p className="mt-8 max-w-3xl text-[1.24rem] font-medium leading-9 text-brand-black/72 md:text-[1.5rem]">
                                {guide.description}
                            </p>

                            {guide.heroNote ? (
                                <p className="mt-8 max-w-2xl border-l-4 border-brand-orange pl-5 text-[1.03rem] font-semibold leading-8 text-brand-black/62">
                                    {guide.heroNote}
                                </p>
                            ) : null}
                        </div>

                        <div className="max-w-[340px] rounded-[30px] border-2 border-brand-black bg-white p-4 shadow-[5px_5px_0px_0px_rgba(27,28,26,1)] sm:max-w-[420px] lg:max-w-none">
                            <div className="overflow-hidden rounded-[22px] border border-brand-black/12 bg-[#f8f2ea]">
                                <img
                                    src={guide.thumbnail}
                                    alt={guide.title}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            {guide.coverTags?.length ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {guide.coverTags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-brand-black/12 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/62"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="mx-auto mt-16 max-w-7xl lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
                    <aside className="mb-14 lg:mb-0">
                        <div className="lg:sticky lg:top-28">
                            <div className="mb-6 h-3 overflow-hidden rounded-full border border-brand-black/16 bg-white">
                                <div
                                    className="h-full rounded-full bg-brand-orange transition-[width] duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="rounded-[28px] border-2 border-brand-black bg-brand-black p-6 text-white shadow-[5px_5px_0px_0px_rgba(27,28,26,1)]">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/68">
                                    Table of contents
                                </p>
                                <div className="mt-5 space-y-1">
                                    {sections.map((section) => {
                                        const isActive = activeSection === section.id;
                                        return (
                                            <a
                                                key={section.id}
                                                href={`#${section.id}`}
                                                className={`block border-t border-white/16 py-4 text-[1.02rem] font-bold leading-7 transition ${isActive ? 'text-brand-orange' : 'text-white hover:text-brand-orange'}`}
                                            >
                                                {section.title}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.14em] text-brand-black/52">
                                <a
                                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(guide.title)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-black bg-white transition hover:-translate-y-0.5"
                                    aria-label="Share on X"
                                >
                                    X
                                </a>
                                <a
                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-black bg-white transition hover:-translate-y-0.5"
                                    aria-label="Share on LinkedIn"
                                >
                                    in
                                </a>
                                <a
                                    href={`mailto:?subject=${encodeURIComponent(guide.title)}&body=${encodeURIComponent(currentUrl)}`}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-black bg-white transition hover:-translate-y-0.5"
                                    aria-label="Share by email"
                                >
                                    @
                                </a>
                            </div>
                        </div>
                    </aside>

                    <div className="min-w-0">
                        {guide.pullQuote ? (
                            <div className="mb-12 border-t border-brand-black/14 pt-10">
                                <p className="max-w-4xl text-[2.15rem] font-medium leading-[1.15] tracking-tight-brand text-brand-black md:text-[3.55rem]">
                                    {guide.pullQuote}
                                </p>
                            </div>
                        ) : null}

                        {introMarkdown ? (
                            <div className="prose prose-lg max-w-none prose-p:my-0 prose-p:mb-8">
                                <ReactMarkdown components={markdownComponents}>
                                    {introMarkdown}
                                </ReactMarkdown>
                            </div>
                        ) : null}

                        <div className="mt-4">
                            {sections.map((section, index) => (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    data-guide-section
                                    className="scroll-mt-28 border-t border-brand-black/12 py-12 first:border-t-0 first:pt-4"
                                >
                                    <div className="mb-8 flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/42">
                                        <span>{String(index + 1).padStart(2, '0')}</span>
                                        <span className="h-px flex-1 bg-brand-black/12" />
                                    </div>
                                    <h2 className="max-w-4xl text-[2.25rem] font-black leading-[0.98] tracking-tight-brand text-brand-black md:text-[4.15rem]">
                                        {section.title}
                                    </h2>
                                    <div className="prose prose-lg mt-8 max-w-none prose-p:my-0 prose-p:mb-8 prose-ul:my-8 prose-ol:my-8 prose-h3:mt-14 prose-h3:mb-6">
                                        <ReactMarkdown components={markdownComponents}>
                                            {section.content}
                                        </ReactMarkdown>
                                    </div>
                                    {guide.articleVisuals?.[index] ? (
                                        <GuideInlineVisual visual={guide.articleVisuals[index]} />
                                    ) : null}
                                </section>
                            ))}
                        </div>

                        {relatedProduct ? (
                            <section className="mt-20 border-t border-brand-black/12 pt-12">
                                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
                                    <div className="max-w-2xl">
                                        <span className="inline-flex rounded-full border border-brand-black/15 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/65">
                                            Recommended tool
                                        </span>
                                        <h3 className="mt-5 text-[2.1rem] font-black leading-[1.02] tracking-tight-brand text-brand-black md:text-[2.8rem]">
                                            Keep going with the tool that turns this idea into work.
                                        </h3>
                                        <p className="mt-4 text-[1.02rem] font-medium leading-8 text-brand-black/64">
                                            {guide.relatedProductTeaser || 'If this guide is useful, the connected Founder Systems product should make the next step easier to execute.'}
                                        </p>
                                    </div>

                                    <div className="max-w-md">
                                        <ProductCard
                                            id={relatedProduct.id}
                                            name={relatedProduct.name || relatedProduct.catalogName || relatedProduct.title}
                                            description={guide.relatedProductTeaser || relatedProduct.description || relatedProduct.catalogDescription || relatedProduct.subtitle}
                                            thumbnail={relatedProduct.thumbnail}
                                            category={relatedProduct.category}
                                            priceInr={relatedProduct.priceInr}
                                            priceUsd={relatedProduct.priceUsd}
                                            creditPrice={relatedProduct.creditPrice}
                                        />
                                    </div>
                                </div>
                            </section>
                        ) : null}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default GuideDetail;
