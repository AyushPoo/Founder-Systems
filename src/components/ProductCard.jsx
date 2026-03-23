import { Link } from 'react-router-dom';

const ProductCard = ({ id, name, description }) => {
    return (
        <div className="card-elevated group flex flex-col overflow-hidden">
            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-brand-black mb-2 group-hover:text-brand-orange transition-colors duration-300">
                    {name}
                </h3>
                <p className="text-brand-black/50 text-sm leading-relaxed mb-6 flex-grow">
                    {description}
                </p>

                <Link
                    to={`/products/${id}`}
                    className="btn-cta text-sm text-center w-full"
                >
                    View Product
                </Link>
            </div>
        </div>
    );
};

export default ProductCard;
