const CatalogArtifact = require('../contracts/Catalog.json');
const FidelityPointsArtifact = require('../contracts/FidelityPoints.json');

const deployedAddresses = require('../contracts/addresses.json');

const CATALOG_ADDRESS = deployedAddresses.catalog;
const FIDELITY_POINTS_ADDRESS = deployedAddresses.fidelityPoints;

const CATALOG_ABI = CatalogArtifact.abi;
const FIDELITY_POINTS_ABI = FidelityPointsArtifact.abi;

const ethers = require('ethers');

const getProvider = () => {
    if (window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
    }
    throw new Error('MetaMask not installed');
};


const connectWalletMetamask = async (accountChangedHandler) => {
    try {
        const provider = getProvider();
        await provider.send("eth_requestAccounts", []);

        let signer;

        while (!signer) {
            signer = await provider.getSigner().catch(() => null);
            if (signer) {
                accountChangedHandler(signer);
                break;
            } else {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    } catch (err) {
        console.log("Error while requesting accounts or retrieving signer:", err);
    }
}

const getBalance = (address) => {
    const provider = getProvider();
    return provider.getBalance(address);
};

const sendTransaction = async (sender, to, amount) => {
    console.log("sender: " + sender.provider);
    console.log('amount ' + ethers.parseUnits(amount.toString(), 'wei'));
    const transactionResponse = await sender.sendTransaction({
        to,
        value: ethers.parseUnits(amount.toString(), 'wei')
    });

    return transactionResponse.hash;
};

const getFidelityPoints = async (address) => {
    const provider = getProvider();
    try {
        const fidelityPoints = new ethers.Contract(FIDELITY_POINTS_ADDRESS, FIDELITY_POINTS_ABI, provider);
        const points = await fidelityPoints.getTotalPoints();
        return points.toString();
    } catch (error) {
        console.error('Error fetching fidelity points:', error);
        throw error;
    }
};

const getCatalogProducts = async (filterInStock = false, filterInPromo = true) => {
    const provider = getProvider();
    try {
        const catalog = new ethers.Contract(CATALOG_ADDRESS, CATALOG_ABI, provider);

        const products = await catalog.getProducts(filterInStock, filterInPromo);

        return products.map(product => ({
            code: product.code,
            description: product.description,
            price: product.price.toString(),
            inStock: product.inStock,
            stock: product.stock.toString()
        }));
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

const getProductsWithPrices = async () => {
    try {
        const provider = getProvider();
        const catalog = new ethers.Contract(CATALOG_ADDRESS, CATALOG_ABI, provider);

        const products = await catalog.getProductsWithPrices();

        return products.map(product => ({
            code: product.code,
            description: product.description,
            price: product.price.toString(),
            inStock: product.inStock,
            stock: product.stock.toString()
        }));
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

const addFidelityPoints = async (wallet) => {
    const provider = getProvider();
    const signer = await provider.getSigner();

    try {
        const signerAddress = await signer.getAddress();
        const targetAddress = wallet && wallet.address ? wallet.address : signerAddress;
        console.log('addFidelityPoints: signerAddress=', signerAddress, ' targetAddress=', targetAddress);

        const fidelityPointsContract = new ethers.Contract(FIDELITY_POINTS_ADDRESS, FIDELITY_POINTS_ABI, signer);

        if (typeof fidelityPointsContract.addPoints !== 'function') {
            throw new Error('Contract ABI does not contain addPoints method');
        }

        const tx = await fidelityPointsContract.addPoints(targetAddress, 5000);
        const receipt = await tx.wait();
        console.log('addPoints tx receipt:', receipt);
        return receipt;
    } catch (error) {
        console.error('Error adding fidelity points:', error);
    }
}

const buyProduct = async (productCode, amount) => {
    const provider = getProvider();
    const signer = await provider.getSigner();

    try {
        const catalogContract = new ethers.Contract(CATALOG_ADDRESS, CATALOG_ABI, signer);
        const tx = await catalogContract.decreaseStock(productCode, amount);
        const receipt = await tx.wait();
        console.log('buyProduct tx receipt:', receipt);
        return receipt;
    } catch (err) {
        console.log("Error in buyProduct: ", err);
    }
}

const decreaseFidelityPoints = async (points) => {
    const provider = getProvider();
    const signer = await provider.getSigner();

    try {
        const fidelityPointsContract = new ethers.Contract(FIDELITY_POINTS_ADDRESS, FIDELITY_POINTS_ABI, signer);
        const tx = await fidelityPointsContract.spendPoints(points);
        const receipt = await tx.wait();
        console.log('decreaseFidelityPoints tx receipt:', receipt);
        return receipt;
    } catch (err) {
        console.log("Error in decreaseFidelityPoints: ", err);
    }
}


module.exports = {
    getProvider,
    sendTransaction,
    getBalance,
    getFidelityPoints,
    addFidelityPoints,
    buyProduct,
    decreaseFidelityPoints,
    getCatalogProducts,
    getProductsWithPrices,
    connectWalletMetamask

};


