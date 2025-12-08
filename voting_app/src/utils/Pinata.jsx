import { PinataSDK } from "pinata";
import { pinataJwt, pinataGateway } from '../config'


export const pinata = new PinataSDK({
    pinataJwt,
    pinataGateway,
});