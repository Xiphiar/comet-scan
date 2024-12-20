import NodeCache from "node-cache";

export const Cache = new NodeCache({
    stdTTL: 60,
    checkperiod: 300,
    deleteOnExpire: true,
});