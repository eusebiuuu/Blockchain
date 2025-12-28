// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Catalog {
    enum State { Active, Expired }

    struct Promo {
        State state;
        uint start;
        uint end;
        uint percent;
    }

    struct Product {
        bytes32 code;
        string description;
        uint price;
        bool inStock;
        uint stock;
    }

    Product[] public products;
    mapping(bytes32 => Promo) public productPromos;
    mapping(bytes32 => uint) private productIndex;

    address public admin;
    mapping(address => bool) public authorizedManagers;

    event ProductAdded(bytes32 indexed code, string description, uint price);
    event StockUpdated(bytes32 indexed code, uint newStock);
    event PriceUpdated(bytes32 indexed code, uint oldPrice, uint newPrice);
    event PromoStarted(bytes32 indexed code, uint percent, uint duration);
    event PromoEnded(bytes32 indexed code);
    event ManagerAuthorized(address indexed manager);
    event ManagerRevoked(address indexed manager);

    error ProductNotFound(bytes32 code);
    error InsufficientStock(bytes32 code, uint available, uint requested);
    error ProductOutOfStock(bytes32 code);
    error ProductAlreadyExists(bytes32 code);
    error UnauthorizedManager();

    constructor() {
        admin = msg.sender;
        authorizedManagers[admin] = true;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyAuthorizedManager() {
        if (!authorizedManagers[msg.sender]) revert UnauthorizedManager();
        _;
    }

    function authorizeManager(address manager) external onlyAdmin {
        authorizedManagers[manager] = true;
        emit ManagerAuthorized(manager);
    }

    function revokeManager(address manager) external onlyAdmin {
        authorizedManagers[manager] = false;
        emit ManagerRevoked(manager);
    }

    function addProduct(
        bytes32 code,
        string memory description,
        uint price,
        uint initialStock
    ) public onlyAdmin {
        for (uint i = 0; i < products.length; i++) {
            if (products[i].code == code) revert ProductAlreadyExists(code);
        }

        products.push(Product({
            code: code,
            description: description,
            price: price,
            inStock: initialStock > 0,
            stock: initialStock
        }));

        productIndex[code] = products.length - 1;
        emit ProductAdded(code, description, price);
    }

    function updatePrice(bytes32 code, uint newPrice) external onlyAdmin {
        uint index = findProductIndex(code);
        uint oldPrice = products[index].price;
        products[index].price = newPrice;
        emit PriceUpdated(code, oldPrice, newPrice);
    }

    function increaseStock(bytes32 code, uint amount) public onlyAdmin {
        uint index = findProductIndex(code);
        Product storage p = products[index];
        p.stock += amount;
        if (p.stock > 0) p.inStock = true;
        emit StockUpdated(code, p.stock);
    }

    function decreaseStock(bytes32 code, uint amount) external onlyAuthorizedManager {
        uint index = findProductIndex(code);
        Product storage p = products[index];
        if (p.stock < amount) revert InsufficientStock(code, p.stock, amount);

        p.stock -= amount;
        if (p.stock == 0) p.inStock = false;
        emit StockUpdated(code, p.stock);
    }

    function findProductIndex(bytes32 code) internal view returns (uint) {
        uint index = productIndex[code];
        if (index >= products.length || products[index].code != code) {
            for (uint i = 0; i < products.length; i++) {
                if (products[i].code == code) return i;
            }
            revert ProductNotFound(code);
        }
        return index;
    }

    function getProduct(bytes32 code) public view returns (Product memory) {
        uint index = findProductIndex(code);
        return products[index];
    }

    function isAvailable(bytes32 code, uint quantity) external view returns (bool) {
        uint index = findProductIndex(code);
        Product memory product = products[index];
        return product.inStock && product.stock >= quantity;
    }

    function calculateFinalPrice(bytes32 code) public view returns (uint) {
        uint index = findProductIndex(code);
        uint basePrice = products[index].price;

        if (isPromoActive(code)) {
            Promo memory promo = productPromos[code];
            uint discount = (basePrice * promo.percent) / 100;
            return basePrice - discount;
        }

        return basePrice;
    }

    function startProductPromo(bytes32 code, uint ndays, uint percent) external onlyAdmin {
        require(percent <= 100, "Percent cannot exceed 100");
        uint index = findProductIndex(code);
        require(index < products.length, "Product does not exist");

        productPromos[code] = Promo({
            start: block.timestamp,
            end: block.timestamp + (ndays * 24 * 60 * 60),
            state: State.Active,
            percent: percent
        });

        emit PromoStarted(code, percent, ndays);
    }

    function startPromoBatch(bytes32[] memory codes, uint ndays, uint percent) external onlyAdmin {
        require(percent <= 100, "Percent cannot exceed 100");

        for (uint i = 0; i < codes.length; i++) {
            productPromos[codes[i]] = Promo({
                start: block.timestamp,
                end: block.timestamp + (ndays * 24 * 60 * 60),
                state: State.Active,
                percent: percent
            });
            emit PromoStarted(codes[i], percent, ndays);
        }
    }

    function endPromo(bytes32 code) external onlyAdmin {
        Promo storage p = productPromos[code];
        p.end = block.timestamp;
        p.state = State.Expired;
        emit PromoEnded(code);
    }

    function isPromoActive(bytes32 code) public view returns (bool) {
        Promo memory p = productPromos[code];
        return p.state == State.Active &&
            block.timestamp >= p.start &&
            block.timestamp <= p.end;
    }

    function getProducts(bool filterInStock, bool filterInPromo)
    public
    view
    returns (Product[] memory)
    {
        uint count = 0;

        for (uint i = 0; i < products.length; i++) {
            if ((!filterInStock || products[i].inStock) &&
                (!filterInPromo || isPromoActive(products[i].code))) {
                count++;
            }
        }

        Product[] memory result = new Product[](count);
        uint j = 0;
        for (uint i = 0; i < products.length; i++) {
            if ((!filterInStock || products[i].inStock) &&
                (!filterInPromo || isPromoActive(products[i].code))) {
                result[j] = products[i];
                j++;
            }
        }

        return result;
    }

    function getProductsWithPrices() external view returns (
        Product[] memory productList
    ) {
        productList = new Product[](products.length);

        for (uint i = 0; i < products.length; i++) {
            productList[i] = products[i];
            productList[i].price = calculateFinalPrice(products[i].code);
        }
    }

    function getProductCount() external view returns (uint) {
        return products.length;
    }
}