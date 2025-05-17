import { ibcDenom } from 'secretjs'

// This data was sourced from https://github.com/scrtlabs/dash.scrt.network/blob/master/src/utils/config.ts
// Regex to remove the `deposits` and `withdrawals` fields: /deposits: \[(.|\n)*?\],\n    withdrawals: \[(.|\n)*?\]/

export type Token = {
  /** display name of the token */
  name: string
  /** Short description of the token (e.g. Private SCRT) */
  description?: string
  /** a snip20 token that's originated from Secret Network */
  is_snip20?: boolean
  /** a ICS20 token that's originated from Secret Network */
  is_axelar_asset?: boolean
  /** secret contract address of the token */
  axelar_denom?: string
  /** denom name of ICS20 token in axelar */
  address: string
  /** secret contract code hash of the token */
  code_hash: string
  /** logo of the token */
  image: string
  /** decimals of the token */
  decimals: number
  /** coingeck id to get usd price */
  coingecko_id: string
}

// Native tokens of chains (and tokens from external chains)
export const tokens: Token[] = [
  {
    name: 'SCRT',
    description: 'Secret',
    address: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek',
    code_hash: 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e',
    image: '/scrt.svg',
    decimals: 6,
    coingecko_id: 'secret',
    
  },
  {
    name: 'AKT',
    description: 'Akash Governance Token',
    address: 'secret168j5f78magfce5r2j4etaytyuy7ftjkh4cndqw',
    code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    image: '/akt.svg',
    decimals: 6,
    coingecko_id: 'akash-network',
    
  },
  {
    name: 'ampBTC',
    description: 'ERIS staked BTC',
    address: 'secret10fnn57cdxqksgqprtvp27d3ykkgyffv9n0gnal',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/ampwhale.svg',
    decimals: 8,
    coingecko_id: '',
    
  },
  {
    name: 'ampKUJI',
    description: 'ERIS staked KUJI',
    address: 'secret1pf6n6j8xlkxnga5t8w8exdtvcrrjgqms5wdlnj',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/ampkuji.svg',
    decimals: 6,
    coingecko_id: 'eris-staked-kuji',
    
  },
  {
    name: 'ampLUNA',
    description: 'ERIS staked LUNA',
    address: 'secret1cycwquhh63qmc0qgfe76eed6a6yj5x4vzlu3rc',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/ampluna.svg',
    decimals: 6,
    coingecko_id: 'eris-amplified-luna',
    
  },
  {
    name: 'ampWHALE',
    description: 'ERIS staked WHALE',
    address: 'secret1jsaftfxnwwmjxccvc3zqaqmkcpp8fjnvvltvq6',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/ampwhale.svg',
    decimals: 6,
    coingecko_id: 'eris-amplified-whale',
    
  },
  {
    name: 'ANDR',
    description: 'Andromeda Governance Token',
    address: 'secret1dks96n3jz64dyulzjnjazt6cqemr0x0qgn7sd7',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/andr.png',
    decimals: 6,
    coingecko_id: 'andromeda-2',
    
  },
  {
    name: 'ARCH',
    description: 'Archway Governance Token',
    address: 'secret188z7hncvphw4us4h6uy6vlq4qf20jd2vm2vu8c',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/archway.svg',
    decimals: 18,
    coingecko_id: 'archway',
    
  },
  {
    name: 'ATOM',
    description: 'Cosmos Hub Governance Token',
    address: 'secret19e75l25r6sa6nhdf4lggjmgpw0vmpfvsw5cnpe',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/atom.svg',
    decimals: 6,
    coingecko_id: 'cosmos',
    
  },
  {
    name: 'bINJ',
    description: 'Backbone staked INJ',
    address: 'secret17xw4pelwmmhftscrdfntudyv77rkdxvaaelzvs',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/binj.png',
    decimals: 18,
    coingecko_id: '',
    
  },
  {
    name: 'bKUJI',
    description: 'Backbone staked KUJI',
    address: 'secret1ve536yukullq5rm67gdpssm23wynfv9gcqh6xn',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/bkuji.png',
    decimals: 6,
    coingecko_id: '',
    
  },
  {
    name: 'BLD',
    description: 'Agoric Governance Token',
    address: 'secret1uxvpq889uxjcpj656yjjexsqa3zqm6ntkyjsjq',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/bld.svg',
    decimals: 6,
    coingecko_id: 'agoric',
    
  },
  {
    name: 'bLUNA',
    description: 'Backbone staked LUNA',
    address: 'secret1wzqxaa6g6xa27vrwgygex8xurxdjzjtwzlgwy3',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/bluna.png',
    decimals: 6,
    coingecko_id: '',
    
  },
  {
    name: 'CHEQ',
    description: 'Cheqd Governance Token',
    address: 'secret1lfqlcnpveh6at723h5k2nu4jjqeuz0ukpxxdtt',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/cheq.svg',
    decimals: 9,
    coingecko_id: 'cheqd-network',
    
  },
  {
    name: 'CMDX',
    description: 'Comdex Governance Token',
    address: 'secret1mndng80tqppllk0qclgcnvccf9urak08e9w2fl',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/cmdx.svg',
    decimals: 6,
    coingecko_id: 'comdex',
    
  },
  {
    name: 'CMST',
    description: 'Composite USD Stablecoin',
    address: 'secret14l7s0evqw7grxjlesn8yyuk5lexuvkwgpfdxr5',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/cmst.svg',
    decimals: 6,
    coingecko_id: 'composite',
    
  },
  {
    name: 'dATOM',
    description: 'Drop ATOM',
    address: 'secret1x3cxgrwymk7yyelf2782r8ay020xyl96zq3rhh',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/datom.svg',
    decimals: 6,
    coingecko_id: 'cosmos',
    
  },
  {
    name: 'DOT',
    description: 'Polkadot Governance Token',
    address: 'secret1h5d3555tz37crrgl5rppu2np2fhaugq3q8yvv9',
    code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    image: '/dot.svg',
    decimals: 10,
    coingecko_id: 'polkadot',
    
  },
  {
    name: 'DVPN',
    description: 'Sentinel Governance Token',
    address: 'secret15qtw24mpmwkjessr46dnqruq4s4tstzf74jtkf',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/dvpn.svg',
    decimals: 6,
    coingecko_id: 'sentinel',
    
  },
  {
    name: 'dYdX',
    description: 'dYdX governance token',
    address: 'secret13lndcagy53wfzh69rtv0dex3a7cks0dv5emwke',
    code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    image: '/dydx.svg',
    decimals: 18,
    coingecko_id: 'dydx',
    
  },
  {
    name: 'DYM',
    description: 'Dymension governance token',
    address: 'secret1vfe63g7ndhqq9qu8v4n97fj69rcmr5fy0dun75',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/dymension.svg',
    decimals: 18,
    coingecko_id: 'dymension',
    
  },
  {
    name: 'ECLIP',
    description: 'Eclipse.fi governance token',
    address: 'secret1r4cldegd4peufgtaxf0qpagclqspeqaf8dm0l9',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/eclip.svg',
    decimals: 6,
    coingecko_id: 'eclipse-fi',
    
  },
  {
    name: 'FLIX',
    description: 'Omniflix governance token',
    address: 'secret1agpgsn50xjdggzdzd6kl4jz5ueywtkuhnyyhx5',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/flix.svg',
    decimals: 6,
    coingecko_id: 'omniflix-network',
    
  },
  {
    name: 'GRAV',
    description: 'Gravity Bridge Governance Token',
    address: 'secret1dtghxvrx35nznt8es3fwxrv4qh56tvxv22z79d',
    code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    image: '/grav.svg',
    decimals: 6,
    coingecko_id: 'graviton',
    
  },
  {
    name: 'HARBOR',
    description: 'Harbor Protocol Governance Token',
    address: 'secret1lrlkqhmwkh5y4326akn3hwn6j69f8l5656m43e',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/harbor.svg',
    decimals: 6,
    coingecko_id: 'harbor-2',
    
  },
  {
    name: 'HUAHUA',
    description: 'Chihuahua Governance Token',
    address: 'secret1ntvxnf5hzhzv8g87wn76ch6yswdujqlgmjh32w',
    code_hash: '182d7230c396fa8f548220ff88c34cb0291a00046df9ff2686e407c3b55692e9',
    image: '/huahua.svg',
    decimals: 6,
    coingecko_id: 'chihuahua-token',
    
  },
  {
    name: 'INJ',
    description: 'Injective Governance Token',
    address: 'secret14706vxakdzkz9a36872cs62vpl5qd84kpwvpew',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/inj.svg',
    decimals: 18,
    coingecko_id: 'injective-protocol',
    
  },
  {
    name: 'IST',
    description: 'Inter Protocol USD Stablecoin',
    address: 'secret1xmqsk8tnge0atzy4e079h0l2wrgz6splcq0a24',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/ist.svg',
    decimals: 6,
    coingecko_id: 'inter-stable-token',
    
  },
  {
    name: 'JKL',
    description: 'Jackal Governance Token',
    address: 'secret1sgaz455pmtgld6dequqayrdseq8vy2fc48n8y3',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/jkl.svg',
    decimals: 6,
    coingecko_id: 'jackal-protocol',
    
  },
  {
    name: 'JUNO',
    description: 'Juno Governance Token',
    address: 'secret1z6e4skg5g9w65u5sqznrmagu05xq8u6zjcdg4a',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/juno.svg',
    decimals: 6,
    coingecko_id: 'juno-network',
    
  },
  {
    name: 'KAVA',
    description: 'Kava Governance Token',
    address: 'secret1xyhphws090fqs33sxkytmagwynz54eqnpdqfrw',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/kava.svg',
    decimals: 6,
    coingecko_id: 'kava',
    
  },
  {
    name: 'KUJI',
    description: 'Kujira Governance Token',
    address: 'secret13hvh0rn0rcf5zr486yxlrucvwpzwqu2dsz6zu8',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/kuji.svg',
    decimals: 6,
    coingecko_id: 'kujira',
    
  },
  {
    name: 'KSM',
    description: 'Kusama Governance Token',
    address: 'secret1n4dp5dk6fufqmaalu9y7pnmk2r0hs7kc66a55f',
    code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    image: '/ksm.svg',
    decimals: 12,
    coingecko_id: 'kusama',
    
  },
  {
    name: 'NLS',
    description: 'Nolus Governance Token',
    address: 'secret1yafpcu9wpauy5ktymggzk9kmsvmce0hkl9p2h7',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/nolus.svg',
    decimals: 6,
    coingecko_id: 'nolus',
    
  },
  {
    name: 'NSTK',
    description: 'Unstake Governance Token',
    address: 'secret16l5g98d45gqvvn2g79q23h8flfq65cvr9r6c72',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/nstk.svg',
    decimals: 6,
    coingecko_id: 'unstake-fi',
    
  },
  {
    name: 'NTRN',
    description: 'Neutron Governance Token',
    address: 'secret1k644rvd979wn4erjd5g42uehayjwrq094g5uvj',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/ntrn.svg',
    decimals: 6,
    coingecko_id: 'neutron-3',
    
  },
  {
    name: 'NYM',
    description: 'Nym Governance Token',
    address: 'secret19gk280z6j9ywt3ln6fmfwfa36dkqeukcwqdw2k',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/nyx.png',
    decimals: 6,
    coingecko_id: 'nym',
    
  },
  {
    name: 'LUNA',
    description: 'Terra Governance Token',
    address: 'secret149e7c5j7w24pljg6em6zj2p557fuyhg8cnk7z8',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/luna2.svg',
    decimals: 6,
    coingecko_id: 'terra-luna-2',
    
  },
  {
    name: 'LVN',
    description: 'Levana native Token',
    address: 'secret1swrj0fqza3g98d7agm2nmukjfe44h7f5n8aavp',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/lvn.svg',
    decimals: 6,
    coingecko_id: 'levana-protocol',
    
  },
  {
    name: 'milkTIA',
    description: 'MilkyWay Staked TIA',
    address: 'secret1h08ru5kul3yajg7tqj6vq9k6rccnfw2yqy8glc',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/milktia.svg',
    decimals: 6,
    coingecko_id: 'milkyway-staked-tia',
    
  },
  {
    name: 'MNTA',
    description: 'Manta DAO Governance Token',
    address: 'secret15rxfz2w2tallu9gr9zjxj8wav2lnz4gl9pjccj',
    code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    image: '/mnta.svg',
    decimals: 6,
    coingecko_id: 'mantadao',
    
  },
  {
    name: 'ORAI',
    description: 'Oraichain Governance Token',
    address: 'secret1sv0nxz6athw5qm0hsxl90376c9zhrxhhprhjph',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/orai.svg',
    decimals: 6,
    coingecko_id: 'oraichain-token',
    
  },
  {
    name: 'OSMO',
    description: 'Osmosis Governance Token',
    address: 'secret150jec8mc2hzyyqak4umv6cfevelr0x9p0mjxgg',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/osmo.svg',
    decimals: 6,
    coingecko_id: 'osmosis',
    
  },
  {
    name: 'PAGE',
    description: 'PageDAO',
    address: 'secret1hhvfxy44e4gp6k7n4e37t7uyqa54dnp68egugg',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/page.png',
    decimals: 8,
    coingecko_id: 'page',
    
  },
  {
    name: 'PICA',
    description: 'Picasso Token',
    address: 'secret1e0y9vf4xr9wffyxsvlz35jzl5st2srkdl8frac',
    code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    image: '/pica.svg',
    decimals: 12,
    coingecko_id: 'picasso',
    
  },
  {
    name: 'pSTAKE',
    description: 'Persistence pSTAKE',
    address: 'secret1umeg3u5y949vz6jkgq0n4rhefsr84ws3duxmnz',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/pstake.svg',
    decimals: 18,
    coingecko_id: 'pstake-finance',
    
  },
  {
    name: 'qATOM',
    description: 'Quicksilver ATOM Staking Derivative',
    address: 'secret120cyurq25uvhkc7qjx7t28deuqslprxkc4rrzc',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/qatom.svg',
    decimals: 6,
    coingecko_id: 'qatom',
    
  },
  {
    name: 'QCK',
    description: 'Quicksilver Governance Token',
    address: 'secret17d8c96kezszpda3r2c5dtkzlkfxw6mtu7q98ka',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/qck.svg',
    decimals: 6,
    coingecko_id: 'quicksilver',
    
  },
  {
    name: 'USK',
    description: 'Kujira USD Stablecoin',
    address: 'secret1cj2fvj4ap79fl9euz8kqn0k5xlvck0pw9z9xhr',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/usk.svg',
    decimals: 6,
    coingecko_id: 'kujira',
    
  },
  {
    name: 'USDC',
    description: 'Native USDC Stablecoin from Noble',
    address: 'secret1chsejpk9kfj4vt9ec6xvyguw539gsdtr775us2',
    code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    image: '/usdc.svg',
    decimals: 6,
    coingecko_id: 'usd-coin',
    
  },
  {
    name: 'SAGA',
    description: 'SAGA Governance Token',
    address: 'secret19gmvklys9uywk3lf2e94wqwwc97r3jr5rwa2pa',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/saga.svg',
    decimals: 6,
    coingecko_id: 'saga-2',
    
  },
  {
    name: 'STARS',
    description: 'Stargaze Governance Token',
    address: 'secret1x0dqckf2khtxyrjwhlkrx9lwwmz44k24vcv2vv',
    code_hash: '5a085bd8ed89de92b35134ddd12505a602c7759ea25fb5c089ba03c8535b3042',
    image: '/stars.svg',
    decimals: 6,
    coingecko_id: 'stargaze',
    
  },
  {
    name: 'stATOM',
    description: 'Stride ATOM Staking Derivative',
    address: 'secret155w9uxruypsltvqfygh5urghd5v0zc6f9g69sq',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/statom.svg',
    decimals: 6,
    coingecko_id: 'stride-staked-atom',
    
  },
  {
    name: 'stINJ',
    description: 'Stride INJ Staking Derivative',
    address: 'secret1eurddal3m0tphtapad9awgzcuxwz8ptrdx7h4n',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/stinj.svg',
    decimals: 18,
    coingecko_id: 'stride-staked-injective',
    
  },
  {
    name: 'stJUNO',
    description: 'Stride JUNO Staking Derivative',
    address: 'secret1097nagcaavlkchl87xkqptww2qkwuvhdnsqs2v',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/stjuno.svg',
    decimals: 6,
    coingecko_id: 'stride-staked-juno',
    
  },
  {
    name: 'stkATOM',
    description: 'Persistence ATOM Staking Derivative',
    address: 'secret16vjfe24un4z7d3sp9vd0cmmfmz397nh2njpw3e',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/stkatom.svg',
    decimals: 6,
    coingecko_id: 'stkatom',
    
  },
  {
    name: 'stkDYDX',
    description: 'Persistence dYdX Staking Derivative',
    address: 'secret16dctnuy6lwydw834f4d0t3sw3f6jhav6ryhe4m',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/stkdydx.svg',
    decimals: 18,
    coingecko_id: '',
    
  },
  {
    name: 'stLUNA',
    description: 'Stride LUNA Staking Derivative',
    address: 'secret1rkgvpck36v2splc203sswdr0fxhyjcng7099a9',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/stluna.svg',
    decimals: 6,
    coingecko_id: 'stride-staked-luna',
    
  },
  {
    name: 'stOSMO',
    description: 'Stride OSMO Staking Derivative',
    address: 'secret1jrp6z8v679yaq65rndsr970mhaxzgfkymvc58g',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/stosmo.svg',
    decimals: 6,
    coingecko_id: 'stride-staked-osmo',
    
  },
  {
    name: 'STRD',
    description: 'Stride Governance Token',
    address: 'secret1rfhgs3ryqt7makakr2qw9zsqq4h5wdqawfa2aa',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/stride.svg',
    decimals: 6,
    coingecko_id: 'stride',
    
  },
  {
    name: 'stTIA',
    description: 'Stride TIA Staking Derivative',
    address: 'secret1l5d0vncwnlln0tz0m4tp9rgm740xl7th6es0q0',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/sttia.svg',
    decimals: 6,
    coingecko_id: 'stride-staked-tia',
    
  },
  {
    name: 'SWTH',
    description: 'Carbon Governance Token',
    address: 'secret1gech42jfcdke92tf9ltscpq7x0al8j7gkce030',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/swth.svg',
    decimals: 8,
    coingecko_id: 'switcheo',
    
  },
  {
    name: 'SYN',
    description: 'Galactic Syndicate Governance Token',
    address: 'secret1hjcv25hpgqtpwn90tz7pttr9fyz7l9pngzz8rl',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/syn.png',
    decimals: 6,
    coingecko_id: '',
    
  },
  {
    name: 'TIA',
    description: 'Celestia Governance Token',
    address: 'secret1s9h6mrp4k9gll4zfv5h78ll68hdq8ml7jrnn20',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/celestia.svg',
    decimals: 6,
    coingecko_id: 'celestia',
    
  },
  {
    name: 'UMEE',
    description: 'UX Chain Governance Token',
    address: 'secret1f6yg0typy608r567xekwyn3qf0k902llue9w2l',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/umee.svg',
    decimals: 6,
    coingecko_id: 'umee',
    
  },
  {
    name: 'USDT',
    description: 'Native USDT from Kava',
    address: 'secret1htd6s29m2j9h45knwkyucz98m306n32hx8dww3',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/usdt.svg',
    decimals: 6,
    coingecko_id: 'tether',
    
  },
  {
    name: 'WBTC',
    description: 'Wrapped Bitcoin from Osmosis',
    address: 'secret1v2kgmfwgd2an0l5ddralajg5wfdkemxl2vg4jp',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/wbtc.svg',
    decimals: 8,
    coingecko_id: 'bitcoin',
    
  },
  {
    name: 'WHALE',
    description: 'Migaloo Governance Token',
    address: 'secret1pcftk3ny87zm6thuxyfrtrlm2t8yev5unuvx6c',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/migaloo.svg',
    decimals: 6,
    coingecko_id: 'white-whale',
    
  },
  {
    name: 'wstETH',
    description: 'Wrapped Lido stETH from Neutron',
    address: 'secret1xx6m5c7d92h75evkmxqqe2xe5sk5qcqqs9t8ar',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/wsteth.svg',
    decimals: 18,
    coingecko_id: 'wrapped-steth',
    
  },
  {
    name: 'XPRT',
    description: 'Persistence Governance Token',
    address: 'secret1gnrrqjj5e2pwn4g262xjyypptu0ge3z3tps3nn',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/xprt.svg',
    decimals: 6,
    coingecko_id: 'persistence',
    
  }
]

// These are snip 20 tokens that are IBC compatible (no need to wrap them manually)
export const snips: Token[] = [
  {
    name: 'ALTER',
    description: 'ALTER dApp Token',
    is_snip20: true,
    address: 'secret17ljp7wwesff85ewt8xlauxjt7zrlr2hh27wgvr',
    code_hash: '68e859db0840969e4b20b825c2cd2f41c189da83ee703746daf7a658d26f494f',
    image: '/alter.svg',
    decimals: 6,
    coingecko_id: 'alter',
  },
  {
    name: 'AMBER',
    description: 'Amber DAO Token (very rare)',
    is_snip20: true,
    address: 'secret1s09x2xvfd2lp2skgzm29w2xtena7s8fq98v852',
    code_hash: '9a00ca4ad505e9be7e6e6dddf8d939b7ec7e9ac8e109c8681f10db9cacb36d42',
    image: '/amber.jpg',
    decimals: 6,
    coingecko_id: 'amberdao',
  },
  {
    name: 'dSHD',
    description: 'Shade Protocol SHD Staking Derivative',
    is_snip20: true,
    address: 'secret1fcef2mpuzw7py0e6eplrm06t5n6n2xfljvuzaq',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/dshd.svg',
    decimals: 8,
    coingecko_id: 'shade-protocol',
  },
  {
    name: 'FINA',
    description: 'Fina.cash Token',
    is_snip20: true,
    address: 'secret1s3z9xkpdsrhk86300tqnv6u466jmdmlegew2ve',
    code_hash: 'cfecd51a022c520c55429d974363fd7f065d20474af6a362da8737f73b7d9e80',
    image: '/fina.png',
    decimals: 6,
    coingecko_id: 'fina',
  },
  {
    name: 'SHD',
    description: 'Shade Protocol Governance Token',
    is_snip20: true,
    address: 'secret153wu605vvp934xhd4k9dtd640zsep5jkesstdm',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/shd.svg',
    decimals: 8,
    coingecko_id: 'shade-protocol',
  },
  {
    name: 'SHILL',
    description: 'Shillstake Governance Token',
    is_snip20: true,
    address: 'secret197dvnt9yjxwn8sjdlx05f7zuk27lsdxtfnwxse',
    code_hash: 'fe182fe93db6702b189537ea1ff6abf01b91d9b467e3d569981295497b861a1f',
    image: '/shill.svg',
    decimals: 6,
    coingecko_id: '',
  },
  {
    name: 'SILK',
    description: 'Shade Protocol Privacy-Preserving Stablecoin',
    is_snip20: true,
    address: 'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/silk.svg',
    decimals: 6,
    coingecko_id: 'silk-bcec1136-561c-4706-a42c-8b67d0d7f7d2',
  },
  {
    name: 'stkd-SCRT',
    description: 'Shade Protocol SCRT Staking Derivative',
    is_snip20: true,
    address: 'secret1k6u0cy4feepm6pehnz804zmwakuwdapm69tuc4',
    code_hash: 'f6be719b3c6feb498d3554ca0398eb6b7e7db262acb33f84a8f12106da6bbb09',
    image: '/stkd-scrt.svg',
    decimals: 6,
    coingecko_id: 'stkd-scrt',
  },
  {
    name: 'xATOM',
    description: 'Lent Secret ATOM from Shade',
    is_snip20: true,
    address: 'secret1ydpmlhqat9s2qxwc5ldyms8yp53nhqcvh6mz3c',
    code_hash: 'f639f9203684ca31f11faf4cc0c3d0de2c84695ae0272d219ed9864861c8b617',
    image: '/atom.svg',
    decimals: 6,
    coingecko_id: 'cosmos',
  }
]

export const ICSTokens: Token[] = [
  {
    name: 'USDC.axl',
    description: 'USDC stablecoin from Axelar',
    is_axelar_asset: true,
    address: 'secret1vkq022x4q8t8kx9de3r84u669l65xnwf2lg3e6',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/usdc.svg',
    decimals: 6,
    coingecko_id: 'usd-coin',
    axelar_denom: 'uusdc',
    
  },
  {
    name: 'AXL',
    description: 'Axelar Governance Token',
    is_axelar_asset: true,
    address: 'secret1vcau4rkn7mvfwl8hf0dqa9p0jr59983e3qqe3z',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/axl.svg',
    decimals: 6,
    coingecko_id: 'axelar',
    axelar_denom: 'uaxl',
    
  },
  {
    name: 'WETH',
    description: 'Wrapped ETH from Axelar',
    is_axelar_asset: true,
    address: 'secret139qfh3nmuzfgwsx2npnmnjl4hrvj3xq5rmq8a0',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/weth.svg',
    decimals: 18,
    coingecko_id: 'ethereum',
    axelar_denom: 'weth-wei',
    
  },
  {
    name: 'wstETH.axl',
    description: 'wstETH from Axelar',
    is_axelar_asset: true,
    address: 'secret148jzxkagwe0xulf8jt3sw4nuh2shdh788z3gyd',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/wsteth.svg',
    decimals: 18,
    coingecko_id: 'bridged-wrapped-steth-axelar',
    axelar_denom: 'wsteth-wei',
    
  },
  {
    name: 'WBTC.axl',
    description: 'Wrapped Bitcoin from Axelar',
    is_axelar_asset: true,
    address: 'secret1guyayjwg5f84daaxl7w84skd8naxvq8vz9upqx',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/wbtc.svg',
    decimals: 8,
    coingecko_id: 'bitcoin',
    axelar_denom: 'wbtc-satoshi',
    
  },
  {
    name: 'WBNB',
    description: 'Wrapped Binance Coin from Axelar',
    is_axelar_asset: true,
    address: 'secret19xsac2kstky8nhgvvz257uszt44g0cu6ycd5e4',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/wbnb.svg',
    decimals: 18,
    coingecko_id: 'binancecoin',
    axelar_denom: 'wbnb-wei',
    
  },
  {
    name: 'BUSD',
    description: 'Binance USD from Axelar',
    is_axelar_asset: true,
    address: 'secret1t642ayn9rhl5q9vuh4n2jkx0gpa9r6c3sl96te',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/abusd.svg',
    decimals: 18,
    coingecko_id: 'busd',
    axelar_denom: 'busd-wei',
    
  },
  {
    name: 'DAI',
    description: 'DAI from Axelar',
    is_axelar_asset: true,
    address: 'secret1c2prkwd8e6ratk42l4vrnwz34knfju6hmp7mg7',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/adai.svg',
    decimals: 18,
    coingecko_id: 'dai',
    axelar_denom: 'dai-wei',
    
  },
  {
    name: 'LINK',
    description: 'LINK from Axelar',
    is_axelar_asset: true,
    address: 'secret1walthx26qaas50nwzg2rsqttlkf58q3hvjha5k',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/alink.svg',
    decimals: 18,
    coingecko_id: 'chainlink',
    axelar_denom: 'link-wei',
    
  },
  {
    name: 'UNI',
    description: 'UNI from Axelar',
    is_axelar_asset: true,
    address: 'secret1egqlkasa6xe6efmfp9562sfj07lq44z7jngu5k',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/auni.svg',
    decimals: 18,
    coingecko_id: 'uniswap',
    axelar_denom: 'uni-wei',
    
  },
  {
    name: 'USDT.axl',
    description: 'USDT stablecoin from Axelar',
    is_axelar_asset: true,
    address: 'secret1wk5j2cntwg2fgklf0uta3tlkvt87alfj7kepuw',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/usdt.svg',
    decimals: 6,
    coingecko_id: 'tether',
    axelar_denom: 'uusdt',
    
  },
  {
    name: 'FRAX',
    description: 'FRAX from Axelar',
    is_axelar_asset: true,
    address: 'secret16e230j6qm5u5q30pcc6qv726ae30ak6lzq0zvf',
    code_hash: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
    image: '/afrax.svg',
    decimals: 18,
    coingecko_id: 'frax',
    axelar_denom: 'frax-wei',
    
  }
]

export const FeaturedSecretTokens = [...snips, ...tokens, ...ICSTokens];