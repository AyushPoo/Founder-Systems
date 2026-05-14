const THEME_MAP = {
    finance: {
        shell: 'bg-white',
        panel: 'bg-[#fff7ef]',
        accent: 'bg-brand-orange',
        accentSoft: 'bg-brand-orange/12',
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
    showAccents = true,
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

                {showAccents ? (
                    <div className={cx(
                        'mt-2 rounded-[1.4rem] border border-brand-black/10 px-4 py-4',
                        tone.panel,
                    )}>
                        <div className="flex items-center gap-3">
                            <span className={cx('h-3 rounded-full border border-brand-black/15', compact ? 'w-16' : 'w-20', tone.accent)} />
                            <span className={cx('h-3 rounded-full border border-brand-black/15', compact ? 'w-10' : 'w-14', tone.accentSoft)} />
                            <span className="h-px flex-1 bg-brand-black/10" />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default FoundersVisualCard;
