import '../styles/Catalog.css'

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../utils/Context';
import { getBalance } from '../utils/EthersUtils';
import {
    getCatalogProducts,
    getProductsWithPrices,
    getFidelityPoints,
   // purchaseProduct,
   // previewPurchase
} from '../utils/EthersUtils';

import Info from '../components/Info';
import ProductCard from '../components/ProductCard';
import {useNavigate} from "react-router-dom";

export const Catalog = () => {
    const { wallet } = useWallet();

    const [ethereumAddress, setEthereumAddress] = useState('');
    const [balance, setBalance] = useState('');
    const [fidelityPoints, setFidelityPoints] = useState('0');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!wallet || !wallet.address) {
            console.log('No wallet connected, redirecting...');
            navigate('/');
        }
    }, [wallet, navigate]);

    const fetchAddress = useCallback(async () => {
        if (wallet?.address) {
            setEthereumAddress(wallet.address);
        }
    }, [wallet]);

    const fetchBalance = useCallback(async () => {
        if (wallet?.address) {
            try {
                const result = await getBalance(wallet.address);
                setBalance(result.toString());
            } catch (error) {
                console.error('Error fetching balance:', error);
            }
        }
    }, [wallet]);

    const fetchFidelityPoints = useCallback(async () => {
        if (wallet?.address) {
            try {
                const points = await getFidelityPoints(wallet.address);
                setFidelityPoints(points.toString());
            } catch (error) {
                console.error('Error fetching fidelity points:', error);
                setFidelityPoints('0');
            }
        }
    }, [wallet]);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const productList = await getProductsWithPrices();
            setProducts(productList);
        } catch (error) {
            console.error('Error fetching products:', error);
            setPopupMessage('Error loading products: ' + error.message);
            setShowPopup(true);
        } finally {
            setLoading(false);
        }
    }, [wallet]);

    useEffect(() => {
        fetchAddress();
        fetchBalance();
        fetchFidelityPoints();
        fetchProducts();

        // Refresh balance and points every 10 seconds
        const intervalId = setInterval(() => {
            fetchBalance();
            fetchFidelityPoints();
        }, 10000);

        return () => clearInterval(intervalId);
    }, [fetchAddress, fetchBalance, fetchFidelityPoints, fetchProducts]);

    const handleBuyProduct = async (productCode, quantity = 1) => {
    };

    const closePopup = () => {
        setShowPopup(false);
        setPopupMessage('');
    };

    return (
        <div className="App">
            <div className="App-header">
                <h1>Fidelity Catalog</h1>

                <div className="account-info">
                    <div className="info-card">
                        <h3>Account Information</h3>
                        <p><strong>Address:</strong> {ethereumAddress ? `${ethereumAddress.substring(0, 6)}...${ethereumAddress.substring(38)}` : 'Not connected'}</p>
                        <p><strong>ETH Balance:</strong> {balance} Wei</p>
                        <p><strong>Fidelity Points:</strong> {fidelityPoints}</p>
                    </div>
                </div>

                <div className="products-section">
                    <h2>Available Products</h2>

                    {loading ? (
                        <p>Loading products...</p>
                    ) : products.length === 0 ? (
                        <p>No products available</p>
                    ) : (
                        <div className="products-grid" >
                            {products.map((product, index) => (
                                <ProductCard
                                    key={index}
                                    product={product}
                                    onBuy={handleBuyProduct}
                                    userPoints={fidelityPoints}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {showPopup && (
                    <Info message={popupMessage} onClose={closePopup} />
                )}
            </div>
        </div>
    );
};