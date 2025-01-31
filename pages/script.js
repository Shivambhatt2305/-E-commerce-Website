const products = [];
const brands = ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Asics', 'Vans', 'Converse'];
const sizes = ['S', 'M', 'L', 'XL'];
const types = ['Sneakers', 'Running Shoes', 'Casual Shoes', 'Dress Shoes', 'Sandals', 'Boots'];

// Product image URLs
const productImages = {
    'Nike': {
        'Sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        'Running Shoes': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a',
        'Sandals': 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1',
        'Boots': 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f'
    },
    'Adidas': {
        'Sneakers': 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76',
        'Running Shoes': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa',
        'Sandals': 'https://images.unsplash.com/photo-1628253747716-0c4f5c90fdda',
        'Boots': 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76'
    },
    'Puma': {
        'Sneakers': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5',
        'Running Shoes': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5',
        'Sandals': 'https://images.unsplash.com/photo-1567347167012-29482aa7a9a8',
        'Boots': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'
    }
};

// Generate 100 products
for (let i = 1; i <= 100; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Get specific image URL or fallback to a default
    let imageUrl = 'https://images.unsplash.com/photo-1549298916-b41d501d3772';
    if (productImages[brand] && productImages[brand][type]) {
        imageUrl = productImages[brand][type];
    }
    
    products.push({
        id: i,
        title: `${brand} ${type}`,
        price: Math.floor(Math.random() * (200 - 30) + 30),
        brand: brand,
        size: sizes[Math.floor(Math.random() * sizes.length)],
        image: `${imageUrl}?auto=format&fit=crop&w=400&h=400`
    });
}

// Rest of the code remains the same
const itemsPerPage = 12;
let currentPage = 1;
let filteredProducts = [...products];

function renderProducts(productsToRender) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = '';

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-brand">Brand: ${product.brand}</p>
                <p class="product-size">Size: ${product.size}</p>
                <button class="add-to-cart-btn">Add to Cart</button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
}



function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            applyFilters();
        }
    });
    paginationContainer.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.disabled = i === currentPage;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            applyFilters();
        });
        paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            applyFilters();
        }
    });
    paginationContainer.appendChild(nextButton);
}

function renderBrandFilters() {
    const brandFiltersContainer = document.getElementById('brand-filters');
    brands.forEach(brand => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `brand-${brand}`;
        checkbox.value = brand;

        const label = document.createElement('label');
        label.htmlFor = `brand-${brand}`;
        label.textContent = brand;

        brandFiltersContainer.appendChild(checkbox);
        brandFiltersContainer.appendChild(label);
        brandFiltersContainer.appendChild(document.createElement('br'));
    });
}

function renderSizeFilters() {
    const sizeFiltersContainer = document.getElementById('size-filters');
    sizes.forEach(size => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `size-${size}`;
        checkbox.value = size;

        const label = document.createElement('label');
        label.htmlFor = `size-${size}`;
        label.textContent = size;

        sizeFiltersContainer.appendChild(checkbox);
        sizeFiltersContainer.appendChild(label);
        sizeFiltersContainer.appendChild(document.createElement('br'));
    });
}

function applyFilters() {
    const sortPrice = document.getElementById('sort-price').value;
    const selectedBrands = Array.from(document.querySelectorAll('#brand-filters input:checked')).map(input => input.value);
    const selectedSizes = Array.from(document.querySelectorAll('#size-filters input:checked')).map(input => input.value);
    const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price').value) || Infinity;

    filteredProducts = products.filter(product => {
        const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
        const matchesSize = selectedSizes.length === 0 || selectedSizes.includes(product.size);
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        return matchesBrand && matchesSize && matchesPrice;
    });

    if (sortPrice === 'low-to-high') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortPrice === 'high-to-low') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    renderProducts(paginatedProducts);
    renderPagination();
    updateProductCount();
}

function updateProductCount() {
    const productCount = document.getElementById('product-count');
    productCount.textContent = `Showing ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`;
}

function resetFilters() {
    document.getElementById('sort-price').value = '';
    document.querySelectorAll('#brand-filters input, #size-filters input').forEach(input => input.checked = false);
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    currentPage = 1;
    filteredProducts = [...products];
    applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
    renderBrandFilters();
    renderSizeFilters();
    applyFilters();

    document.getElementById('apply-filters').addEventListener('click', () => {
        currentPage = 1;
        applyFilters();
    });

    document.getElementById('reset-filters').addEventListener('click', resetFilters);

    document.getElementById('search-button').addEventListener('click', () => {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        filteredProducts = products.filter(product => 
            product.title.toLowerCase().includes(searchTerm) || 
            product.brand.toLowerCase().includes(searchTerm)
        );
        currentPage = 1;
        applyFilters();
    });
});
