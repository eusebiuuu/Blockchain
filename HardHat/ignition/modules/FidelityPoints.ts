import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FidelityPointsModule", (m: any) => {
    const pointValue = 7;

    const fidelityPoints = m.contract("FidelityPoints", [pointValue]);

    // m.call(fidelityPoints, "setPointValue", [10]);

    return { fidelityPoints };
});
