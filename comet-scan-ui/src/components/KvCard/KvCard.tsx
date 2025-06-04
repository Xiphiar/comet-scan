import { FC, ReactNode } from "react";
import Card from "../Card";

type Props = {
    kvPairs: Array<[string, (string | ReactNode)]>
}

const KvCard: FC<Props> = ({kvPairs}) => {

    return (
        <Card conentClassName='d-flex flex-column gap-3 pt-4'>
            {kvPairs.map(([key, value], i) =>
                <div className='d-flex flex-wrap' key={`${key}-${i}`}>
                    <div className='col-12 col-md-3' style={{fontWeight: 600}}>{key}</div>
                    <div className='col'>{value}</div>
                </div>
            )}
        </Card>
    )
}

export default KvCard;