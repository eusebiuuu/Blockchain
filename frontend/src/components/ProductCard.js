import React, { useState } from 'react';
import '../styles/ProductCard.css';

const ProductCard = ({ product, onBuy, userPoints }) => {
    const [quantity, setQuantity] = useState(1);

    const formatProductCode = (code) => {
        if (code.startsWith('0x')) {
            try {
                const hex = code.slice(2);
                let str = '';
                for (let i = 0; i < hex.length; i += 2) {
                    const byte = parseInt(hex.slice(i, i+ 2), 16);
                    if (byte !== 0) str += String.fromCharCode(byte);
                }
                return str || code.substring(0, 10) + '...';
            } catch {
                return code.substring(0, 10) + '...';
            }
        }
        return code;
    };

    const canAfford = () => {
        const totalCost = product.price * quantity;
        return parseInt(userPoints) >= totalCost;
    };

    const handleBuyClick = () => {
        onBuy(product.price, product.code, quantity);
    };

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (value > 0 && value <= product.stock) {
            setQuantity(value);
        }
    };

    return (
        <div className={`product-card ${!product.inStock ? 'out-of-stock' : ''}`}>
            <div className="product-header">
                <h3>{formatProductCode(product.code)}</h3>
                {!product.inStock && <span className="badge out-of-stock-badge">Out of Stock</span>}
            </div>

            <div className="product-body">
                <p className="product-description">{product.description}</p>

                <div className="product-details">
                    <div className="detail-row">
                        <span className="label">Price:</span>
                        <span className="value">{product.price} points</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">Stock:</span>
                        <span className="value">{product.stock} units</span>
                    </div>

                    <div className="detail-row">
                        <span className="label">Total Cost:</span>
                        <span className="value highlight">{product.price * quantity} points</span>
                    </div>
                </div>

                {product.inStock && (
                    <div className="quantity-section">
                        <label htmlFor={`quantity-${product.code}`}>Quantity:</label>
                        <input
                            id={`quantity-${product.code}`}
                            type="number"
                            min="1"
                            max={product.stock}
                            value={quantity}
                            onChange={handleQuantityChange}
                            className="quantity-input"
                        />
                    </div>
                )}
            </div>

            <div className="product-footer">
                <button
                    onClick={handleBuyClick}
                    disabled={!product.inStock || !canAfford()}
                    className={`buy-button ${!canAfford() ? 'insufficient-funds' : ''}`}
                >
                    {!product.inStock
                        ? 'Out of Stock'
                        : !canAfford()
                            ? 'Insufficient Points'
                            : 'Buy Now'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;