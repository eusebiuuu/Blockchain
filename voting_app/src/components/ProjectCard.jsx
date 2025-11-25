import React from 'react';
import '../styles/ProjectCard.css';

const ProjectCard = ({project, isVoted, onVote, canVote}) => {
    const handleVoteClick = () => {
        if (canVote) {
            onVote(project.id);
        }
    };

    return (
        <div className={`project-card ${isVoted ? 'voted' : ''}`}>
            <div className="project-image">
                <img src={project.image} alt={project.name} />
                <button
                    className={`vote-button ${isVoted ? 'active' : ''} ${!canVote ? 'disabled' : ''}`}
                    onClick={handleVoteClick}
                    disabled={!canVote}
                    title={canVote ? (isVoted ? 'Remove vote' : 'Vote for this project') : 'Voting token required'}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isVoted ? 'currentColor' : 'none'} stroke={isVoted ? 'currentColor' : 'currentColor'} strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                </button>
            </div>

            <div className="project-content">
                <h3 className="project-name">{project.name}</h3>
                <p className="project-team">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 2c-3.33 0-6 1.34-6 3v1h12v-1c0-1.66-2.67-3-6-3z"/>
                    </svg>
                    {project.team}
                </p>

                <p className="project-votes">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1.333l2.06 4.173 4.607.67-3.334 3.25.787 4.584L8 11.777l-4.12 2.166.787-4.584-3.334-3.25 4.607-.67L8 1.333z"/>
                    </svg>
                    {project.voteCount} votes
                </p>

                <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-github"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    View on GitHub
                </a>
            </div>
        </div>
    );
};

export default ProjectCard;
