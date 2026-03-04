import { Link } from 'react-router-dom';

const ProductCard = ({ id, name, description }) => {
    return (
        <div className="w-full border-4 border-brand-black p-6 bg-white transition-transform duration-300 hover:-translate-y-2 hover:shadow-soft group flex flex-col">
            <div className="font-bold text-xl mb-2">{name}</div>
            <p className="text-brand-black/70 text-sm mb-6 flex-grow">{description}</p>

            <div className="flex justify-start w-full mt-auto">
                <Link to={`/products/${id}`} className="bg-brand-orange text-center text-white px-6 py-2 font-bold uppercase text-sm group-hover:bg-brand-black transition-colors w-full block">
                    View Product
                </Link>
            </div>
        </div>
    );
};

export default ProductCard;
