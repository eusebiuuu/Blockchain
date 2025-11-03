// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Catalog {

    enum State { Idle, Active, Expired }

    struct Promo {
        State state;
        uint start;
        uint end;
        uint percent;
        bytes32[] products;
    }

    struct Product {
        bytes32 code;
        string description;
        uint quantity;
        uint price;
    }

    bytes32[] productsList;

    mapping(bytes32 => Promo) public promos;
    mapping(bytes32 => Product) public products;

    address admin;

    event DecreaseProductQuantity(bytes32 productCode, uint ammount, uint currentAmmount);
    event PrintProductCode(bytes32 productCode);

    constructor() {
        admin = msg.sender;
    }

    function addProduct(bytes32 code, string memory description, uint price, uint quantity) public {
        products[code] = Product({
            code: code,
            description: description,
            price: price,
            quantity: quantity
        });

        productsList.push(code);
    }

    function discoverProducts() external {
        for (uint i = 0; i < productsList.length; ++i) {
            emit PrintProductCode(productsList[i]);
        }
    }

    function addProductToPromo(bytes32 promoCode, bytes32 productCode) external {
        promos[promoCode].products.push(productCode);
    }

    function addPromo(bytes32 code, uint ndays, uint percent, bytes32[] memory productCodes) external {
        promos[code] = Promo({
            start: block.timestamp,
            end: block.timestamp + (ndays * 24 * 60 * 60),
            state: State.Idle,
            percent: percent,
            products: productCodes
        });
    }

    function startPromo(bytes32 code) external {
        promos[code].state = State.Active;
    }

    function increaseQuantity(bytes32 productCode, uint ammount) external {
        products[productCode].quantity += ammount;
    }

    function decreaseQuantity(bytes32 productCode, uint ammount) external {
        if (products[productCode].quantity >= ammount) {
            products[productCode].quantity -= ammount;
        } else {
            emit DecreaseProductQuantity(productCode, ammount, products[productCode].quantity);
        }
    }

    function endPromo(bytes32 promoCode) external {
        promos[promoCode].state = State.Expired;
    }
}