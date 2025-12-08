import '../styles/ProjectForm.css';
import React, {useState, useEffect, useCallback} from 'react';
import {useWallet} from '../utils/Context.jsx';
import {
    registerProposal,
    registerVoter,
    getContractParams,
    setupMetaMaskListeners
} from '../utils/EthersUtils';
import {pinata} from '../utils/Pinata.jsx';
import {useNavigate} from "react-router-dom";

export const ProjectForm = () => {

    const navigate = useNavigate();
    const {wallet, initializeWallet} = useWallet();
    const [ethereumAddress, setEthereumAddress] = useState('');

    const [timeLeft, setTimeLeft] = useState({days: 0, hours: 0, minutes: 0, seconds: 0});
    const [registrationDeadline, setRegistrationDeadline] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [projectName, setProjectName] = useState('');
    const [teamName, setTeamName] = useState('');
    const [gitAddress, setGitAddress] = useState('');
    const [participant1, setParticipant1] = useState('');
    const [participant2, setParticipant2] = useState('');

    // Image upload state
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Token state
    const [votingToken, setVotingToken] = useState('');
    const [registerToken, setRegisterToken] = useState('');
    const [showTokenModal, setShowTokenModal] = useState(false);

    // Fetch contract parameters on component mount
    useEffect(() => {
        const fetchParams = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = await getContractParams();
                setRegistrationDeadline(new Date(params.endRegister * 1000));

            } catch (err) {
                console.error("Error fetching contract params:", err);
                setError("Failed to load contract parameters. Please make sure you're connected to the correct network.");
            } finally {
                setLoading(false);
            }
        };

        fetchParams();
    }, [wallet]);

    // Setup MetaMask listeners for account and network changes
    useEffect(() => {
        const handleAccountChanged = (newAccount) => {
            console.log('Account changed, redirecting to login...');
            initializeWallet(null);
            navigate('/');
        };

        const handleNetworkChanged = (chainId) => {
            console.log('Network changed, redirecting to login...');
            initializeWallet(null);
            navigate('/');
        };

        const cleanup = setupMetaMaskListeners(handleAccountChanged, handleNetworkChanged);

        return () => {
            cleanup();
        };
    }, [navigate, initializeWallet]);

    const fetchAddress = useCallback(() => {
        if (wallet?.address) {
            setEthereumAddress(wallet.address);
        }
    }, [wallet]);

    const calculateTimeLeft = useCallback(() => {
        const difference = registrationDeadline - new Date();

        if (difference > 0) {
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            });
        } else {
            setTimeLeft({days: 0, hours: 0, minutes: 0, seconds: 0});
        }
    }, [registrationDeadline]);

    useEffect(() => {
        fetchAddress();
    }, [fetchAddress]);

    useEffect(() => {
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                alert('Image size must be less than 5MB');
                return;
            }

            setImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadImage = async () => {
        if (!imageFile) {
            alert('Please select an image first!');
            return;
        }

        try {
            setUploading(true);

            // Upload to Pinata
            const upload = await pinata.upload.public.file(imageFile);

            // Get the gateway URL
            const url = await pinata.gateways.public.convert(upload.cid);

            setImageUrl(url);
            alert('Image uploaded successfully!');
            console.log('Image URL:', url);

        } catch (err) {
            console.error('Error uploading image:', err);
            alert('Failed to upload image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageUrl('');
    };

    const handleGetVotingToken = async () => {
        if (!wallet) {
            alert("Please connect your wallet first!");
            return;
        }

        if (!registerToken.trim()) {
            alert("Please enter a registration token!");
            return;
        }

        try {
            setSubmitting(true);
            const registration = await registerVoter(wallet, registerToken);
            console.log(registration.receipt);
            setVotingToken("Token registered successfully!");
            alert("Voting token registered successfully! Save your registration token for voting. " + registration.votingToken);
            setRegisterToken('');
            setShowTokenModal(false);
        } catch (err) {
            console.error("Error registering voter:", err);
            alert("Failed to register voting token: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegisterProject = async (e) => {
        e.preventDefault();

        if (!wallet) {
            alert("Please connect your wallet first!");
            return;
        }

        if (!projectName.trim() || !teamName.trim() || !gitAddress.trim() || !participant1.trim() || !participant2.trim()) {
            alert("Please fill in all fields!");
            return;
        }

        if (!imageUrl) {
            alert("Please upload a project image first!");
            return;
        }

        try {
            setSubmitting(true);

            await registerProposal(wallet, projectName, teamName, gitAddress, imageUrl, participant1, participant2);

            alert("Project registered successfully!");

            // Clear form
            setProjectName('');
            setTeamName('');
            setGitAddress('');
            setParticipant1('');
            setParticipant2('');
            handleRemoveImage();

        } catch (err) {
            console.error("Error registering project:", err);
            alert("Failed to register project: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const handleLogout = () => {
        initializeWallet(null);
        navigate('/');
    };

    if (loading) {
        return (
            <div className="project-form-container">
                <h2>Loading...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="project-form-container">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="project-form-container">
            <header className="project-form-header">
                <div className="header-user">
                    <div className="user-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z"/>
                        </svg>
                    </div>
                    <span className="user-address">{formatAddress(ethereumAddress)}</span>
                </div>

                <div className="header-timer">
                    <div className="timer-display">
                        <div className="timer-unit">
                            <span className="timer-value">{timeLeft.days}</span>
                            <span className="timer-text">days</span>
                        </div>
                        <span className="timer-separator">:</span>
                        <div className="timer-unit">
                            <span className="timer-value">{String(timeLeft.hours).padStart(2, '0')}</span>
                            <span className="timer-text">hours</span>
                        </div>
                        <span className="timer-separator">:</span>
                        <div className="timer-unit">
                            <span className="timer-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
                            <span className="timer-text">min</span>
                        </div>
                        <span className="timer-separator">:</span>
                        <div className="timer-unit">
                            <span className="timer-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
                            <span className="timer-text">sec</span>
                        </div>
                    </div>
                </div>

                <button
                    className="token-button"
                    onClick={() => setShowTokenModal(true)}
                    title="Get voting token"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                    </svg>
                    Get Voting Token
                </button>

                <button
                    className="submit-project-button"
                    onClick={handleRegisterProject}
                    disabled={submitting || !imageUrl}
                    title="Register your project"
                >
                    {submitting ? (
                        <>
                            <svg className="spinner" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3"
                                        strokeDasharray="15 35"/>
                            </svg>
                            Registering...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                            </svg>
                            Register Project
                        </>
                    )}
                </button>

                <button className="logout-button" onClick={handleLogout} title="Logout">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 11-2 0V4H5v12h10v-2a1 1 0 112 0v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3z"/>
                        <path
                            d="M13 10a1 1 0 011-1h3.586l-1.293-1.293a1 1 0 011.414-1.414l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L17.586 11H14a1 1 0 01-1-1z"/>
                    </svg>
                </button>
            </header>

            <main className="project-form-main">
                <h1 className="page-title">Register Your Project</h1>
                <p className="page-subtitle">
                    Fill in the details below to register your project for voting
                </p>

                <form className="registration-form" onSubmit={handleRegisterProject}>
                    <div className="form-group">
                        <label htmlFor="projectName">Project Name</label>
                        <input
                            type="text"
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter project name (max 32 characters)"
                            maxLength="32"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="teamName">Team Name</label>
                        <input
                            type="text"
                            id="teamName"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter team name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="gitAddress">GitHub Repository URL</label>
                        <input
                            type="url"
                            id="gitAddress"
                            value={gitAddress}
                            onChange={(e) => setGitAddress(e.target.value)}
                            placeholder="https://github.com/username/repo"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="participant1">Participant 1</label>
                            <input
                                type="text"
                                id="participant1"
                                value={participant1}
                                onChange={(e) => setParticipant1(e.target.value)}
                                placeholder="First team member name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="participant2">Participant 2</label>
                            <input
                                type="text"
                                id="participant2"
                                value={participant2}
                                onChange={(e) => setParticipant2(e.target.value)}
                                placeholder="Second team member name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="projectImage">Project Image</label>
                        <div className="image-upload-container">
                            {!imagePreview ? (
                                <div className="image-upload-area">
                                    <input
                                        type="file"
                                        id="projectImage"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleImageChange}
                                        className="image-input"
                                    />
                                    <label htmlFor="projectImage" className="image-upload-label">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                            <polyline points="21 15 16 10 5 21"/>
                                        </svg>
                                        <span>Click to upload image</span>
                                        <span className="upload-hint">PNG, JPG, GIF or WebP (max 5MB)</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="image-preview-container">
                                    <img src={imagePreview} alt="Project preview" className="image-preview" />
                                    <div className="image-actions">
                                        <button
                                            type="button"
                                            onClick={handleUploadImage}
                                            disabled={uploading || imageUrl}
                                            className="upload-button"
                                        >
                                            {uploading ? 'Uploading...' : imageUrl ? '✓ Uploaded' : 'Upload to IPFS'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="remove-button"
                                            disabled={uploading}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    {imageUrl && (
                                        <p className="upload-success">✓ Image uploaded successfully</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </main>

            {showTokenModal && (
                <div className="modal-overlay" onClick={() => setShowTokenModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Get Voting Token</h2>
                        <p>Enter your registration token to receive your voting token</p>

                        <div className="form-group">
                            <label htmlFor="registerToken">Registration Token</label>
                            <input
                                type="text"
                                id="registerToken"
                                value={registerToken}
                                onChange={(e) => setRegisterToken(e.target.value)}
                                placeholder="Enter your registration token"
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="modal-button primary"
                                onClick={handleGetVotingToken}
                                disabled={submitting}
                            >
                                {submitting ? 'Processing...' : 'Get Token'}
                            </button>
                            <button
                                className="modal-button secondary"
                                onClick={() => setShowTokenModal(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};