const THEME_MAP = {
    finance: {
        shell: 'bg-white',
        panel: 'bg-[#fff7ef]',
        accent: 'bg-brand-orange',
        accentSoft: 'bg-brand-orange/10',
        text: 'text-brand-black',
        muted: 'text-brand-black/62',
        chip: 'bg-white',
    },
    strategy: {
        shell: 'bg-white',
        panel: 'bg-[#f5efe6]',
        accent: 'bg-brand-black',
        accentSoft: 'bg-brand-orange/12',
        text: 'text-brand-black',
        muted: 'text-brand-black/62',
        chip: 'bg-white',
    },
    marketing: {
        shell: 'bg-white',
        panel: 'bg-[#fff6ed]',
        accent: 'bg-brand-orange',
        accentSoft: 'bg-brand-black/8',
        text: 'text-brand-black',
        muted: 'text-brand-black/62',
        chip: 'bg-white',
    },
    milestone: {
        shell: 'bg-brand-black',
        panel: 'bg-brand-black',
        accent: 'bg-brand-orange',
        accentSoft: 'bg-white/10',
        text: 'text-white',
        muted: 'text-white/72',
        chip: 'bg-white/10',
    },
};

const VARIANT_RULES = {
    guide: { maxLineLength: 18, maxLines: 3, highlightLast: true },
    product: { maxLineLength: 15, maxLines: 3, highlightLast: true },
    hero: { maxLineLength: 14, maxLines: 3, highlightLast: true },
    milestone: { maxLineLength: 14, maxLines: 2, highlightLast: true },
};

function cx(...parts) {
    return parts.filter(Boolean).join(' ');
}

function getTheme(theme) {
    return THEME_MAP[theme] || THEME_MAP.finance;
}

function normalizeGuideTitle(title) {
    const match = title.match(/\(([^)]+)\)/);
    if (!match) {
        return { title, detail: '' };
    }
    return {
        title: title.replace(match[0], '').replace(/\s+/g, ' ').trim(),
        detail: match[1].trim(),
    };
}

function toTitleLines(input, { maxLineLength, maxLines }) {
    const words = input.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return [];
    }

    const lines = [];
    let current = words[0];

    for (let index = 1; index < words.length; index += 1) {
        const candidate = `${current} ${words[index]}`;
        if (candidate.length <= maxLineLength || current.length < Math.floor(maxLineLength * 0.55)) {
            current = candidate;
        } else {
            lines.push(current);
            current = words[index];
        }
    }

    lines.push(current);

    if (lines.length <= maxLines) {
        return lines;
    }

    const visible = lines.slice(0, maxLines);
    visible[maxLines - 1] = `${visible[maxLines - 1]}…`;
    return visible;
}

function buildCardContent({ title, subtitle, variant, displayTitle, displaySubtitle }) {
    const rules = VARIANT_RULES[variant] || VARIANT_RULES.product;
    const guideNormalized = variant === 'guide' ? normalizeGuideTitle(displayTitle || title) : { title: displayTitle || title, detail: '' };
    const resolvedSubtitle = displaySubtitle || subtitle || '';
    const lines = toTitleLines(guideNormalized.title, rules);
    const detail = guideNormalized.detail ? `(${guideNormalized.detail})` : '';
    const finalSubtitle = detail
        ? resolvedSubtitle
            ? `${detail}. ${resolvedSubtitle}`
            : detail
        : resolvedSubtitle;

    return {
        lines,
        subtitle: finalSubtitle,
        highlightLineIndex: rules.highlightLast ? Math.max(lines.length - 1, 0) : -1,
    };
}

function AbstractArtwork({ theme }) {
    const tone = getTheme(theme);

    return (
        <div className="relative min-h-[180px] overflow-hidden rounded-[1.6rem] border-2 border-brand-black">
            <div className={cx('absolute inset-0', tone.panel)} />
            <div className="absolute inset-0 opacity-50" style={{
                backgroundImage: 'linear-gradient(rgba(26,26,26,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,26,0.06) 1px, transparent 1px)',
                backgroundSize: '52px 52px',
            }} />
            <div className={cx('absolute top-[16%] right-[10%] h-[44%] w-[34%] rounded-[1.8rem] border-4 border-brand-black shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]', tone.accent)} />
            <div className="absolute bottom-[12%] left-[7%] h-[28%] w-[22%] rounded-[1.4rem] border-4 border-brand-black bg-white shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]" />
            <div className="absolute bottom-[22%] left-[28%] h-[20%] w-[16%] rounded-[1.1rem] bg-brand-black shadow-[4px_4px_0px_0px_rgba(255,95,21,1)]" />
            <div className="absolute left-[42%] top-[44%] h-[33%] w-[33%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-brand-black" />
            <div className="absolute left-[42%] top-[44%] h-[21%] w-[21%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-orange" />
        </div>
    );
}

const FoundersVisualCard = ({
    title,
    subtitle,
    eyebrow = '',
    meta = '',
    theme = 'finance',
    variant = 'product',
    className = '',
    displayTitle,
    displaySubtitle,
    compact = false,
}) => {
    const tone = getTheme(theme);
    const content = buildCardContent({ title, subtitle, variant, displayTitle, displaySubtitle });

    return (
        <div className={cx(
            'rounded-[1.9rem] border-2 border-brand-black shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] overflow-hidden',
            tone.shell,
            className,
        )}>
            <div className={cx('p-5 md:p-6', compact ? 'space-y-4' : 'space-y-5')}>
                <div className="flex flex-wrap items-center gap-3">
                    {eyebrow ? (
                        <span className={cx(
                            'inline-flex items-center gap-2 rounded-full border-2 border-brand-black px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em]',
                            tone.chip,
                            tone.text,
                        )}>
                            <span className="h-2.5 w-2.5 rounded-full bg-brand-orange" />
                            {eyebrow}
                        </span>
                    ) : null}
                    {meta ? (
                        <span className={cx('text-[11px] font-black uppercase tracking-[0.18em]', tone.muted)}>
                            {meta}
                        </span>
                    ) : null}
                </div>

                <div className="space-y-3">
                    {content.lines.map((line, index) => (
                        <p
                            key={`${line}-${index}`}
                            className={cx(
                                'm-0 font-black tracking-tight-brand leading-[0.92]',
                                compact ? 'text-2xl md:text-[2rem]' : variant === 'hero' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl',
                                index === content.highlightLineIndex ? 'text-brand-orange' : tone.text,
                            )}
                        >
                            {line}
                        </p>
                    ))}
                </div>

                {content.subtitle ? (
                    <p className={cx(
                        'max-w-[34ch] font-semibold leading-relaxed',
                        compact ? 'text-sm' : 'text-base md:text-lg',
                        tone.muted,
                    )}>
                        {content.subtitle}
                    </p>
                ) : null}

                <AbstractArtwork theme={theme} />
            </div>
        </div>
    );
};

export default FoundersVisualCard;
