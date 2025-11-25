import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Rand", (m) => {

    const subscriptionId = "31310251188893131958716939446977888937706318762055516533501865152950512114584";
    const rand = m.contract("Rand",[subscriptionId]);

    return { rand };
});
