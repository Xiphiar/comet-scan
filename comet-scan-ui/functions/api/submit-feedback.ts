export async function onRequestPost(context: {
    request: Request;
    env: {
        DISCORD_WEBHOOK_URL: string;
    };
}) {
    try {
        // Parse request body
        const body = await context.request.json();
        
        // Validate required fields
        if (!body.message || !body.type) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
        
        // Format feedback type for display
        const feedbackTypeDisplay = {
            bug: '🐛 Bug Report',
            feature: '✨ Feature Request',
            general: '💬 General Feedback',
        }[body.type] || '📝 Feedback';
        
        // Create Discord webhook payload
        const discordPayload = {
            embeds: [{
                title: feedbackTypeDisplay,
                color: body.type === 'bug' ? 0xFF0000 : body.type === 'feature' ? 0x00FF00 : 0x0099FF,
                fields: [
                    {
                        name: 'Page',
                        value: body.path || '/',
                        inline: true,
                    },
                    {
                        name: 'Chain',
                        value: body.chain || 'Unknown',
                        inline: true,
                    },
                    {
                        name: 'Chain ID',
                        value: body.chainId || 'unknown',
                        inline: true,
                    },
                    {
                        name: 'Timestamp',
                        value: new Date(body.timestamp).toLocaleString('en-US', {
                            timeZone: 'UTC',
                            dateStyle: 'medium',
                            timeStyle: 'medium',
                        }) + ' UTC',
                        inline: false,
                    },
                    {
                        name: 'Message',
                        value: body.message.substring(0, 1024), // Discord field limit
                        inline: false,
                    },
                ],
                footer: {
                    text: body.email ? `Email: ${body.email}` : 'No email provided',
                },
                timestamp: body.timestamp,
                url: body.url,
            }],
        };
        
        // Add email to a separate field if message was truncated
        if (body.message.length > 1024) {
            discordPayload.embeds[0].fields.push({
                name: 'Message (continued)',
                value: body.message.substring(1024, 2048),
                inline: false,
            });
        }
        
        // Send to Discord webhook
        const discordResponse = await fetch(context.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(discordPayload),
        });
        
        if (!discordResponse.ok) {
            console.error('Discord webhook error:', await discordResponse.text());
            throw new Error('Failed to send to Discord');
        }
        
        // Return success response
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
        
    } catch (error) {
        console.error('Feedback submission error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
} 