import { FC, useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import styles from './FeedbackModal.module.scss';
import useConfig from "../../hooks/useConfig";
import { toast } from "react-fox-toast";
import { SmallSpinner } from "../SmallSpinner/smallSpinner";
import { submitFeedback } from "../../api/feedbackApi";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'general';

const FeedbackModal: FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const { chain } = useParams();
    const { getChain } = useConfig();
    const chainConfig = chain ? getChain(chain) : null;
    
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const modalRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!message.trim()) {
            toast.error('Please enter your feedback message');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await submitFeedback({
                type: feedbackType,
                message: message.trim(),
                email: email.trim() || undefined,
                chain: chainConfig?.name || 'Unknown',
                chainId: chain || 'unknown',
                timestamp: new Date().toISOString(),
                url: window.location.href,
                path: window.location.pathname
            });
            
            toast.success('Thank you for your feedback!');
            
            // Reset form
            setMessage('');
            setEmail('');
            setFeedbackType('general');
            
            // Close modal after short delay
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modalContainer}>
                <div className={styles.modal} ref={modalRef}>
                    <div className={styles.modalHeader}>
                        <h3>Send Feedback</h3>
                        <button 
                            className={styles.closeButton}
                            onClick={onClose}
                            type="button"
                            aria-label="Close"
                        >
                            <FaTimes />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className={styles.modalBody}>
                        <div className={styles.formGroup}>
                            <label htmlFor="feedback-type">Feedback Type</label>
                            <select
                                id="feedback-type"
                                value={feedbackType}
                                onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                                disabled={isSubmitting}
                            >
                                <option value="general">General Feedback</option>
                                <option value="bug">Bug Report</option>
                                <option value="feature">Feature Request</option>
                            </select>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="feedback-message">
                                Message <span className={styles.required}>*</span>
                            </label>
                            <textarea
                                id="feedback-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Please share your feedback, bug report, or feature request..."
                                rows={6}
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="feedback-email">
                                Email (optional)
                            </label>
                            <input
                                id="feedback-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                disabled={isSubmitting}
                            />
                            <small className={styles.helpText}>
                                Provide your email if you'd like us to follow up
                            </small>
                        </div>
                        
                        {chainConfig && (
                            <div className={styles.contextInfo}>
                                <small>Feedback for: {chainConfig.name}</small>
                            </div>
                        )}
                        
                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        Sending <SmallSpinner />
                                    </>
                                ) : (
                                    'Send Feedback'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default FeedbackModal; 