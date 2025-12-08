import {useNavigate} from 'react-router-dom';
import {useWallet} from '../utils/Context.jsx';
import {connectWalletMetamask, getContractParams} from '../utils/EthersUtils.jsx';
import '../styles/Welcome.css';

export const Welcome = () => {
    const {initializeWallet} = useWallet();
    const navigate = useNavigate();

    const accountChangedHandler = async (signer) => {
        initializeWallet(signer);

        // Fetch contract parameters to determine navigation
        const params = await getContractParams();
        const now = Math.floor(Date.now() / 1000);

        // Check if registration is still active
        if (now < params.endRegister) {
            navigate('/project-form');
        } else if (now < params.endVoting) {
            navigate('/voting');
        } else {
            navigate('/voting');
        }
    };

    const handleConnectMetaMaskButtonClick = () => {
        connectWalletMetamask(accountChangedHandler);
    };

    return (
        <div className="welcome-container">
            <div className="welcome-content">
                <div className="welcome-icon">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <path d="M40 10L15 25V55L40 70L65 55V25L40 10Z" stroke="currentColor" strokeWidth="3" fill="none"/>
                        <path d="M40 30L28 37V51L40 58L52 51V37L40 30Z" fill="currentColor"/>
                        <circle cx="40" cy="40" r="5" fill="white"/>
                    </svg>
                </div>
                <h1>Student Project Voting</h1>
                <p className="welcome-subtitle">
                    Connect your wallet to vote for the best student projects
                </p>
                <button className="connect-button" onClick={handleConnectMetaMaskButtonClick}>
                    Connect With MetaMask
                </button>
                <p className="welcome-note">
                    Make sure you have MetaMask installed and are registered to vote
                </p>
            </div>
        </div>
    );
};
