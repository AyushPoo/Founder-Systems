import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { guidesData } from '../data/guidesData';

const previewLabels = ['Live KPI dashboard', 'Model inputs', 'Scenario planning'];

const GuideDetail = () => {
    const { id } = useParams();
    const [markdownData, setMarkdownData] = useState('');
    const [relatedProduct, setRelatedProduct] = useState(null);

    const guide = guidesData.find((g) => g.id === id);

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

    const previewImages = relatedProduct?.images?.slice(1, 3) || [];

    return (
        <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
            <SEO
                title={guide.title}
                description={guide.description}
                canonical={`/guides/${guide.id}`}
            />
            <Navbar />

            <main className="flex-grow w-full px-6 py-32 md:px-12">
                <section className="mx-auto max-w-[980px]">
                    <Link
                        to="/guides"
                        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-brand-black/58 transition hover:text-brand-orange"
                    >
                        <span aria-hidden="true">&larr;</span>
                        Back to Guides
                    </Link>

                    <div className="mt-8">
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/52">
                            <span className="rounded-full border border-brand-black/15 bg-white px-3 py-1">Founder Guide</span>
                            {guide.category ? (
                                <span className="rounded-full border border-brand-black/15 bg-brand-cream px-3 py-1">{guide.category}</span>
                            ) : null}
                            {guide.readTime ? <span>{guide.readTime}</span> : null}
                        </div>

                        <h1 className="mt-5 max-w-[13ch] text-4xl font-black leading-[0.94] tracking-tight-brand text-brand-black md:text-6xl">
                            {guide.title}
                        </h1>

                        <p className="mt-5 max-w-[760px] text-lg font-medium leading-8 text-brand-black/68 md:text-[1.35rem]">
                            {guide.description}
                        </p>

                        {guide.coverSubtitle ? (
                            <p className="mt-4 max-w-[680px] text-[15px] font-semibold leading-7 text-brand-black/54 md:text-base">
                                {guide.coverSubtitle}
                            </p>
                        ) : null}
                    </div>

                    <div className="mt-10 overflow-hidden rounded-[32px] border-2 border-brand-black bg-white shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
                        <img
                            src={guide.thumbnail}
                            alt={guide.title}
                            className="w-full object-cover"
                        />
                    </div>
                </section>

                {previewImages.length > 0 ? (
                    <section className="mx-auto mt-16 max-w-[980px]">
                        <div className="mb-5 flex items-center gap-3">
                            <span className="inline-flex rounded-full border border-brand-black/15 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/65">
                                Related visuals
                            </span>
                            <p className="text-sm font-semibold text-brand-black/56">
                                A quick look at the model or workspace this guide connects to.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {previewImages.map((image, index) => (
                                <div
                                    key={image}
                                    className="overflow-hidden rounded-[28px] border-2 border-brand-black bg-white shadow-[5px_5px_0px_0px_rgba(27,28,26,1)]"
                                >
                                    <div className="relative aspect-[16/10] border-b-2 border-brand-black bg-brand-black">
                                        <img
                                            src={image}
                                            alt={`${guide.title} preview ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_45%,rgba(15,23,42,0.24)_100%)]" />
                                    </div>
                                    <div className="px-5 py-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/42">
                                            Visual preview
                                        </p>
                                        <p className="mt-2 text-base font-bold leading-6 text-brand-black">
                                            {previewLabels[index] || 'Working model preview'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}

                <article className="prose prose-lg mx-auto mt-[4.5rem] max-w-[760px] prose-headings:font-black prose-headings:tracking-tight-brand prose-headings:text-brand-black prose-h2:mt-14 prose-h2:text-[2rem] prose-h2:leading-[1.04] prose-h3:mt-10 prose-h3:text-[1.5rem] prose-h3:leading-[1.12] prose-p:text-brand-black/82 prose-p:font-medium prose-p:leading-8 prose-li:text-brand-black/82 prose-li:leading-8 prose-li:marker:text-brand-orange prose-ol:text-brand-black/82 prose-ul:text-brand-black/82 prose-hr:my-12 prose-hr:border-brand-black/12 prose-a:text-brand-orange prose-a:font-black prose-a:no-underline hover:prose-a:text-brand-orange-dark prose-strong:text-brand-black prose-strong:font-black prose-code:text-brand-orange prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{markdownData}</ReactMarkdown>
                </article>

                {relatedProduct ? (
                    <section className="mx-auto mt-20 max-w-[980px] border-t border-brand-black/12 pt-12">
                        <div className="mb-8 max-w-[560px]">
                            <span className="inline-flex rounded-full border border-brand-black/15 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/65">
                                Recommended tool
                            </span>
                            <h3 className="mt-4 text-3xl font-black tracking-tight-brand text-brand-black">
                                Go deeper with the product behind this guide.
                            </h3>
                            <p className="mt-3 text-base font-medium leading-7 text-brand-black/62">
                                If this topic matters right now, the connected Founder Systems tool should save you time on the next step.
                            </p>
                        </div>

                        <div className="max-w-md">
                            <ProductCard
                                id={relatedProduct.id}
                                name={relatedProduct.name || relatedProduct.catalogName || relatedProduct.title}
                                description={relatedProduct.description || relatedProduct.catalogDescription || relatedProduct.subtitle}
                                thumbnail={relatedProduct.thumbnail}
                                category={relatedProduct.category}
                                priceInr={relatedProduct.priceInr}
                                priceUsd={relatedProduct.priceUsd}
                                creditPrice={relatedProduct.creditPrice}
                            />
                        </div>
                    </section>
                ) : null}
            </main>

            <Footer />
        </div>
    );
};

export default GuideDetail;
