import '../styles/Voting.css';
import React, {useState, useEffect, useCallback} from 'react';
import {useWallet} from '../utils/Context.jsx';
import {
    getActiveProposals,
    castVote,
    hasVoted,
    getContractParams,
    subscribeToVoteCastEvents,
    setupMetaMaskListeners
} from '../utils/EthersUtils';
import ProjectCard from './ProjectCard.jsx';
import {useNavigate} from "react-router-dom";

export const Voting = () => {

    const navigate = useNavigate();
    const {wallet, initializeWallet} = useWallet();
    const [ethereumAddress, setEthereumAddress] = useState('');

    const [timeLeft, setTimeLeft] = useState({days: 0, hours: 0, minutes: 0, seconds: 0});
    const [votedProjects, setVotedProjects] = useState(new Set());

    const [hasVotingToken, setHasVotingToken] = useState(true); // Dummy token for now
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState([]);
    const [maxVotes, setMaxVotes] = useState(3);
    const [votingDeadline, setVotingDeadline] = useState(new Date());
    const [userHasVoted, setUserHasVoted] = useState(false);
    const [votingInProgress, setVotingInProgress] = useState(false);

    // Fetch active projects on component mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch contract parameters
                const params = await getContractParams();
                setMaxVotes(params.maxVotes);
                setVotingDeadline(new Date(params.endVoting * 1000));

                // Fetch active projects
                const activeProjects = await getActiveProposals();
                setProjects(activeProjects);

                // Check if user has already voted
                if (wallet && wallet.address) {
                    const voted = await hasVoted(wallet.address);
                    setUserHasVoted(voted);
                    console.log("hasVoted", voted);
                }

            } catch (err) {
                console.error("Error fetching projects:", err);
                setError("Failed to load projects. Please make sure you're connected to the correct network.");
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [wallet]);


    // Setup MetaMask listeners for account and network changes
    useEffect(() => {
        const handleAccountChanged = (newAccount) => {
            console.log('Account changed, redirecting to login...');
            // Clear wallet state
            initializeWallet(null);
            // Redirect to welcome page
            navigate('/');
        };

        const handleNetworkChanged = (chainId) => {
            console.log('Network changed, redirecting to login...');
            // Clear wallet state
            initializeWallet(null);
            // Redirect to welcome page
            navigate('/');
        };

        // Setup listeners
        const cleanup = setupMetaMaskListeners(handleAccountChanged, handleNetworkChanged);

        // Cleanup on unmount
        return () => {
            cleanup();
        };
    }, [navigate, initializeWallet]);

    useEffect(() => {
        const handleVoteCast = (voteData) => {
            // Updates vote count for the specific project
            setProjects(prevProjects =>
                prevProjects.map(project =>
                    project.id === voteData.proposalIndex
                        ? {...project, voteCount: project.voteCount + 1}
                        : project
                )
            );
        };

        const unsubscribe = subscribeToVoteCastEvents(handleVoteCast);
        return () => unsubscribe(); // Cleanup
    }, []);

    const fetchAddress = useCallback(() => {
        if (wallet?.address) {
            setEthereumAddress(wallet.address);
        }

    }, [wallet]);

    const calculateTimeLeft = useCallback(() => {
        const difference = votingDeadline - new Date();

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
    }, [votingDeadline]);

    useEffect(() => {
        fetchAddress();
    }, [fetchAddress]);

    useEffect(() => {
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    const handleSelectProject = (projectId) => {
        if (!hasVotingToken) {
            alert("You need a voting token to vote!");
            return;
        }

        const newVotedProjects = new Set(votedProjects);

        if (newVotedProjects.has(projectId)) {
            // Remove vote
            newVotedProjects.delete(projectId);
        } else {
            // Add vote if under limit
            if (newVotedProjects.size >= maxVotes) {
                alert(`You can only vote for ${maxVotes} projects!`);
                return;
            }
            newVotedProjects.add(projectId);
        }

        setVotedProjects(newVotedProjects);
        // TODO: Call smart contract function to record vote
    };

    const handleSubmitVote = async () => {
        if (votedProjects.size === 0) {
            alert("Please select at least one project to vote for!");
            return;
        }

        if (!wallet) {
            alert("Please connect your wallet first!");
            return;
        }

        if (userHasVoted) {
            alert("You have already voted!");
            return;
        }

        try {
            setVotingInProgress(true);

            // Convert Set to Array for contract call
            const selectedProjectIds = Array.from(votedProjects);

            // TODO: Get the signed token from registration/signing flow
            const signedToken = "0x...";

            await castVote(wallet, selectedProjectIds, signedToken);

            alert("Vote submitted successfully!");
            setUserHasVoted(true);

            // Refresh projects to show updated vote counts
            //const updatedProjects = await getActiveProposals();
            //setProjects(updatedProjects);

        } catch (err) {
            console.error("Error submitting vote:", err);
            alert("Failed to submit vote: " + err.message);
        } finally {
            setVotingInProgress(false);
        }
    }

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
            <div className="voting-container">
                <h2>Loading Projects...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="voting-container">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="voting-container">
            <header className="voting-header">
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

                <div className="header-votes">
                    <span className="votes-count">{votedProjects.size}/{maxVotes}</span>
                </div>


                <button
                    className="submit-vote-button"
                    onClick={handleSubmitVote}
                    disabled={votedProjects.size === 0 || userHasVoted || votingInProgress}
                    title={userHasVoted ? "Already voted" : "Submit your votes"}
                >
                    {votingInProgress ? (
                        <>
                            <svg className="spinner" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3"
                                        strokeDasharray="15 35"/>
                            </svg>
                            Voting...
                        </>
                    ) : userHasVoted ? (
                        <>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                            </svg>
                            Voted
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            Vote Now
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

            <main className="voting-main">
                {!userHasVoted && (
                    <div>

                        <h1 className="page-title">Vote for Student Projects</h1>
                        <p className="page-subtitle">
                            Select up to {maxVotes} projects to support. Click the star to vote.
                        </p>
                    </div>)}

                {!hasVotingToken && (
                    <div className="warning-banner">
                        ⚠️ You don't have a voting token. Please register to vote.
                    </div>
                )}


                {userHasVoted && (
                    <div className="success-banner">
                        ✓ Thank you for voting! Your vote has been recorded.
                    </div>
                )}

                <div className="projects-grid">
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isVoted={votedProjects.has(project.id)}
                            onVote={handleSelectProject}
                            canVote={hasVotingToken}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};
