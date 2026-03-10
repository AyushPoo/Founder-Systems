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
 * Encapsulates the core Razorpay checkout execution logic. Automatically splits standard INR and international Paypal/USD options.
 * 
 * @param {string} productName - Display name on the checkout terminal.
 * @param {string} productId - Razorpay string representing the slug item mapping.
 * @param {string} productSlug - Application's slug representing the object internally.
 * @param {number} inrAmount - Core price in original rupees currency format without trailing paise.
 * @param {number} usdAmount - Localized dollar exchange value.
 * @param {string} customerEmail - Filled from checkout input modals.
 * @param {string} customerName - Filled from checkout input modals.
 * @param {Function} onSuccess - Callback with access to the full checkout receipt payload.
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
    // Basic validation
    if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) {
        console.error('initCheckout called without valid email');
        return false;
    }

    const isIndia = isUserInIndia();
    const currency = isIndia ? 'INR' : 'USD';

    // Razorpay operates in the smallest currency sub-unit strings
    const configuredAmount = isIndia ? (inrAmount * 100) : (usdAmount * 100);

    const options = {
        key: "rzp_live_SNdUB2ZDVSnOgi", // Matches existing integrations across Founder Systems logic map
        amount: configuredAmount,
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

        // Error interception callback bindings
        rzp.on('payment.failed', function (response) {
            console.error("Payment failed:", response.error);
        });

        rzp.open();
        return true;
    } else {
        console.error("Razorpay SDK not loaded on front-end.");
        // Redirect logic to standard gateway UI as safety net
        window.open("https://rzp.io/rzp/aig9tmBT", "_blank");
        return false;
    }
};
