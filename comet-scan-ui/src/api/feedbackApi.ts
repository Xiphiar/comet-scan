interface FeedbackData {
    type: 'bug' | 'feature' | 'general';
    message: string;
    email?: string;
    chain: string;
    chainId: string;
    timestamp: string;
    url: string;
    path: string;
}

export const submitFeedback = async (data: FeedbackData): Promise<void> => {
    const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to submit feedback: ${response.statusText}`);
    }
    
    return response.json();
}; 