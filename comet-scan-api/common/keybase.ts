import axios from "axios";
import { Cache } from "./cache";

export type KeybaseImageProfileResponse = {
    status: {
        code: number
        name: string
    }
    them: Array<{
        id: string
        pictures?: {
            primary?: {
                url: string | undefined
                source: string | null
            }
        }
    }>
}

// This shouldn't need cache since it's only used when a validator's identity changes
const keyPrefix = `keybase-avatar`
export const getKeybaseAvatar = async (identity?: string): Promise<string | undefined> => {
  try {
    if (!identity) return undefined;
    // const cached = Cache.get<string>(`${keyPrefix}-${identity}`);
    // if (cached) {
    //     if (cached.length) return cached;
    //     else return undefined;
    // }

    const {data} = await axios.get<KeybaseImageProfileResponse>(`https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}&fields=pictures`);
    let url = '';
    if (data?.them?.length) url = data?.them[0].pictures?.primary?.url || '';


    // Cache.set(`${keyPrefix}-${identity}`, url, 60 * 60 * 24)

    if (url.length) return url;
    else return undefined;
  } catch (err: any) {
    console.error('Error getting keybase avatar:', err.toString())
    return undefined;
  }
}