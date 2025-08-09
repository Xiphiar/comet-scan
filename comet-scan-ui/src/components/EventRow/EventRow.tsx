import { FC, useEffect, useMemo, useState } from "react";
import styles from './EventRow.module.scss';
import { TxEvent } from "@comet-scan/types";
import { defaultKeyContent } from "../../utils/messageParsing";
import { FaChevronDown } from "react-icons/fa";
import { useUser } from "../../hooks/useUser";
import { useParams } from "react-router-dom";
import useConfig from "../../hooks/useConfig";

interface EventRowProps {
    events: TxEvent[];
    messageIndex: number;
    messageTitle: string;
}

// Type for processed event with filtered attributes
interface ProcessedEvent extends TxEvent {
    filteredAttributes: {
        key: string;
        value: string;
        index?: boolean;
    }[];
}

// Function to check if a string is likely base64 encoded
const isBase64 = (str: string): boolean => {
    // Base64 strings contain only these characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    
    // Check if it matches the regex
    if (!base64Regex.test(str)) {
        return false;
    }
    
    // Base64 encoding always produces strings with a length that is a multiple of 4
    // If there's padding, it should have the correct amount (1-2 '=' characters at the end)
    if (str.endsWith('=')) {
        const paddingLength = str.length - str.trimEnd().length;
        if (paddingLength > 2) {
            return false;
        }
    }
    
    // For additional strictness, check that it has a reasonable length
    // (too short strings are unlikely to be base64 encoded data)
    return str.length > 8;
};

const EventRow: FC<EventRowProps> = ({ events, messageIndex, messageTitle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useUser();
    const { chain: chainLookupId } = useParams();
    const { getChain } = useConfig();
    const chain = getChain(chainLookupId);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    // Pre-compute encrypted attributes count and filtered events
    const { encryptedAttributesCount, processedEvents } = useMemo(() => {
        let count = 0;
        const processed = events.map(event => {
            // Filter out encrypted attributes
            const filteredAttributes = event.attributes.filter(attr => {
                // Check if event is wasm and key is base64
                if (event.type === 'wasm' && isBase64(attr.key)) {
                    count++;
                    return false;
                }
                return true;
            });
            
            return {
                ...event,
                filteredAttributes
            } as ProcessedEvent;
        });
        
        return { encryptedAttributesCount: count, processedEvents: processed };
    }, [events]);
    
    return (
        <div className={styles.eventRow}>
            <div 
                className={styles.eventHeader} 
                onClick={toggleAccordion}
            >
                <h4>#{messageIndex + 1} {messageTitle}</h4>
                <FaChevronDown className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`} />
            </div>
            {isOpen && (
                <div className={`d-flex flex-column gap-2 w-full pt-2 ${styles.eventContent}`}>
                    {(!user && chain.features?.includes('secretwasm') && encryptedAttributesCount > 0) && (
                        <div className="alertContainer mb-3">
                            Connect your wallet to decrypt encrypted events
                        </div>
                    )}
                    {processedEvents.map((event, eventIndex) => (
                        <div key={eventIndex} className={styles.eventItem}>
                            <h5>Event: {event.type}</h5>
                            <div className='d-flex flex-column gap-2 w-full mt-2'>
                                {event.filteredAttributes.map((attr, attrIndex) => (
                                    <div className='d-flex flex-wrap w-full' key={attrIndex}>
                                        <div className='col col-12 col-sm-3 font-weight-bold'>{attr.key}</div>
                                        <div className='col ms-3 ms-sm-0 text-break'>{defaultKeyContent(attr.value)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {encryptedAttributesCount > 0 && (
                        <div className={styles.encryptedNotice}>
                            {encryptedAttributesCount} encrypted {encryptedAttributesCount === 1 ? 'attribute' : 'attributes'} not displayed.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventRow; 