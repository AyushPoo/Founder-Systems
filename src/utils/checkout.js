/**
 * Evaluates whether the user's current environment corresponds to India based on localized DateTime strings.
 * @returns {boolean} True if the local time zone is mapped within India; False otherwise.
 */
export const isUserInIndia = () => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta';
    } catch (e) {
        // Fallback default to false (International) to err on the side of caution.
        return false;
    }
};

/**
 * Returns localized pricing based on the user's location.
 * @param {number} inrPrice - The price in INR (e.g. 1499)
 * @param {number} usdPrice - The price in USD (e.g. 15)
 * @param {number|string} [inrOriginalPrice] - Optional, the original price in INR
 * @param {number|string} [usdOriginalPrice] - Optional, the original price in USD
 * @returns {Object} Pricing details with currencies, display strings, and checkout amount.
 */
export const getLocalizedPrice = (inrPrice, usdPrice, inrOriginalPrice = null, usdOriginalPrice = null) => {
    const isIndia = isUserInIndia();

    if (isIndia) {
        return {
            displayPrice: `₹${inrPrice}`,
            originalDisplayPrice: inrOriginalPrice ? `₹${inrOriginalPrice}` : null,
            currency: 'INR',
            checkoutAmount: inrPrice * 100 // Razorpay expects paise for INR
        };
    } else {
        return {
            displayPrice: `$${usdPrice}`,
            originalDisplayPrice: usdOriginalPrice ? `$${usdOriginalPrice}` : null,
            currency: 'USD',
            checkoutAmount: usdPrice * 100 // Razorpay expects cents for USD
        };
    }
};

/**
 * Base function to open Razorpay checkout with a specific currency and amount.
 */
const openCheckout = ({
    productName,
    productId,
    productSlug,
    amount,
    currency,
    customerEmail,
    customerName,
    onSuccess
}) => {
    // Basic validation
    if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) {
        console.error('Checkout called without valid email');
        return false;
    }

    const options = {
        key: "rzp_live_SNdUB2ZDVSnOgi",
        amount: amount,
        currency: currency,
        name: "Founder Systems",
        description: productName,
        prefill: {
            email: customerEmail,
            name: customerName || undefined
        },
        notes: {
            product_id: productId,
            product: productSlug,
            customer_email: customerEmail
        },
        handler: function (response) {
            if (onSuccess) {
                onSuccess(response);
            }
        }
    };

    if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
            console.error("Payment failed:", response.error);
        });
        rzp.open();
        return true;
    } else {
        console.error("Razorpay SDK not loaded.");
        window.open("https://rzp.io/rzp/aig9tmBT", "_blank");
        return false;
    }
};

/**
 * Opens Razorpay checkout in INR.
 */
export const openINRCheckout = (config) => {
    return openCheckout({
        ...config,
        currency: 'INR',
        amount: config.amount // Expected in paise already if passing raw 149900
    });
};

/**
 * Opens Razorpay checkout in USD.
 */
export const openUSDCheckout = (config) => {
    return openCheckout({
        ...config,
        currency: 'USD',
        amount: config.amount // Expected in cents already if passing raw 1500
    });
};

/**
 * Legacy wrapper or helper for dynamic detection if still needed elsewhere.
 */
export const initCheckout = (
    productName,
    productId,
    productSlug,
    inrAmount,
    usdAmount,
    customerEmail,
    customerName,
    onSuccess
) => {
    const isIndia = isUserInIndia();
    const currency = isIndia ? 'INR' : 'USD';
    const amount = isIndia ? (inrAmount * 100) : (usdAmount * 100);

    return openCheckout({
        productName,
        productId,
        productSlug,
        amount,
        currency,
        customerEmail,
        customerName,
        onSuccess
    });
};
