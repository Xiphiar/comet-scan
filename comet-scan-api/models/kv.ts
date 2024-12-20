import mongoose from "mongoose";

export interface KV {
    chainId: string;
    key: string;
    value: string;
}

const kvSchema = new mongoose.Schema<KV>({
    chainId: {
        type: String,
        required: true,
        index: true,
    },
    key: {
        type: String,
        required: true,
        index: true,
    },
    value: {
        type: String,
        required: true,
    },
});

const KvStore = mongoose.model<KV>('KVStore', kvSchema);

export default KvStore;