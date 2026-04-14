document.addEventListener('DOMContentLoaded', () => {
    const usdInput = document.getElementById('usd-input');
    const pkrInput = document.getElementById('pkr-input');
    const baseRateDisplay = document.getElementById('base-rate');
    const updateTimeDisplay = document.getElementById('update-time');
    const refItems = document.querySelectorAll('.ref-item');

    // Default rate as fallback
    let currentRate = 279.13;

    function updateConversion() {
        const usdValue = parseFloat(usdInput.value) || 0;
        const pkrValue = usdValue * currentRate;
        pkrInput.value = pkrValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).replace(/,/g, ''); // Keep as number for the input but formatted in display logic if it was a span

        // Actually, since it's an input type number, we shouldn't put commas in the value
        pkrInput.value = pkrValue.toFixed(2);

        updateQuickReference();
    }

    function updateQuickReference() {
        refItems.forEach(item => {
            const val = parseFloat(item.getAttribute('data-val'));
            const result = (val * currentRate).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            item.querySelector('.ref-pkr').textContent = `₨ ${result}`;
        });
    }

    async function fetchRate() {
        try {
            updateTimeDisplay.textContent = 'Updating...';
            // Using open.er-api.com which is free and doesn't require an API key
            const response = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            if (data.rates && data.rates.PKR) {
                currentRate = data.rates.PKR;
                baseRateDisplay.textContent = `1 USD = ${currentRate.toFixed(2)} PKR`;

                const now = new Date();
                updateTimeDisplay.textContent = `Updated: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                // Save to localStorage for offline fallback
                localStorage.setItem('usd_pkr_rate', currentRate);
                localStorage.setItem('usd_pkr_time', now.toISOString());
            }
        } catch (error) {
            console.error('Error fetching rate:', error);
            // Try to load from localStorage
            const savedRate = localStorage.getItem('usd_pkr_rate');
            const savedTime = localStorage.getItem('usd_pkr_time');

            if (savedRate) {
                currentRate = parseFloat(savedRate);
                baseRateDisplay.textContent = `1 USD = ${currentRate.toFixed(2)} PKR (Offline)`;
                if (savedTime) {
                    const time = new Date(savedTime);
                    updateTimeDisplay.textContent = `Last: ${time.toLocaleDateString()}`;
                }
            } else {
                updateTimeDisplay.textContent = 'Using default rate';
            }
        } finally {
            updateConversion();
        }
    }

    usdInput.addEventListener('input', updateConversion);

    // Initial fetch
    fetchRate();

    // Refresh rate every 10 minutes
    setInterval(fetchRate, 600000);
});
