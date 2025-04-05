import { FC, useMemo } from "react";
import styles from './ResponseRow.module.scss';
import { isJson } from "../../utils/messageParsing";
import JsonView from "react18-json-view";

interface ResponseRowProps {
    responseData: string;
    messageIndex: number;
    messageTitle: string;
}

const ResponseRow: FC<ResponseRowProps> = ({ responseData, messageIndex, messageTitle }) => {
    // Strip control characters to test if JSON
    // eslint-disable-next-line no-control-regex
    const cleaned = responseData.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    const json = useMemo(()=>isJson(cleaned), [cleaned]);

    return (
        <div className={styles.responseRow}>
            <h4>#{messageIndex + 1} {messageTitle}</h4>
            <div>
                { json ?
                    <JsonView src={JSON.parse(cleaned)} />
                :
                    <div>{responseData}</div>
                }
            </div>
        </div>
    );
};

export default ResponseRow; 