export type DenomMetadata = {
    description: string
    denom_units: Array<{
      denom: string
      exponent: number
      aliases: Array<any>
    }>
    base: string
    display: string
    name: string
    symbol: string
    uri: string
    uri_hash: string
}

export type LcdDenomMetadataResponse = {
    metadatas: DenomMetadata[];
    pagination: {
        next_key: string,
        total: string, //Number string
    }
}