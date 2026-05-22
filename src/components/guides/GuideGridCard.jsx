import { Link } from 'react-router-dom';

function GuideGridCard({ guide }) {
  return (
    <Link
      to={`/guides/${guide.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border-2 border-brand-black bg-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-brand-black bg-[#f6efe5]">
        <img
          src={guide.thumbnail}
          alt={guide.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/54">
          <span className="rounded-full border border-brand-black/15 bg-brand-cream px-3 py-1">
            {guide.category}
          </span>
          <span>{guide.readTime}</span>
        </div>

        <h2 className="text-[1.32rem] font-black leading-[1.06] tracking-tight-brand text-brand-black transition-colors duration-200 group-hover:text-brand-orange md:text-[1.4rem]">
          {guide.title}
        </h2>

        <p className="mt-4 text-[14px] font-medium leading-7 text-brand-black/68 md:text-[15px]">
          {guide.description}
        </p>
      </div>
    </Link>
  );
}

export default GuideGridCard;
