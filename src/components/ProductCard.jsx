import { Link } from 'react-router-dom';

const ProductCard = ({ id, name, description, thumbnail, priceUsd, isBundle, isComingSoon }) => {
    return (
        <div className="card-elevated group flex flex-col overflow-hidden bg-white">
            {/* Thumbnail */}
            {thumbnail && (
                <Link to={`/products/${id}`} className="block relative aspect-[4/3] w-full overflow-hidden border-b-2 border-brand-black bg-surface-low">
                        {isBundle && (
                            <div className="absolute top-4 left-4 z-10">
                                <span className="bg-brand-orange text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] rotate-[-2deg] inline-block">
                                    🔥 Best Value
                                </span>
                            </div>
                        )}
                        {isComingSoon && (
                            <div className="absolute top-4 right-4 z-10">
                                <span className="bg-yellow-400 text-brand-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] rotate-[2deg] inline-block animate-pulse">
                                    🚀 Coming Soon
                                </span>
                            </div>
                        )}
                        <img 
                            src={thumbnail} 
                            alt={name} 
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isComingSoon ? 'grayscale-[0.5] opacity-80' : ''}`} 
                        />
                </Link>
            )}
            
            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                {/* Creator & Rating */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold text-xs border-2 border-brand-black">
                            A
                        </div>
                        <span className="text-xs font-bold text-brand-black uppercase tracking-wider">by Ayush</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-brand-orange text-sm leading-none">★★★★★</span>
                    </div>
                </div>

                <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-black text-xl text-brand-black group-hover:text-brand-orange transition-colors duration-200 line-clamp-2">
                        {name}
                    </h3>
                    {priceUsd && (
                        <div className="bg-white px-2 py-1 rounded-md border-2 border-brand-black font-black text-sm shrink-0 shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] text-brand-black translate-y-1">
                            ${priceUsd}
                        </div>
                    )}
                </div>
                
                <p className="text-brand-black/70 font-medium text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                    {description}
                </p>

                <Link
                    to={`/products/${id}`}
                    className={`text-sm text-center w-full !py-3 ${isComingSoon ? 'bg-brand-black/10 text-brand-black/40 border-2 border-brand-black/20 rounded-lg pointer-events-none cursor-not-allowed font-black' : 'btn-cta'}`}
                >
                    {isComingSoon ? 'Launching Soon' : 'I want this!'}
                </Link>
            </div>
        </div>
    );
};

export default ProductCard;
