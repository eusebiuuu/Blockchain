import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CatalogModule", (m: any) => {
    const catalog = m.contract("Catalog", []);

    // m.call(fidelityPoints, "setPointValue", [10]);

    return { catalog };
});
