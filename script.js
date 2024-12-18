let investments = JSON.parse(localStorage.getItem('investments')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
const profitChartCtx = document.getElementById('profitChart').getContext('2d');
let profitChart;

async function fetchCryptoData(cryptoIds) {
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cryptoIds.join(',')}`);
        const data = await response.json();

        const prices = {};
        const logos = {};

        data.forEach(coin => {
            prices[coin.id] = coin.current_price;
            logos[coin.id] = coin.image;
        });

        return { prices, logos };
    } catch (error) {
        console.error("Erreur avec l'API CoinGecko :", error);
        return { prices: {}, logos: {} };
    }
}

async function updateTables() {
    const cryptoIds = new Set([
        ...investments.map(inv => inv.crypto.toLowerCase()),
        ...sales.map(sale => sale.crypto.toLowerCase())
    ]);

    const { prices, logos } = await fetchCryptoData([...cryptoIds]);
    updateInvestmentTable(prices, logos);
    updateSalesTable(prices, logos);
}

function updateInvestmentTable(prices, logos) {
    const tableBody = document.querySelector('#investment-table tbody');
    tableBody.innerHTML = '';
    let totalPnl = 0;
    let totalPortfolio = 0;
    const profits = [];

    investments.forEach((inv, i) => {
        const price = prices[inv.crypto.toLowerCase()] || "N/A";
        const logo = logos[inv.crypto.toLowerCase()] || "https://via.placeholder.com/25?text=?";
        const valueNow = price !== "N/A" ? (price * inv.amount).toFixed(2) : "N/A";
        const pnl = price !== "N/A" ? ((price - inv.price) * inv.amount).toFixed(2) : "N/A";
        const pnlPercentage = price !== "N/A" ? (((price - inv.price) / inv.price) * 100).toFixed(2) : "N/A";

        totalPnl += pnl !== "N/A" ? parseFloat(pnl) : 0;
        totalPortfolio += valueNow !== "N/A" ? parseFloat(valueNow) : 0;
        profits.push(pnl !== "N/A" ? parseFloat(pnl) : 0);

        tableBody.innerHTML += `
            <tr>
                <td>
                    <img src="${logo}" alt="${inv.crypto}" style="width: 20px; height: 20px;"> ${inv.crypto.toUpperCase()}
                </td>
                <td>${inv.date}</td>
                <td>${inv.amount}</td>
                <td>$${inv.price}</td>
                <td>${price !== "N/A" ? `$${price}` : "N/A"}</td>
                <td>${valueNow !== "N/A" ? `$${valueNow}` : "N/A"}</td>
                <td style="color: ${pnl >= 0 ? 'lime' : 'red'}">
                    ${pnl !== "N/A" ? `$${pnl} (${pnlPercentage}%)` : "N/A"}
                </td>
                <td><button class="delete-btn" onclick="deleteInvestment(${i})">X</button></td>
            </tr>
        `;
    });

    document.getElementById('total-pnl').innerText = `Total des P&L : $${totalPnl.toFixed(2)}`;
    document.getElementById('total-portfolio').innerText = `Valeur Totale du Portefeuille : $${totalPortfolio.toFixed(2)}`;
    updateChart(profits);
}

function updateSalesTable(prices, logos) {
    const tableBody = document.querySelector('#sales-table tbody');
    tableBody.innerHTML = '';

    sales.forEach((sale, i) => {
        const price = prices[sale.crypto.toLowerCase()] || "N/A";
        const logo = logos[sale.crypto.toLowerCase()] || "https://via.placeholder.com/25?text=?";
        const variation = price !== "N/A" ? (((price - sale.price) / sale.price) * 100).toFixed(2) : "N/A";

        tableBody.innerHTML += `
            <tr>
                <td>
                    <img src="${logo}" alt="${sale.crypto}" style="width: 20px; height: 20px;"> ${sale.crypto.toUpperCase()}
                </td>
                <td>$${sale.price.toFixed(2)}</td>
                <td>${sale.quantity}</td>
                <td style="color: ${variation >= 0 ? 'lime' : 'red'}">${variation}%</td>
                <td><button class="delete-btn" onclick="deleteSale(${i})">X</button></td>
            </tr>
        `;
    });
}

function addInvestment() {
    const crypto = document.getElementById('crypto-name').value.toUpperCase();
    const amount = parseFloat(document.getElementById('amount').value);
    const price = parseFloat(document.getElementById('purchase-price').value);
    const date = document.getElementById('purchase-date').value;

    if (crypto && amount && price && date) {
        investments.push({ crypto, amount, price, date });
        localStorage.setItem('investments', JSON.stringify(investments));
        updateTables();
    } else {
        alert('Veuillez remplir tous les champs.');
    }
}

function addSale() {
    const crypto = document.getElementById('sale-crypto').value.toUpperCase();
    const price = parseFloat(document.getElementById('sale-price').value);
    const quantity = parseFloat(document.getElementById('sale-quantity').value);

    if (crypto && price > 0 && quantity > 0) {
        sales.push({ crypto, price, quantity });
        localStorage.setItem('sales', JSON.stringify(sales));
        updateTables();
    } else {
        alert('Veuillez remplir tous les champs correctement.');
    }
}

function deleteInvestment(index) {
    investments.splice(index, 1);
    localStorage.setItem('investments', JSON.stringify(investments));
    updateTables();
}

function deleteSale(index) {
    sales.splice(index, 1);
    localStorage.setItem('sales', JSON.stringify(sales));
    updateTables();
}

function updateChart(profits) {
    if (profitChart) profitChart.destroy();
    profitChart = new Chart(profitChartCtx, {
        type: 'bar',
        data: {
            labels: investments.map(inv => inv.crypto),
            datasets: [{
                label: 'P&L ($)',
                data: profits,
                backgroundColor: profits.map(p => p >= 0 ? 'lime' : 'red'),
                borderColor: 'cyan',
                borderWidth: 1
            }]
        }
    });
}

function changeBackground(imagePath) {
    document.body.style.backgroundImage = `url('${imagePath}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
}

updateTables();
updateSalesTable();