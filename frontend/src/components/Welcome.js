import { useNavigate} from 'react-router-dom';

import logo from './logo.svg';
import '../styles/App.css';

import {useWallet} from '../utils/Context';
import {connectWalletMetamask} from '../utils/EthersUtils'


export const Welcome = () => {
    const {initializeWallet} = useWallet();
    const navigate = useNavigate();

    const accountChangedHandler = async (signer) => {
        initializeWallet(signer);
    };


    // The accountChangedHandler function is passed as a callback to be executed when the account changes
    const handleConnectMetaMaskButtonClick = () => {
        connectWalletMetamask(accountChangedHandler).then(() => {;

            navigate('/Catalog'); }).catch((reason) => {

            console.log("not connected");

        });
    };


    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <button onClick={handleConnectMetaMaskButtonClick}>
                    Connect With Metamask
                </button>
            </header>
        </div>
    )
}
