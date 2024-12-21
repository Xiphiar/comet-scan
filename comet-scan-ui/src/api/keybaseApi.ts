import axios from "axios"

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

// TODO move this to the backend with a long cache
const keyPrefix = `keybase-avatar`
export const getKeybaseAvatar = async (identity?: string): Promise<string | undefined> => {
  try {
    if (!identity) return undefined;
    const cached = localStorage.getItem(`${keyPrefix}-${identity}`);
    if (cached) return cached;

    const {data} = await axios.get<KeybaseImageProfileResponse>(`https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${identity}&fields=pictures`);
    if (!data?.them.length || !data?.them[0].pictures.primary.url) return undefined;

    localStorage.setItem(`${keyPrefix}-${identity}`, data.them[0].pictures.primary.url)
    return data.them[0].pictures.primary.url;
  } catch (err: any) {
    console.error('Error getting keybase avatar:', err.toString())
    return undefined;
  }
}